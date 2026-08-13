import { resolveCoachClarification } from '../src/modules/ai/coach/clarification.js';

const baseContext = {
  now: '2026-08-20T08:00:00.000Z',
  timezone: 'Asia/Ho_Chi_Minh',
  subjects: [],
  tasks: [{ id: '11111111-1111-4111-8111-111111111111', title: 'Java', subjectId: '22222222-2222-4222-8222-222222222222', studyPlanId: null, startDate: null, dueDate: null, priority: 'medium', status: 'todo', estimatedMinutes: 45, difficulty: null }],
  plans: [],
  calendar: [],
  goals: [],
  stats: { studyMinutesThisWeek: 0, completedTasksThisWeek: 0 },
};

describe('AI Coach clarification rules', () => {
  it('does not clarify when one subject gives planning a clear scope', () => {
    expect(resolveCoachClarification({ intent: 'create_schedule', confidence: 0.9, subjectIds: [], taskIds: [], missingInformation: [] }, baseContext)).toMatchObject({ intent: 'create_schedule' });
  });

  it('asks exactly one question when multiple subjects make the scope ambiguous', () => {
    const context = {
      ...baseContext,
      tasks: [...baseContext.tasks, { ...baseContext.tasks[0], id: '33333333-3333-4333-8333-333333333333', subjectId: '44444444-4444-4444-8444-444444444444' }],
    };
    const result = resolveCoachClarification({ intent: 'create_schedule', confidence: 0.9, subjectIds: [], taskIds: [], missingInformation: ['Không quan trọng'] }, context);

    expect(result).toEqual(expect.objectContaining({ intent: 'clarify' }));
    expect(result.missingInformation).toEqual(['Bạn muốn lập kế hoạch cho một môn cụ thể hay tất cả công việc tuần này?']);
  });

  it('does not clarify when task scope is explicit even with multiple subjects', () => {
    const context = {
      ...baseContext,
      tasks: [...baseContext.tasks, { ...baseContext.tasks[0], id: '33333333-3333-4333-8333-333333333333', subjectId: '44444444-4444-4444-8444-444444444444' }],
    };
    expect(resolveCoachClarification({ intent: 'create_schedule', confidence: 0.9, subjectIds: [], taskIds: [baseContext.tasks[0].id], missingInformation: [] }, context)).toMatchObject({ intent: 'create_schedule' });
  });
});
