import { jest } from '@jest/globals';
import { parseCoachIntent, validateCoachIntent } from '../src/modules/ai/coach/intentParser.js';
import type { StudyCoachContext } from '../src/modules/ai/coach/coach.types.js';

const providerUnavailableMessage = 'Trợ lý AI đang tạm thời không phản hồi. Các chức năng StudyFlow khác vẫn hoạt động bình thường.';

const subjectId = '11111111-1111-4111-8111-111111111111';
const taskId = '22222222-2222-4222-8222-222222222222';
const context: StudyCoachContext = {
  now: '2026-08-10T12:00:00.000Z',
  timezone: 'Asia/Ho_Chi_Minh',
  subjects: [{ id: subjectId, code: 'JAVA', name: 'Java', credits: 3, status: 'in_progress', targetGrade: null }],
  tasks: [{ id: taskId, title: 'On Collections', subjectId, studyPlanId: null, startDate: null, dueDate: null, priority: 'high', status: 'todo', estimatedMinutes: 45, difficulty: 3 }],
  plans: [],
  calendar: [],
  goals: [],
  stats: { studyMinutesThisWeek: 0, completedTasksThisWeek: 0 },
};

describe('Coach intent parser', () => {
  it('accepts validated model output with known context IDs', () => {
    const parsed = validateCoachIntent({
      intent: 'create_schedule',
      confidence: 0.9,
      subjectIds: [subjectId],
      taskIds: [taskId],
      constraints: { maxMinutesPerDay: 120, sessionMinutes: 45 },
    }, context);

    expect(parsed).toMatchObject({ intent: 'create_schedule', subjectIds: [subjectId], taskIds: [taskId] });
  });

  it('falls back to clarify when the model proposes an unknown task ID', () => {
    const parsed = validateCoachIntent({
      intent: 'reschedule',
      confidence: 0.9,
      taskIds: ['33333333-3333-4333-8333-333333333333'],
    }, context);

    expect(parsed).toMatchObject({ intent: 'clarify' });
  });

  it('falls back to clarify when an action confidence is too low', () => {
    const parsed = validateCoachIntent({ intent: 'create_tasks', confidence: 0.3 }, context);

    expect(parsed).toMatchObject({ intent: 'clarify' });
  });

  it('retries once and then uses a safe clarify fallback for invalid output', async () => {
    const coach = jest.fn<(prompt: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ intent: 'unsupported' })
      .mockResolvedValueOnce({ intent: 'question', confidence: 0.8 });

    await expect(parseCoachIntent('Toi nen hoc gi?', context, { coach })).resolves.toMatchObject({ intent: 'question' });
    expect(coach).toHaveBeenCalledTimes(2);
  });

  it('returns the safe provider failure message after both provider attempts fail', async () => {
    const coach = jest.fn<(prompt: string) => Promise<unknown>>().mockRejectedValue(new Error('OpenAI timeout'));

    await expect(parseCoachIntent('Lap lich cho toi', context, { coach })).resolves.toMatchObject({
      intent: 'clarify',
      missingInformation: [providerUnavailableMessage],
    });
    expect(coach).toHaveBeenCalledTimes(2);
  });
});
