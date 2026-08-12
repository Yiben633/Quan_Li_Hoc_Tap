import { buildPlan } from '../src/modules/ai/coach/planningEngine.js';

const date = (value: string) => new Date(`${value}.000Z`);
const slot = (startAt: string, endAt: string) => ({ startAt: date(startAt), endAt: date(endAt), durationMinutes: 0 });
const task = (overrides: Record<string, unknown> = {}) => ({
  id: 'task-1',
  title: 'Learn Java',
  status: 'todo',
  priority: 'medium',
  estimatedMinutes: 45,
  ...overrides,
});

describe('AI Coach planning engine', () => {
  it('splits a long task into bounded sessions with breaks', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ estimatedMinutes: 180 })],
      availableSlots: [slot('2026-08-10T09:00:00', '2026-08-10T12:15:00')],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 240, breakMinutes: 5 },
    });

    expect(result.sessions.map((session) => session.minutes)).toEqual([45, 45, 45, 45]);
    expect(result.sessions.map((session) => session.sequence)).toEqual([1, 2, 3, 4]);
    expect(result.sessions[1]?.startAt.toISOString()).toBe('2026-08-10T09:50:00.000Z');
  });

  it('respects daily limits and continues on a later day', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ estimatedMinutes: 180 })],
      availableSlots: [
        slot('2026-08-10T09:00:00', '2026-08-10T12:00:00'),
        slot('2026-08-11T09:00:00', '2026-08-11T12:00:00'),
      ],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 90, breakMinutes: 0 },
    });

    expect(result.sessions).toHaveLength(4);
    expect(result.sessions.filter((session) => session.startAt.getUTCDate() === 10).reduce((total, session) => total + session.minutes, 0)).toBe(90);
    expect(result.sessions.filter((session) => session.startAt.getUTCDate() === 11).reduce((total, session) => total + session.minutes, 0)).toBe(90);
  });

  it('schedules before a deadline before using later slots', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ dueDate: '2026-08-10T12:00:00.000Z', estimatedMinutes: 90 })],
      availableSlots: [
        slot('2026-08-10T13:00:00', '2026-08-10T14:30:00'),
        slot('2026-08-10T09:00:00', '2026-08-10T10:30:00'),
      ],
      preferences: { maxSessionMinutes: 90, maxMinutesPerDay: 180, breakMinutes: 0 },
    });

    expect(result.sessions[0]?.startAt.toISOString()).toBe('2026-08-10T09:00:00.000Z');
    expect(result.warnings).toHaveLength(0);
  });

  it('does not schedule a task before its future start date', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ startDate: '2026-08-11T10:00:00.000Z', estimatedMinutes: 45 })],
      availableSlots: [slot('2026-08-10T09:00:00', '2026-08-11T12:00:00')],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 120, breakMinutes: 0 },
    });

    expect(result.sessions[0]?.startAt.toISOString()).toBe('2026-08-11T10:00:00.000Z');
  });

  it('excludes completed tasks and never creates overlapping sessions', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ id: 'done', status: 'done' }), task({ id: 'open', estimatedMinutes: 90 })],
      availableSlots: [slot('2026-08-10T09:00:00', '2026-08-10T11:00:00')],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 120, breakMinutes: 5 },
    });

    expect(result.sessions.map((session) => session.taskId)).toEqual(['open', 'open']);
    expect(result.sessions[0]!.endAt.getTime()).toBeLessThanOrEqual(result.sessions[1]!.startAt.getTime());
  });

  it('returns unallocated work and warnings when availability is insufficient', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ estimatedMinutes: 90 })],
      availableSlots: [slot('2026-08-10T09:00:00', '2026-08-10T10:00:00')],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 120, breakMinutes: 0 },
    });

    expect(result.unallocatedTasks).toEqual([{ taskId: 'task-1', title: 'Learn Java', remainingMinutes: 30 }]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INSUFFICIENT_TIME', taskId: 'task-1' }),
    ]));
  });

  it('returns a daily limit warning when that limit blocks more planning', () => {
    const result = buildPlan({
      now: date('2026-08-10T08:00:00'),
      tasks: [task({ estimatedMinutes: 90 })],
      availableSlots: [slot('2026-08-10T09:00:00', '2026-08-10T12:00:00')],
      preferences: { maxSessionMinutes: 45, maxMinutesPerDay: 45, breakMinutes: 0 },
    });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DAILY_LIMIT_EXCEEDED', taskId: 'task-1' }),
    ]));
  });
});
