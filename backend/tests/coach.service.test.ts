import { jest } from '@jest/globals';

const providerChat = jest.fn<(prompt: string) => Promise<string>>();
const providerChatStream = jest.fn<(prompt: string) => AsyncIterable<string>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const eventFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const eventFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const scheduleFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const taskFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createConversation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getConversation = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const addMessage = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getConversationMemory = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildStudyCoachContext = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const parseCoachIntent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildAvailableSlots = jest.fn<(...args: unknown[]) => unknown>();
const buildPlan = jest.fn<(...args: unknown[]) => unknown>();
const createScheduleDraft = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createStudyPlanBundleDraft = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createRescheduleDraft = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createGoalDraft = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStudyPlanningPreference = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const buildWeeklyCoachAnalytics = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const assertAIInputLength = jest.fn();
const consumeAiDailyRequest = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/modules/ai/ai.provider.js', () => ({
  AIProviderError: class AIProviderError extends Error {},
  aiProviderName: 'mock',
  aiProvider: { chat: providerChat, chatStream: providerChatStream },
  AI_PROVIDER_UNAVAILABLE_MESSAGE: 'Trợ lý AI đang tạm thời không phản hồi. Các chức năng StudyFlow khác vẫn hoạt động bình thường.',
  normalizeAIProviderError: (error: unknown) => error,
}));
jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    event: { findMany: eventFindMany, findFirst: eventFindFirst },
    schedule: { findMany: scheduleFindMany },
    task: { findFirst: taskFindFirst },
    activityLog: { create: activityLogCreate },
  },
}));
jest.unstable_mockModule('../src/modules/ai/coach/conversation.service.js', () => ({
  createConversation,
  getConversation,
  addMessage,
}));
jest.unstable_mockModule('../src/modules/ai/coach/conversationMemory.service.js', () => ({ getConversationMemory }));
jest.unstable_mockModule('../src/modules/ai/coach/coachContext.service.js', () => ({ buildStudyCoachContext }));
jest.unstable_mockModule('../src/modules/ai/coach/intentParser.js', () => ({ parseCoachIntent }));
jest.unstable_mockModule('../src/modules/ai/coach/availabilityEngine.js', () => ({ buildAvailableSlots }));
jest.unstable_mockModule('../src/modules/ai/coach/planningEngine.js', () => ({ buildPlan }));
jest.unstable_mockModule('../src/modules/ai/coach/draft.service.js', () => ({ createScheduleDraft, createStudyPlanBundleDraft, createRescheduleDraft, createGoalDraft }));
jest.unstable_mockModule('../src/modules/ai/coach/planning-preferences.service.js', () => ({ getStudyPlanningPreference }));
jest.unstable_mockModule('../src/modules/ai/coach/analytics.service.js', () => ({
  buildWeeklyCoachAnalytics,
  weeklyAnalyticsFallback: jest.fn(() => 'Bản tóm tắt tuần từ dữ liệu StudyFlow.'),
}));
jest.unstable_mockModule('../src/modules/ai/aiCostControl.service.js', () => ({
  assertAIInputLength,
  consumeAiDailyRequest,
}));

const { chatWithCoach } = await import('../src/modules/ai/coach/coach.service.js');

const taskId = '11111111-1111-4111-8111-111111111111';
const providerUnavailableMessage = 'Trợ lý AI đang tạm thời không phản hồi. Các chức năng StudyFlow khác vẫn hoạt động bình thường.';
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

const multiSubjectContext = {
  ...context,
  tasks: [
    { ...context.tasks[0], subjectId: '11111111-1111-4111-8111-111111111112' },
    { ...context.tasks[0], id: '22222222-2222-4222-8222-222222222222', title: 'React Hooks', subjectId: '33333333-3333-4333-8333-333333333333' },
  ],
};

