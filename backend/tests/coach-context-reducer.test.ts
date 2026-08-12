import { reduceCoachContext } from '../src/modules/ai/coach/coachContext.reducer.js';
import type { StudyCoachContext } from '../src/modules/ai/coach/coach.types.js';

const context: StudyCoachContext = {
  now: '2026-08-10T12:00:00.000Z',
  timezone: 'Asia/Ho_Chi_Minh',
  subjects: [],
  tasks: [
    { id: 'normal', title: 'Normal', subjectId: null, studyPlanId: null, startDate: null, dueDate: null, priority: 'medium', status: 'todo', estimatedMinutes: null, difficulty: null },
    { id: 'high', title: 'High', subjectId: null, studyPlanId: null, startDate: null, dueDate: null, priority: 'high', status: 'todo', estimatedMinutes: null, difficulty: null },
    { id: 'progress', title: 'In progress', subjectId: null, studyPlanId: null, startDate: null, dueDate: null, priority: 'low', status: 'in_progress', estimatedMinutes: null, difficulty: null },
    { id: 'soon', title: 'Due soon', subjectId: null, studyPlanId: null, startDate: null, dueDate: '2026-08-11T12:00:00.000Z', priority: 'low', status: 'todo', estimatedMinutes: null, difficulty: null },
    { id: 'overdue', title: 'Overdue', subjectId: null, studyPlanId: null, startDate: null, dueDate: '2026-08-09T12:00:00.000Z', priority: 'low', status: 'todo', estimatedMinutes: null, difficulty: null },
  ],
  plans: [],
  calendar: [
    { id: 'later', type: 'event', title: 'Later', subjectId: null, startAt: '2026-08-12T12:00:00.000Z', endAt: null },
    { id: 'first', type: 'event', title: 'First', subjectId: null, startAt: '2026-08-10T13:00:00.000Z', endAt: null },
  ],
  goals: [],
  stats: { studyMinutesThisWeek: 0, completedTasksThisWeek: 0 },
};

describe('reduceCoachContext', () => {
  it('keeps the most relevant tasks in deterministic priority order', () => {
    const reduced = reduceCoachContext(context, { tasks: 3 });

    expect(reduced.tasks.map((task) => task.id)).toEqual(['overdue', 'soon', 'progress']);
    expect(reduced.metrics).toMatchObject({ taskCountOriginal: 5, taskCountIncluded: 3 });
  });

  it('sorts upcoming calendar items and reports the included count', () => {
    const reduced = reduceCoachContext(context, { calendar: 1 });

    expect(reduced.calendar.map((item) => item.id)).toEqual(['first']);
    expect(reduced.metrics).toMatchObject({ calendarCountOriginal: 2, calendarCountIncluded: 1 });
  });

  it('does not mutate the source context', () => {
    reduceCoachContext(context, { tasks: 1 });

    expect(context.tasks).toHaveLength(5);
    expect(context.tasks[0]?.id).toBe('normal');
  });
});
