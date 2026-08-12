import { scoreTask, sortTasksForPlanning } from '../src/modules/ai/coach/taskScoring.js';

const now = new Date('2026-08-12T10:00:00.000Z');

function task(overrides: Partial<Parameters<typeof scoreTask>[0]> = {}) {
  return {
    id: 'task',
    title: 'Task',
    status: 'todo',
    priority: 'medium',
    ...overrides,
  };
}

describe('AI Coach task scoring', () => {
  it('scores overdue work above work due today', () => {
    const overdue = scoreTask(task({ id: 'overdue', dueDate: '2026-08-11T20:00:00.000Z' }), now);
    const today = scoreTask(task({ id: 'today', dueDate: '2026-08-12T20:00:00.000Z' }), now);

    expect(overdue).toBeGreaterThan(today!);
  });

  it('scores work due today above work due next week', () => {
    const today = scoreTask(task({ id: 'today', dueDate: '2026-08-12T20:00:00.000Z' }), now);
    const nextWeek = scoreTask(task({ id: 'next-week', dueDate: '2026-08-19T20:00:00.000Z' }), now);

    expect(today).toBeGreaterThan(nextWeek!);
  });

  it('adds an urgency bonus without random ordering', () => {
    const normal = scoreTask(task({ id: 'normal' }), now);
    const urgent = scoreTask(task({ id: 'urgent', priority: 'urgent' }), now);

    expect(urgent).toBe((normal ?? 0) + 40);
  });

  it('excludes completed tasks and keeps tasks without a deadline valid', () => {
    expect(scoreTask(task({ status: 'done' }), now)).toBeNull();
    expect(sortTasksForPlanning([
      task({ id: 'done', status: 'done' }),
      task({ id: 'no-deadline' }),
    ], now).map((item) => item.id)).toEqual(['no-deadline']);
  });

  it('places future-start tasks after work that can start now', () => {
    const sorted = sortTasksForPlanning([
      task({ id: 'future', priority: 'urgent', startDate: '2026-08-13T10:00:00.000Z' }),
      task({ id: 'available', priority: 'low' }),
    ], now);

    expect(sorted.map((item) => item.id)).toEqual(['available', 'future']);
  });
});
