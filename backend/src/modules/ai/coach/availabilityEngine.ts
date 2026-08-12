export type AvailabilityRange = {
  startAt: Date;
  endAt: Date;
};

export type BusyEventInput = {
  startAt: Date;
  endAt?: Date | null;
};

export type ScheduleBusyInput = {
  startDate: Date;
  endDate?: Date | null;
  startTime: string;
  endTime: string;
  dayOfWeek?: number | null;
  recurrenceRule: 'none' | 'daily' | 'weekly';
};

export type AvailabilityPreferences = {
  studyStartTime?: string;
  studyEndTime?: string;
  studyDays?: number[];
  minimumSlotMinutes?: number;
};

export type AvailableSlot = {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
};

export type BuildAvailableSlotsInput = {
  range: AvailabilityRange;
  timezone: string;
  events?: BusyEventInput[];
  schedules?: ScheduleBusyInput[];
  preferences?: AvailabilityPreferences;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type BusyInterval = {
  startAt: Date;
  endAt: Date;
};

const DEFAULT_STUDY_START_TIME = '08:00';
const DEFAULT_STUDY_END_TIME = '22:00';
const DEFAULT_MINIMUM_SLOT_MINUTES = 25;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function assertTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timezone}`);
  }
}

function dateParts(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function zonedDateTimeToUtc(parts: DateParts, timezone: string): Date {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let timestamp = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = dateParts(new Date(timestamp), timezone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    timestamp += target - actualAsUtc;
  }

  return new Date(timestamp);
}

function addLocalDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

function localDateParts(date: Date, timezone: string): DateParts {
  const parts = dateParts(date, timezone);
  return { ...parts, hour: 0, minute: 0, second: 0 };
}

function localDayTimestamp(parts: DateParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function localDayOfWeek(parts: DateParts) {
  return new Date(localDayTimestamp(parts)).getUTCDay();
}

function parseTime(value: string): { hour: number; minute: number } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new RangeError(`Invalid time: ${value}`);
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function localTimeOnDay(day: DateParts, time: string, timezone: string) {
  const parsed = parseTime(time);
  return zonedDateTimeToUtc({ ...day, hour: parsed.hour, minute: parsed.minute, second: 0 }, timezone);
}

function intersects(interval: BusyInterval, range: AvailabilityRange) {
  return interval.startAt < range.endAt && interval.endAt > range.startAt;
}

function clip(interval: BusyInterval, range: AvailabilityRange): BusyInterval | null {
  const startAt = interval.startAt > range.startAt ? interval.startAt : range.startAt;
  const endAt = interval.endAt < range.endAt ? interval.endAt : range.endAt;
  return endAt > startAt ? { startAt, endAt } : null;
}

function mergeBusyIntervals(intervals: BusyInterval[]): BusyInterval[] {
  const sorted = intervals
    .filter((interval) => interval.endAt > interval.startAt)
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
  const merged: BusyInterval[] = [];

  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.startAt > previous.endAt) {
      merged.push({ ...interval });
      continue;
    }
    if (interval.endAt > previous.endAt) previous.endAt = interval.endAt;
  }

  return merged;
}

function scheduleOccursOnDay(schedule: ScheduleBusyInput, day: DateParts, timezone: string) {
  const scheduleStart = localDateParts(schedule.startDate, timezone);
  const scheduleEnd = schedule.endDate ? localDateParts(schedule.endDate, timezone) : null;
  const dayTimestamp = localDayTimestamp(day);
  if (dayTimestamp < localDayTimestamp(scheduleStart) || (scheduleEnd && dayTimestamp > localDayTimestamp(scheduleEnd))) return false;
  if (schedule.recurrenceRule === 'none') return dayTimestamp === localDayTimestamp(scheduleStart);
  if (schedule.recurrenceRule === 'daily') return true;
  return localDayOfWeek(day) === (schedule.dayOfWeek ?? localDayOfWeek(scheduleStart));
}

function scheduleIntervals(schedules: ScheduleBusyInput[], range: AvailabilityRange, timezone: string): BusyInterval[] {
  const firstDay = addLocalDays(localDateParts(range.startAt, timezone), -1);
  const lastDay = localDateParts(range.endAt, timezone);
  const intervals: BusyInterval[] = [];

  for (let day = firstDay; localDayTimestamp(day) <= localDayTimestamp(lastDay); day = addLocalDays(day, 1)) {
    for (const schedule of schedules) {
      if (!scheduleOccursOnDay(schedule, day, timezone)) continue;
      const startAt = localTimeOnDay(day, schedule.startTime, timezone);
      let endAt = localTimeOnDay(day, schedule.endTime, timezone);
      if (endAt <= startAt) endAt = localTimeOnDay(addLocalDays(day, 1), schedule.endTime, timezone);
      const interval = { startAt, endAt };
      if (intersects(interval, range)) intervals.push(interval);
    }
  }

  return intervals;
}

function buildStudyWindows(range: AvailabilityRange, timezone: string, preferences: AvailabilityPreferences): BusyInterval[] {
  const startTime = preferences.studyStartTime ?? DEFAULT_STUDY_START_TIME;
  const endTime = preferences.studyEndTime ?? DEFAULT_STUDY_END_TIME;
  const allowedDays = new Set(preferences.studyDays ?? ALL_DAYS);
  const firstDay = localDateParts(range.startAt, timezone);
  const lastDay = localDateParts(range.endAt, timezone);
  const windows: BusyInterval[] = [];

  for (let day = firstDay; localDayTimestamp(day) <= localDayTimestamp(lastDay); day = addLocalDays(day, 1)) {
    if (!allowedDays.has(localDayOfWeek(day))) continue;
    const startAt = localTimeOnDay(day, startTime, timezone);
    let endAt = localTimeOnDay(day, endTime, timezone);
    if (endAt <= startAt) endAt = localTimeOnDay(addLocalDays(day, 1), endTime, timezone);
    const clipped = clip({ startAt, endAt }, range);
    if (clipped) windows.push(clipped);
  }

  return windows;
}

function toSlots(window: BusyInterval, busyIntervals: BusyInterval[], minimumSlotMinutes: number): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  let cursor = window.startAt;

  for (const busy of busyIntervals) {
    if (busy.endAt <= cursor || busy.startAt >= window.endAt) continue;
    const busyStart = busy.startAt > window.startAt ? busy.startAt : window.startAt;
    const busyEnd = busy.endAt < window.endAt ? busy.endAt : window.endAt;
    const durationMinutes = Math.round((busyStart.getTime() - cursor.getTime()) / 60_000);
    if (durationMinutes >= minimumSlotMinutes) slots.push({ startAt: cursor, endAt: busyStart, durationMinutes });
    if (busyEnd > cursor) cursor = busyEnd;
  }

  const durationMinutes = Math.round((window.endAt.getTime() - cursor.getTime()) / 60_000);
  if (durationMinutes >= minimumSlotMinutes) slots.push({ startAt: cursor, endAt: window.endAt, durationMinutes });
  return slots;
}

export function buildAvailableSlots(input: BuildAvailableSlotsInput): AvailableSlot[] {
  const { range, timezone, events = [], schedules = [], preferences = {} } = input;
  assertTimezone(timezone);
  if (range.endAt <= range.startAt) return [];

  const minimumSlotMinutes = Math.max(1, Math.floor(preferences.minimumSlotMinutes ?? DEFAULT_MINIMUM_SLOT_MINUTES));
  const eventIntervals = events.flatMap((event) => {
    const endAt = event.endAt ?? event.startAt;
    const interval = { startAt: event.startAt, endAt };
    return intersects(interval, range) ? [interval] : [];
  });
  const busyIntervals = mergeBusyIntervals([...eventIntervals, ...scheduleIntervals(schedules, range, timezone)]);

  return buildStudyWindows(range, timezone, preferences)
    .flatMap((window) => toSlots(window, busyIntervals, minimumSlotMinutes))
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}