describe('AI Coach chat orchestration', () => {
  beforeEach(() => {
    [providerChat, providerChatStream, activityLogCreate, eventFindMany, eventFindFirst, scheduleFindMany, taskFindFirst, createConversation, getConversation, addMessage, getConversationMemory, buildStudyCoachContext, parseCoachIntent, buildAvailableSlots, buildPlan, createScheduleDraft, createStudyPlanBundleDraft, createRescheduleDraft, createGoalDraft, getStudyPlanningPreference, buildWeeklyCoachAnalytics, assertAIInputLength, consumeAiDailyRequest].forEach((mock) => mock.mockReset());
    createConversation.mockResolvedValue({ id: 'conversation-a' });
    getConversation.mockResolvedValue({ id: 'conversation-a' });
    addMessage.mockResolvedValue({});
    getConversationMemory.mockResolvedValue({ summary: null, recentMessages: [], metrics: { recentMessageCount: 0, summarizedMessageCount: 0 } });
    consumeAiDailyRequest.mockResolvedValue(undefined);
    buildStudyCoachContext.mockResolvedValue(context);
    activityLogCreate.mockResolvedValue({});
    eventFindMany.mockResolvedValue([]);
    scheduleFindMany.mockResolvedValue([]);
    taskFindFirst.mockResolvedValue(null);
    getStudyPlanningPreference.mockResolvedValue({
      timezone: 'Asia/Ho_Chi_Minh',
      preferredStudyStart: null,
      preferredStudyEnd: null,
      maxStudyMinutesPerDay: 180,
      defaultSessionMinutes: 45,
      minBreakMinutes: 10,
      allowWeekend: true,
      preferredDays: [0, 1, 2, 3, 4, 5, 6],
    });
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

  it('stores a safe assistant response when the provider is unavailable', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'question', confidence: 1, subjectIds: [], taskIds: [], missingInformation: [] });
    providerChat.mockRejectedValue(new Error('OpenAI request failed: Authorization Bearer sk-sensitive'));

    await expect(chatWithCoach('user-a', { message: 'Toi nen lam gi?' })).resolves.toMatchObject({
      intent: 'question',
      message: providerUnavailableMessage,
      needsConfirmation: false,
    });
    expect(addMessage).toHaveBeenLastCalledWith('user-a', 'conversation-a', expect.objectContaining({
      role: 'assistant',
      content: providerUnavailableMessage,
    }), undefined);
    expect(JSON.stringify(activityLogCreate.mock.calls)).not.toContain('sk-sensitive');
  });

  it('streams assistant text before returning the validated final response', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'question', confidence: 1, subjectIds: [], taskIds: [], missingInformation: [] });
    providerChatStream.mockReturnValue((async function* () {
      yield 'Bạn nên ';
      yield 'bắt đầu với Java Collections.';
    })());
    const deltas: string[] = [];

    await expect(chatWithCoach('user-a', { message: 'Tôi nên làm gì?' }, undefined, {
      onTextDelta: (text) => { deltas.push(text); },
    })).resolves.toMatchObject({
      intent: 'question',
      message: 'Bạn nên bắt đầu với Java Collections.',
      draft: null,
    });

    expect(deltas).toEqual(['Bạn nên ', 'bắt đầu với Java Collections.']);
    expect(providerChat).not.toHaveBeenCalled();
    expect(addMessage).toHaveBeenLastCalledWith('user-a', 'conversation-a', expect.objectContaining({
      role: 'assistant',
      content: 'Bạn nên bắt đầu với Java Collections.',
    }), undefined);
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
    expect(buildPlan).toHaveBeenCalledWith(expect.objectContaining({
      preferences: expect.objectContaining({ maxSessionMinutes: 45, maxMinutesPerDay: 180, breakMinutes: 10 }),
    }));
  });

  it('keeps a reschedule as a from-to draft and does not mutate the calendar during chat', async () => {
    const eventId = '33333333-3333-4333-8333-333333333333';
    parseCoachIntent.mockResolvedValue({ intent: 'reschedule', confidence: 1, subjectIds: [], taskIds: [taskId], missingInformation: [] });
    eventFindFirst.mockResolvedValue({ id: eventId, title: 'Java Collections', startAt: new Date('2026-08-21T12:00:00.000Z'), endAt: new Date('2026-08-21T12:45:00.000Z') });
    taskFindFirst.mockResolvedValue({ id: taskId, title: 'Java Collections', subjectId: null, dueDate: new Date('2026-08-22T23:59:59.999Z'), priority: 'high', status: 'todo', startDate: null, difficulty: 3 });
    eventFindMany.mockResolvedValue([]);
    scheduleFindMany.mockResolvedValue([]);
    buildAvailableSlots.mockReturnValue([{ startAt: new Date('2026-08-22T13:00:00.000Z'), endAt: new Date('2026-08-22T14:00:00.000Z'), durationMinutes: 60 }]);
    buildPlan.mockReturnValue({
      sessions: [{ id: `${eventId}:1`, taskId, subjectId: null, title: 'Java Collections', startAt: new Date('2026-08-22T13:00:00.000Z'), endAt: new Date('2026-08-22T13:45:00.000Z'), minutes: 45, sequence: 1 }],
      warnings: [],
      unallocatedTasks: [],
      metrics: { taskCount: 1, scheduledTaskCount: 1, sessionCount: 1, totalRequestedMinutes: 45, totalScheduledMinutes: 45, totalUnallocatedMinutes: 0 },
    });
    createRescheduleDraft.mockResolvedValue({ id: 'reschedule-a', status: 'draft' });

    await expect(chatWithCoach('user-a', {
      message: 'Dời phiên Java giúp tôi',
      context: { eventId, taskId },
    })).resolves.toMatchObject({
      intent: 'reschedule',
      needsConfirmation: true,
      draft: {
        id: 'reschedule-a',
        type: 'reschedule',
        moves: [expect.objectContaining({ eventId, taskId, fromStartAt: '2026-08-21T12:00:00.000Z', toStartAt: '2026-08-22T13:00:00.000Z' })],
      },
    });

    expect(createRescheduleDraft).toHaveBeenCalledWith('user-a', expect.objectContaining({ conversationId: 'conversation-a' }), undefined);
    expect(createScheduleDraft).not.toHaveBeenCalled();
  });

  it('returns task priority ids from deterministic scoring without creating a draft', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'prioritize_tasks', confidence: 1, subjectIds: [], taskIds: [], missingInformation: [] });

    await expect(chatWithCoach('user-a', { message: 'Hôm nay tôi nên làm gì?' })).resolves.toMatchObject({
      intent: 'prioritize_tasks',
      needsConfirmation: false,
      draft: null,
      taskPriority: { type: 'task_priority', taskIds: [taskId] },
      suggestions: [expect.objectContaining({ taskId, title: 'Java Collections' })],
    });

    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(createRescheduleDraft).not.toHaveBeenCalled();
    expect(providerChat).not.toHaveBeenCalled();
  });

  it('returns a Pomodoro proposal without starting a study session or creating a draft', async () => {
    parseCoachIntent.mockResolvedValue({
      intent: 'start_focus',
      confidence: 1,
      subjectIds: [],
      taskIds: [taskId],
      constraints: { sessionMinutes: 45 },
      missingInformation: [],
    });

    await expect(chatWithCoach('user-a', {
      message: 'Bắt đầu học task này 45 phút.',
      context: { taskId },
    })).resolves.toMatchObject({
      intent: 'start_focus',
      needsConfirmation: false,
      draft: null,
      focusProposal: {
        type: 'pomodoro',
        taskId,
        subjectId: null,
        title: 'Java Collections',
        plannedMinutes: 45,
      },
    });

    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(createRescheduleDraft).not.toHaveBeenCalled();
    expect(buildPlan).not.toHaveBeenCalled();
    expect(providerChat).not.toHaveBeenCalled();
  });

  it('creates a goal draft without creating a goal during chat', async () => {
    parseCoachIntent.mockResolvedValue({
      intent: 'create_goal',
      confidence: 1,
      subjectIds: [],
      taskIds: [],
      goal: { name: 'Học Java 20 giờ tháng này', type: 'study_time', targetValue: 1200, deadline: '2026-08-31' },
      missingInformation: [],
    });
    createGoalDraft.mockResolvedValue({ id: 'goal-draft-a', status: 'draft' });

    await expect(chatWithCoach('user-a', { message: 'Tôi muốn học Java 20 giờ tháng này.' })).resolves.toMatchObject({
      intent: 'create_goal',
      needsConfirmation: true,
      draft: {
        id: 'goal-draft-a',
        type: 'goal',
        goal: { type: 'study_time', targetValue: 1200, deadline: '2026-08-31' },
      },
    });

    expect(createGoalDraft).toHaveBeenCalledWith('user-a', expect.objectContaining({
      conversationId: 'conversation-a',
      payload: expect.objectContaining({ type: 'goal', goal: expect.objectContaining({ targetValue: 1200 }) }),
    }), undefined);
    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(buildPlan).not.toHaveBeenCalled();
  });

  it('uses backend analytics as the source of truth without creating a draft', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'analytics', confidence: 1, subjectIds: [], taskIds: [], missingInformation: [] });
    buildWeeklyCoachAnalytics.mockResolvedValue({
      type: 'weekly',
      range: { startAt: '2026-08-17T17:00:00.000Z', endAt: '2026-08-24T17:00:00.000Z' },
      timezone: 'Asia/Ho_Chi_Minh',
      studyMinutes: 500,
      completedTasks: 12,
      totalTasks: 15,
      overdueTasks: 3,
      subjectBreakdown: [{ subjectId: null, name: 'Web', minutes: 225, percent: 45 }],
    });
    providerChat.mockResolvedValue('Bạn đã duy trì nhịp học khá đều. Hãy ưu tiên 3 việc quá hạn trước.');

    await expect(chatWithCoach('user-a', { message: 'Tuần này tôi học thế nào?' })).resolves.toMatchObject({
      intent: 'analytics',
      needsConfirmation: false,
      draft: null,
      analytics: {
        type: 'weekly',
        studyMinutes: 500,
        completedTasks: 12,
        totalTasks: 15,
        overdueTasks: 3,
        subjectBreakdown: [expect.objectContaining({ name: 'Web', percent: 45 })],
      },
    });

    expect(buildWeeklyCoachAnalytics).toHaveBeenCalledWith('user-a', expect.objectContaining({
      ...context,
      metrics: expect.objectContaining({ taskCountIncluded: 1 }),
    }), undefined);
    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(createGoalDraft).not.toHaveBeenCalled();
    expect(buildPlan).not.toHaveBeenCalled();
  });

  it('asks one scope question when a plan request is ambiguous across multiple subjects', async () => {
    buildStudyCoachContext.mockResolvedValue(multiSubjectContext);
    parseCoachIntent.mockResolvedValue({ intent: 'create_schedule', confidence: 0.95, subjectIds: [], taskIds: [], missingInformation: [] });

    await expect(chatWithCoach('user-a', { message: 'Lập kế hoạch học giúp tôi' })).resolves.toMatchObject({
      intent: 'clarify',
      needsConfirmation: false,
      draft: null,
      message: 'Bạn muốn lập kế hoạch cho một môn cụ thể hay tất cả công việc tuần này?',
    });

    expect(createScheduleDraft).not.toHaveBeenCalled();
    expect(buildPlan).not.toHaveBeenCalled();
    expect(providerChat).not.toHaveBeenCalled();
  });

  it('does not ask a scope question when the requested work is already limited to one subject', async () => {
    parseCoachIntent.mockResolvedValue({ intent: 'create_schedule', confidence: 0.95, subjectIds: [], taskIds: [taskId], missingInformation: [] });
    providerChat.mockResolvedValue('Mình đã chuẩn bị một bản nháp.');
    buildAvailableSlots.mockReturnValue([]);
    buildPlan.mockReturnValue({ sessions: [], warnings: [], unallocatedTasks: [], metrics: { taskCount: 1, scheduledTaskCount: 0, sessionCount: 0, totalRequestedMinutes: 45, totalScheduledMinutes: 0, totalUnallocatedMinutes: 45 } });
    createScheduleDraft.mockResolvedValue({ id: 'draft-a', status: 'draft' });

    await expect(chatWithCoach('user-a', { message: 'Lập kế hoạch cho Java' })).resolves.toMatchObject({
      intent: 'create_schedule',
      needsConfirmation: true,
      draft: { id: 'draft-a' },
    });
  });
});
