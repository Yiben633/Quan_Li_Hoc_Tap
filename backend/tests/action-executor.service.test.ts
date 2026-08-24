import { jest } from '@jest/globals';

const draftFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const draftUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const taskFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const taskCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const subjectFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const subjectFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const planFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const goalCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const eventFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const eventCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const scheduleFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const transaction = jest.fn<(input: unknown) => Promise<unknown>>(async (input) => {
  if (typeof input !== 'function') throw new Error('Expected transaction callback');
  return input({
    aiPlanDraft: { findFirst: draftFindFirst, update: draftUpdate },
    task: { findMany: taskFindMany, create: taskCreate },
    subject: { findMany: subjectFindMany, findFirst: subjectFindFirst },
    studyPlan: { findMany: planFindMany },
    goal: { create: goalCreate },
    event: { findMany: eventFindMany, create: eventCreate },
    schedule: { findMany: scheduleFindMany },
    activityLog: { create: activityLogCreate },
  });
});

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: { $transaction: transaction },
}));

const { applyGoalDraft, applyScheduleDraft } = await import('../src/modules/ai/coach/actionExecutor.service.js');

const taskId = '11111111-1111-4111-8111-111111111111';
const draft = {
  id: 'draft-a',
  userId: 'user-a',
  draftType: 'study_schedule',
  status: 'draft',
  payload: {
    version: 1,
    type: 'study_schedule',
    title: 'Java plan',
    range: {},
    sessions: [{ id: 'session-1', taskId, title: 'Java', startAt: '2026-08-20T09:00:00.000Z', endAt: '2026-08-20T09:45:00.000Z', minutes: 45, sequence: 1 }],
    suggestedTasks: [],
    warnings: [],
    metrics: {},
  },
};

const goalDraft = {
  id: 'goal-draft-a',
  userId: 'user-a',
  draftType: 'goal',
  status: 'draft',
  payload: {
    version: 1,
    type: 'goal',
    title: 'Học Java 20 giờ tháng này',
    goal: { name: 'Học Java 20 giờ tháng này', type: 'study_time', targetValue: 1200, subjectId: null, deadline: '2026-08-31' },
  },
};

describe('AI Coach draft action executor', () => {
  beforeEach(() => {
    [draftFindFirst, draftUpdate, taskFindMany, taskCreate, subjectFindMany, subjectFindFirst, planFindMany, goalCreate, eventFindMany, eventCreate, scheduleFindMany, activityLogCreate, transaction].forEach((mock) => mock.mockReset());
    transaction.mockImplementation(async (input: unknown) => {
      if (typeof input !== 'function') throw new Error('Expected transaction callback');
      return input({
        aiPlanDraft: { findFirst: draftFindFirst, update: draftUpdate },
        task: { findMany: taskFindMany, create: taskCreate },
        subject: { findMany: subjectFindMany, findFirst: subjectFindFirst },
        studyPlan: { findMany: planFindMany },
        goal: { create: goalCreate },
        event: { findMany: eventFindMany, create: eventCreate },
        schedule: { findMany: scheduleFindMany },
        activityLog: { create: activityLogCreate },
      });
    });
    taskFindMany.mockResolvedValue([{ id: taskId, subjectId: null }]);
    subjectFindMany.mockResolvedValue([]);
    planFindMany.mockResolvedValue([]);
    eventFindMany.mockResolvedValue([]);
    scheduleFindMany.mockResolvedValue([]);
    eventCreate.mockResolvedValue({ id: 'event-a' });
    goalCreate.mockResolvedValue({ id: 'goal-a' });
    draftUpdate.mockResolvedValue({ ...draft, status: 'applied' });
    activityLogCreate.mockResolvedValue({});
  });

  it('revalidates references, creates calendar events, and marks the draft applied in one transaction', async () => {
    draftFindFirst.mockResolvedValue(draft);

    await expect(applyScheduleDraft('user-a', draft.id)).resolves.toMatchObject({
      draftId: draft.id,
      status: 'applied',
      alreadyApplied: false,
      createdEventIds: ['event-a'],
      createdTaskIds: [],
    });

    expect(taskFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-a', deletedAt: null }) }));
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'user-a', title: 'Java' }) }));
    expect(draftUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'applied', appliedAt: expect.any(Date) }) }));
  });

  it('returns applied state without creating duplicates on a retry', async () => {
    draftFindFirst.mockResolvedValue({ ...draft, status: 'applied' });

    await expect(applyScheduleDraft('user-a', draft.id)).resolves.toMatchObject({ alreadyApplied: true, createdEventIds: [] });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('rejects a new calendar conflict before writing', async () => {
    draftFindFirst.mockResolvedValue(draft);
    eventFindMany.mockResolvedValue([{ startAt: new Date('2026-08-20T09:15:00.000Z'), endAt: new Date('2026-08-20T10:00:00.000Z') }]);

    await expect(applyScheduleDraft('user-a', draft.id)).rejects.toMatchObject({ statusCode: 409, code: 'DRAFT_CONFLICT' });
    expect(eventCreate).not.toHaveBeenCalled();
    expect(draftUpdate).not.toHaveBeenCalled();
  });

  it('creates a goal only while applying a validated goal draft', async () => {
    draftFindFirst.mockResolvedValue(goalDraft);
    draftUpdate.mockResolvedValue({ ...goalDraft, status: 'applied' });

    await expect(applyGoalDraft('user-a', goalDraft.id)).resolves.toMatchObject({
      draftId: goalDraft.id,
      status: 'applied',
      alreadyApplied: false,
      createdGoalId: 'goal-a',
    });

    expect(goalCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-a', name: 'Học Java 20 giờ tháng này', type: 'study_time', targetValue: 1200 }),
    }));
    expect(draftUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'applied', appliedAt: expect.any(Date) }) }));
  });
});
