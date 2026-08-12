import { buildAvailableSlots } from '../src/modules/ai/coach/availabilityEngine.js';

const utc = (value: string) => new Date(`${value}.000Z`);
const range = (startAt: string, endAt: string) => ({ startAt: utc(startAt), endAt: utc(endAt) });

function slotTimes(slots: ReturnType<typeof buildAvailableSlots>) {
  return slots.map((slot) => ({ startAt: slot.startAt.toISOString(), endAt: slot.endAt.toISOString(), durationMinutes: slot.durationMinutes }));
}

describe('buildAvailableSlots', () => {
  const baseInput = {
    range: range('2026-08-10T00:00:00', '2026-08-11T00:00:00'),
    timezone: 'UTC',
    preferences: { studyStartTime: '09:00', studyEndTime: '12:00' },
  };

  it('returns the study window when there are no events', () => {
    expect(slotTimes(buildAvailableSlots(baseInput))).toEqual([
      { startAt: '2026-08-10T09:00:00.000Z', endAt: '2026-08-10T12:00:00.000Z', durationMinutes: 180 },
    ]);
  });

  it('splits a study window around one event', () => {
    const slots = buildAvailableSlots({
      ...baseInput,
      events: [{ startAt: utc('2026-08-10T10:00:00'), endAt: utc('2026-08-10T11:00:00') }],
    });

    expect(slotTimes(slots)).toEqual([
      { startAt: '2026-08-10T09:00:00.000Z', endAt: '2026-08-10T10:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-10T11:00:00.000Z', endAt: '2026-08-10T12:00:00.000Z', durationMinutes: 60 },
    ]);
  });

  it('merges overlapping events before subtracting them', () => {
    const slots = buildAvailableSlots({
      ...baseInput,
      events: [
        { startAt: utc('2026-08-10T10:00:00'), endAt: utc('2026-08-10T11:00:00') },
        { startAt: utc('2026-08-10T10:30:00'), endAt: utc('2026-08-10T11:30:00') },
      ],
    });

    expect(slotTimes(slots)).toEqual([
      { startAt: '2026-08-10T09:00:00.000Z', endAt: '2026-08-10T10:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-10T11:30:00.000Z', endAt: '2026-08-10T12:00:00.000Z', durationMinutes: 30 },
    ]);
  });

  it('returns no slots when the study window is fully busy', () => {
    const slots = buildAvailableSlots({
      ...baseInput,
      events: [{ startAt: utc('2026-08-10T08:00:00'), endAt: utc('2026-08-10T13:00:00') }],
    });

    expect(slots).toEqual([]);
  });

  it('handles an event and study window that span midnight', () => {
    const slots = buildAvailableSlots({
      range: range('2026-08-10T22:00:00', '2026-08-11T02:00:00'),
      timezone: 'UTC',
      preferences: { studyStartTime: '22:00', studyEndTime: '02:00' },
      events: [{ startAt: utc('2026-08-10T23:00:00'), endAt: utc('2026-08-11T01:00:00') }],
    });

    expect(slotTimes(slots)).toEqual([
      { startAt: '2026-08-10T22:00:00.000Z', endAt: '2026-08-10T23:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-11T01:00:00.000Z', endAt: '2026-08-11T02:00:00.000Z', durationMinutes: 60 },
    ]);
  });

  it('creates schedule busy intervals in the user timezone', () => {
    const slots = buildAvailableSlots({
      range: range('2026-08-10T00:00:00', '2026-08-11T00:00:00'),
      timezone: 'Asia/Ho_Chi_Minh',
      preferences: { studyStartTime: '09:00', studyEndTime: '11:00' },
      schedules: [{
        startDate: utc('2026-08-09T17:00:00'),
        startTime: '09:30',
        endTime: '10:00',
        recurrenceRule: 'none',
      }],
    });

    expect(slotTimes(slots)).toEqual([
      { startAt: '2026-08-10T02:00:00.000Z', endAt: '2026-08-10T02:30:00.000Z', durationMinutes: 30 },
      { startAt: '2026-08-10T03:00:00.000Z', endAt: '2026-08-10T04:00:00.000Z', durationMinutes: 60 },
    ]);
  });

  it('expands weekly schedules only on their configured weekday', () => {
    const slots = buildAvailableSlots({
      range: range('2026-08-10T00:00:00', '2026-08-18T00:00:00'),
      timezone: 'UTC',
      preferences: { studyStartTime: '09:00', studyEndTime: '12:00', studyDays: [1] },
      schedules: [{
        startDate: utc('2026-08-10T00:00:00'),
        startTime: '10:00',
        endTime: '11:00',
        dayOfWeek: 1,
        recurrenceRule: 'weekly',
      }],
    });

    expect(slotTimes(slots)).toEqual([
      { startAt: '2026-08-10T09:00:00.000Z', endAt: '2026-08-10T10:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-10T11:00:00.000Z', endAt: '2026-08-10T12:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-17T09:00:00.000Z', endAt: '2026-08-17T10:00:00.000Z', durationMinutes: 60 },
      { startAt: '2026-08-17T11:00:00.000Z', endAt: '2026-08-17T12:00:00.000Z', durationMinutes: 60 },
    ]);
  });
});
