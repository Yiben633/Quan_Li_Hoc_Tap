import type { AvailableSlot } from './availabilityEngine.js';
import { sortTasksForPlanning, type ScorableTask } from './taskScoring.js';

export type PlanningTask = ScorableTask & {
  subjectId?: string | null;
  estimatedMinutes: number | null;
};

export type PlanningPreferences = {
  maxSessionMinutes?: number;
  maxMinutesPerDay?: number;
  breakMinutes?: number;
  timezone?: string;
};

export type PlannedSession = {
  id: string;
  taskId: string;
  subjectId: string | null;
  title: string;
  startAt: Date;
  endAt: Date;
  minutes: number;
  sequence: number;
};

export type PlanningWarningCode =
  | 'INSUFFICIENT_TIME'
  | 'NO_AVAILABLE_SLOT'
  | 'DEADLINE_AT_RISK'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'MISSING_ESTIMATE';

export type PlanningWarning = {
  code: PlanningWarningCode;
  taskId?: string;
  message: string;
};

export type UnallocatedTask = {
  taskId: string;
  title: string;
  remainingMinutes: number;
};

export type PlanningResult = {
  sessions: PlannedSession[];
  warnings: PlanningWarning[];
  unallocatedTasks: UnallocatedTask[];
  metrics: {
    taskCount: number;
    scheduledTaskCount: number;
    sessionCount: number;
    totalRequestedMinutes: number;
    totalScheduledMinutes: number;
    totalUnallocatedMinutes: number;
  };
};

export type BuildPlanInput = {
  tasks: PlanningTask[];
  availableSlots: AvailableSlot[];
  preferences?: PlanningPreferences;
  now?: Date;
};

type SlotState = {
  startAt: Date;
  endAt: Date;
  cursor: Date;
};

const DEFAULT_MAX_SESSION_MINUTES = 45;
const DEFAULT_MAX_MINUTES_PER_DAY = 120;
const DEFAULT_BREAK_MINUTES = 5;

function positiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value === undefined) return fallback;
  return Math.max(1, Math.floor(value));
}

function nonNegativeInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value === undefined) return fallback;
  return Math.max(0, Math.floor(value));
}

function validDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function timezoneDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function nextLocalMidnight(date: Date, timezone: string) {
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
  const nextDay = new Date(Date.UTC(value('year'), value('month') - 1, value('day') + 1));
  const target = Date.UTC(nextDay.getUTCFullYear(), nextDay.getUTCMonth(), nextDay.getUTCDate());
  let timestamp = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(timestamp));
    const actualValue = (type: Intl.DateTimeFormatPartTypes) => Number(actual.find((part) => part.type === type)?.value ?? 0);
    const actualAsUtc = Date.UTC(actualValue('year'), actualValue('month') - 1, actualValue('day'), actualValue('hour'), actualValue('minute'), actualValue('second'));
    timestamp += target - actualAsUtc;
  }

  return new Date(timestamp);
}

function minutesBetween(startAt: Date, endAt: Date) {
  return Math.max(0, Math.floor((endAt.getTime() - startAt.getTime()) / 60_000));
}

function createSlotStates(slots: AvailableSlot[]) {
  return slots
    .filter((slot) => slot.endAt > slot.startAt)
    .map((slot) => ({ startAt: slot.startAt, endAt: slot.endAt, cursor: slot.startAt }))
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}

type AllocationAttempt = {
  allocation: { startAt: Date; endAt: Date; minutes: number } | null;
  dailyLimitReached: boolean;
};

function allocateSession(
  slots: SlotState[],
  dailyMinutes: Map<string, number>,
  remainingMinutes: number,
  notBefore: Date | null,
  dueAt: Date | null,
  maxSessionMinutes: number,
  maxMinutesPerDay: number,
  breakMinutes: number,
  timezone: string,
  beforeDeadline: boolean,
): AllocationAttempt {
  let dailyLimitReached = false;

  for (const slot of slots) {
    if (slot.cursor >= slot.endAt) continue;
    const startAt = notBefore && notBefore > slot.cursor ? notBefore : slot.cursor;
    if (startAt >= slot.endAt) continue;
    if (beforeDeadline && dueAt && startAt >= dueAt) continue;

    const dayKey = timezoneDateKey(startAt, timezone);
    const remainingDailyMinutes = maxMinutesPerDay - (dailyMinutes.get(dayKey) ?? 0);
    if (remainingDailyMinutes <= 0) {
      dailyLimitReached = true;
      continue;
    }

    const sessionCeiling = beforeDeadline && dueAt && dueAt < slot.endAt ? dueAt : slot.endAt;
    const midnight = nextLocalMidnight(startAt, timezone);
    const dayCeiling = midnight < sessionCeiling ? midnight : sessionCeiling;
    const minutes = Math.min(
      remainingMinutes,
      maxSessionMinutes,
      remainingDailyMinutes,
      minutesBetween(startAt, dayCeiling),
    );
    if (minutes <= 0) continue;

    const endAt = new Date(startAt.getTime() + minutes * 60_000);
    slot.cursor = new Date(endAt.getTime() + breakMinutes * 60_000);
    dailyMinutes.set(dayKey, (dailyMinutes.get(dayKey) ?? 0) + minutes);
    return { allocation: { startAt, endAt, minutes }, dailyLimitReached };
  }

  return { allocation: null, dailyLimitReached };
}

