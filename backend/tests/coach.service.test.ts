import { jest } from '@jest/globals';

const providerChat = jest.fn<(prompt: string) => Promise<string>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const eventFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const scheduleFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createConversation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getConversation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const addMessage = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildStudyCoachContext = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const parseCoachIntent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildAvailableSlots = jest.fn<(...args: unknown[]) => unknown>();
const buildPlan = jest.fn<(...args: unknown[]) => unknown>();
const createScheduleDraft = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/modules/ai/ai.provider.js', () => ({
  aiProviderName: 'mock',
  aiProvider: { chat: providerChat },
}));
jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    event: { findMany: eventFindMany },
    schedule: { findMany: scheduleFindMany },
    activityLog: { create: activityLogCreate },
  },
}));
jest.unstable_mockModule('../src/modules/ai/coach/conversation.service.js', () => ({
  createConversation,
  getConversation,
  addMessage,
}));
jest.unstable_mockModule('../src/modules/ai/coach/coachContext.service.js', () => ({ buildStudyCoachContext }));
jest.unstable_mockModule('../src/modules/ai/coach/intentParser.js', () => ({ parseCoachIntent }));
jest.unstable_mockModule('../src/modules/ai/coach/availabilityEngine.js', () => ({ buildAvailableSlots }));
jest.unstable_mockModule('../src/modules/ai/coach/planningEngine.js', () => ({ buildPlan }));
jest.unstable_mockModule('../src/modules/ai/coach/draft.service.js', () => ({ createScheduleDraft }));

const { chatWithCoach } = await import('../src/modules/ai/coach/coach.service.js');

const taskId = '11111111-1111-4111-8111-111111111111';
const context = {
  now: '2026-08-20T08:00:00.000Z',
  timezone: 'Asia/Ho_Chi_Minh',
  subjects: [],
  tasks: [{ id: taskId, title: 'Java Collections', subjectId: null, studyPlanId: null, startDate: null, dueDate: '2026-08-22T09:00:00.000Z', priority: 'high', status: 'todo', estimatedMinutes: 45, difficulty: 3 }],
  plans: [],
  calendar: [],
  goals: [],
  stats: { studyMinutesThisWeek: 0, completedTasksThisWeek: 0 },
};

describe('AI Coach chat orchestration', () => {
  beforeEach(() => {
    [providerChat, activityLogCreate, eventFindMany, scheduleFindMany, createConversation, getConversation, addMessage, buildStudyCoachContext, parseCoachIntent, buildAvailableSlots, buildPlan, createScheduleDraft].forEach((mock) => mock.mockReset());
    createConversation.mockResolvedValue({ id: 'conversation-a' });
    getConversation.mockResolvedValue({ id: 'conversation-a' });
    addMessage.mockResolvedValue({});
    buildStudyCoachContext.mockResolvedValue(context);
    activityLogCreate.mockResolvedValue({});
    eventFindMany.mockResolvedValue([]);
    scheduleFindMany.mockResolvedValue([]);
  });

  it('answers a question from context without creating or applying a draft', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'question', confidence: 1, subjectIds: [], taskIds: [], missingInformation: [] });
    providerChat.mockResolvedValue('Bạn còn một công việc Java cần hoàn thành.');

    await expect(chatWithCoach('user-a', { message: 'Tôi còn việc gì?' })).resolves.toMatchObject({
      conversationId: 'conversation-a',
      intent: 'question',
      needsConfirmation: false,
      draft: null,
      message: 'Bạn còn một công việc Java cần hoàn thành.',
      provider: 'mock',
    });

    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(addMessage).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(activityLogCreate.mock.calls)).not.toContain('Tôi còn việc gì?');
  });

  it('creates a draft for a schedule request and never creates calendar entities during chat', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'create_schedule', confidence: 1, subjectIds: [], taskIds: [taskId], missingInformation: [] });
    providerChat.mockResolvedValue('Mình đã chuẩn bị một bản nháp, bạn hãy xác nhận trước khi áp dụng.');
    buildAvailableSlots.mockReturnValue([{ startAt: new Date('2026-08-20T09:00:00.000Z'), endAt: new Date('2026-08-20T10:00:00.000Z'), durationMinutes: 60 }]);
    buildPlan.mockReturnValue({
      sessions: [{ id: `${taskId}:1`, taskId, subjectId: null, title: 'Java Collections', startAt: new Date('2026-08-20T09:00:00.000Z'), endAt: new Date('2026-08-20T09:45:00.000Z'), minutes: 45, sequence: 1 }],
      warnings: [],
      unallocatedTasks: [],
      metrics: { taskCount: 1, scheduledTaskCount: 1, sessionCount: 1, totalRequestedMinutes: 45, totalScheduledMinutes: 45, totalUnallocatedMinutes: 0 },
    });
    createScheduleDraft.mockResolvedValue({ id: 'draft-a', status: 'draft' });

    await expect(chatWithCoach('user-a', { message: 'Lập lịch Java cho tôi' })).resolves.toMatchObject({
      intent: 'create_schedule',
      needsConfirmation: true,
      draft: { id: 'draft-a', status: 'draft', summary: { totalSessions: 1, totalMinutes: 45, taskCount: 1 } },
    });

    expect(createScheduleDraft).toHaveBeenCalledWith('user-a', expect.objectContaining({ conversationId: 'conversation-a' }), undefined);
    expect(createScheduleDraft.mock.calls[0]?.[1]).toMatchObject({
      payload: expect.objectContaining({ type: 'study_schedule', sessions: expect.arrayContaining([expect.objectContaining({ taskId })]) }),
    });
  });
});
