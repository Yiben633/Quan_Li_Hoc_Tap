import { jest } from '@jest/globals';

const conversationFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const draftFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const draftCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const draftUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const transaction = jest.fn<(input: unknown) => Promise<unknown>>(async (input) => {
  if (typeof input !== 'function') throw new Error('Expected transaction callback');
  return input({
    aiPlanDraft: { create: draftCreate, update: draftUpdate },
    activityLog: { create: activityLogCreate },
  });
});

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    aiConversation: { findFirst: conversationFindFirst },
    aiPlanDraft: { findFirst: draftFindFirst },
    $transaction: transaction,
  },
}));

const service = await import('../src/modules/ai/coach/draft.service.js');

const payload = {
  version: 1 as const,
  type: 'study_schedule' as const,
  title: 'Java 7 days',
  range: {},
  sessions: [],
  suggestedTasks: [],
  warnings: [],
  metrics: {},
};

describe('AI Coach draft service', () => {
  beforeEach(() => {
    [conversationFindFirst, draftFindFirst, draftCreate, draftUpdate, activityLogCreate, transaction].forEach((mock) => mock.mockReset());
    transaction.mockImplementation(async (input: unknown) => {
      if (typeof input !== 'function') throw new Error('Expected transaction callback');
      return input({
        aiPlanDraft: { create: draftCreate, update: draftUpdate },
        activityLog: { create: activityLogCreate },
      });
    });
  });

  it('validates and saves an inert, versioned draft for the owning conversation', async () => {
    conversationFindFirst.mockResolvedValue({ id: 'conversation-a' });
    draftCreate.mockResolvedValue({ id: 'draft-a', status: 'draft' });
    activityLogCreate.mockResolvedValue({});

    await expect(service.createScheduleDraft('user-a', { payload, conversationId: 'conversation-a' })).resolves.toMatchObject({ id: 'draft-a' });

    expect(conversationFindFirst).toHaveBeenCalledWith({ where: { id: 'conversation-a', userId: 'user-a' }, select: { id: true } });
    expect(draftCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-a', conversationId: 'conversation-a', draftType: 'study_schedule', status: 'draft' }),
    }));
    expect(activityLogCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ai.draft_created' }) }));
  });

  it('rejects invalid draft payloads before writing', async () => {
    await expect(service.createScheduleDraft('user-a', { payload: { ...payload, version: 2 } })).rejects.toMatchObject({
      message: 'Invalid schedule draft payload',
      statusCode: 422,
    });
    expect(draftCreate).not.toHaveBeenCalled();
  });

  it('does not reveal drafts owned by another user', async () => {
    draftFindFirst.mockResolvedValue(null);

    await expect(service.getDraft('user-a', 'draft-user-b')).rejects.toMatchObject({ message: 'Draft not found', statusCode: 404 });
    expect(draftFindFirst).toHaveBeenCalledWith({ where: { id: 'draft-user-b', userId: 'user-a' } });
  });

  it('preserves applied drafts as immutable history', async () => {
    draftFindFirst.mockResolvedValue({ id: 'draft-a', userId: 'user-a', status: 'applied' });

    await expect(service.discardDraft('user-a', 'draft-a')).rejects.toMatchObject({
      message: 'Applied drafts are immutable',
      statusCode: 409,
    });
    expect(draftUpdate).not.toHaveBeenCalled();
  });

  it('soft-discards a draft and records the action without deleting it', async () => {
    draftFindFirst.mockResolvedValue({ id: 'draft-a', userId: 'user-a', status: 'draft' });
    draftUpdate.mockResolvedValue({ id: 'draft-a', status: 'discarded' });
    activityLogCreate.mockResolvedValue({});

    await expect(service.discardDraft('user-a', 'draft-a')).resolves.toMatchObject({ id: 'draft-a', status: 'discarded' });

    expect(draftUpdate).toHaveBeenCalledWith({ where: { id: 'draft-a' }, data: { status: 'discarded' } });
    expect(activityLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-a', action: 'ai.draft_discarded', entityId: 'draft-a' }),
    }));
  });

  it('returns an already discarded draft without another write', async () => {
    const discardedDraft = { id: 'draft-a', userId: 'user-a', status: 'discarded' };
    draftFindFirst.mockResolvedValue(discardedDraft);

    await expect(service.discardDraft('user-a', 'draft-a')).resolves.toBe(discardedDraft);
    expect(draftUpdate).not.toHaveBeenCalled();
  });
});