export function buildPlan(input: BuildPlanInput): PlanningResult {
  const now = input.now ?? new Date();
  const preferences = input.preferences ?? {};
  const maxSessionMinutes = positiveInteger(preferences.maxSessionMinutes, DEFAULT_MAX_SESSION_MINUTES);
  const maxMinutesPerDay = positiveInteger(preferences.maxMinutesPerDay, DEFAULT_MAX_MINUTES_PER_DAY);
  const breakMinutes = nonNegativeInteger(preferences.breakMinutes, DEFAULT_BREAK_MINUTES);
  const timezone = preferences.timezone ?? 'UTC';
  const slots = createSlotStates(input.availableSlots);
  const dailyMinutes = new Map<string, number>();
  const sessions: PlannedSession[] = [];
  const warnings: PlanningWarning[] = [];
  const unallocatedTasks: UnallocatedTask[] = [];
  const tasks = sortTasksForPlanning(input.tasks, now);

  for (const task of tasks) {
    const estimate = task.estimatedMinutes ?? 0;
    if (estimate <= 0) {
      warnings.push({ code: 'MISSING_ESTIMATE', taskId: task.id, message: `Công việc "${task.title}" chưa có thời gian dự kiến hợp lệ.` });
      unallocatedTasks.push({ taskId: task.id, title: task.title, remainingMinutes: 0 });
      continue;
    }

    const dueAt = validDate(task.dueDate);
    const notBefore = validDate(task.startDate);
    let remainingMinutes = estimate;
    let sequence = 1;
    let scheduledAfterDeadline = false;
    let dailyLimitReached = false;

    while (remainingMinutes > 0) {
      const beforeDeadline = dueAt !== null && dueAt > now;
      const preferredAttempt = allocateSession(
        slots,
        dailyMinutes,
        remainingMinutes,
        notBefore,
        dueAt,
        maxSessionMinutes,
        maxMinutesPerDay,
        breakMinutes,
        timezone,
        beforeDeadline,
      );
      const fallbackAttempt = preferredAttempt.allocation || !beforeDeadline
        ? null
        : allocateSession(
          slots,
          dailyMinutes,
          remainingMinutes,
          notBefore,
          dueAt,
          maxSessionMinutes,
          maxMinutesPerDay,
          breakMinutes,
          timezone,
          false,
        );
      dailyLimitReached ||= preferredAttempt.dailyLimitReached || fallbackAttempt?.dailyLimitReached === true;
      const allocation = preferredAttempt.allocation ?? fallbackAttempt?.allocation ?? null;

      if (!allocation) break;
      if (dueAt && allocation.endAt > dueAt) scheduledAfterDeadline = true;
      sessions.push({
        id: `${task.id}:${sequence}`,
        taskId: task.id,
        subjectId: task.subjectId ?? null,
        title: task.title,
        startAt: allocation.startAt,
        endAt: allocation.endAt,
        minutes: allocation.minutes,
        sequence,
      });
      remainingMinutes -= allocation.minutes;
      sequence += 1;
    }

    if (dueAt && (scheduledAfterDeadline || remainingMinutes > 0)) {
      warnings.push({ code: 'DEADLINE_AT_RISK', taskId: task.id, message: `Không đủ thời gian trước deadline cho công việc "${task.title}".` });
    }
    if (remainingMinutes > 0) {
      warnings.push({
        code: slots.length === 0 ? 'NO_AVAILABLE_SLOT' : dailyLimitReached ? 'DAILY_LIMIT_EXCEEDED' : 'INSUFFICIENT_TIME',
        taskId: task.id,
        message: slots.length === 0
          ? `Chưa có khung giờ rảnh để xếp công việc "${task.title}".`
          : dailyLimitReached
            ? `Đã đạt giới hạn thời gian học mỗi ngày khi xếp công việc "${task.title}".`
            : `Không đủ thời gian rảnh để xếp hoàn toàn công việc "${task.title}".`,
      });
      unallocatedTasks.push({ taskId: task.id, title: task.title, remainingMinutes });
    }
  }

  const scheduledTaskIds = new Set(sessions.map((session) => session.taskId));
  const totalRequestedMinutes = tasks.reduce((total, task) => total + Math.max(0, task.estimatedMinutes ?? 0), 0);
  const totalScheduledMinutes = sessions.reduce((total, session) => total + session.minutes, 0);

  return {
    sessions,
    warnings,
    unallocatedTasks,
    metrics: {
      taskCount: tasks.length,
      scheduledTaskCount: scheduledTaskIds.size,
      sessionCount: sessions.length,
      totalRequestedMinutes,
      totalScheduledMinutes,
      totalUnallocatedMinutes: unallocatedTasks.reduce((total, task) => total + task.remainingMinutes, 0),
    },
  };
}
