import { jest } from '@jest/globals';

const conversationFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationCount = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const conversationDelete = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageCount = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const transaction = jest.fn<(input: unknown) => Promise<unknown>>(async (input) => {
  if (typeof input === 'function') {
    return input({
      aiConversation: { findFirst: conversationFindFirst, update: conversationUpdate },
      aiMessage: { create: messageCreate },
      activityLog: { create: activityLogCreate },
    });
  }

  return Promise.all(input as Promise<unknown>[]);
});

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    aiConversation: {
      findFirst: conversationFindFirst,
      findMany: conversationFindMany,
      count: conversationCount,
      create: conversationCreate,
      update: conversationUpdate,
      delete: conversationDelete,
    },
    aiMessage: {
      create: messageCreate,
      findMany: messageFindMany,
      count: messageCount,
    },
    activityLog: { create: activityLogCreate },
    $transaction: transaction,
  },
}));

const service = await import('../src/modules/ai/coach/conversation.service.js');

const conversation = {
  id: 'conversation-a',
  userId: 'user-a',
  title: 'Java plan',
  status: 'active',
  _count: { messages: 0, drafts: 0 },
};

describe('AI Coach conversation service', () => {
  beforeEach(() => {
    [
      conversationFindFirst,
      conversationFindMany,
      conversationCount,
      conversationCreate,
      conversationUpdate,
      conversationDelete,
      messageCreate,
      messageFindMany,
      messageCount,
      activityLogCreate,
      transaction,
    ].forEach((mock) => mock.mockReset());

    transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === 'function') {
        return input({
          aiConversation: { findFirst: conversationFindFirst, update: conversationUpdate },
          aiMessage: { create: messageCreate },
          activityLog: { create: activityLogCreate },
        });
      }
      return Promise.all(input as Promise<unknown>[]);
    });
  });

  it('lists only the current user conversations in newest-first order with pagination', async () => {
    conversationFindMany.mockResolvedValue([conversation]);
    conversationCount.mockResolvedValue(3);

    await expect(service.listConversations('user-a', { page: 2, limit: 1, status: 'active' })).resolves.toMatchObject({
      pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
    });

    expect(conversationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-a', status: 'active' },
      orderBy: { updatedAt: 'desc' },
      skip: 1,
      take: 1,
    }));
  });

  it('does not expose a conversation that belongs to another user', async () => {
    conversationFindFirst.mockResolvedValue(null);

    await expect(service.getConversation('user-a', 'conversation-owned-by-user-b')).rejects.toMatchObject({
      message: 'Conversation not found',
      statusCode: 404,
    });

    expect(conversationFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'conversation-owned-by-user-b', userId: 'user-a' },
    }));
  });

  it('checks ownership before paging messages and returns them oldest-first', async () => {
    conversationFindFirst.mockResolvedValue(conversation);
    messageFindMany.mockResolvedValue([{ id: 'message-a', conversationId: conversation.id }]);
    messageCount.mockResolvedValue(2);

    await expect(service.listMessages('user-a', conversation.id, { page: 2, limit: 1 })).resolves.toMatchObject({
      pagination: { page: 2, limit: 1, total: 2, totalPages: 2 },
    });

    expect(messageFindMany).toHaveBeenCalledWith({
      where: { conversationId: conversation.id, role: { not: 'system' } },
      orderBy: { createdAt: 'asc' },
      skip: 1,
      take: 1,
    });
  });

  it('updates the conversation and logs safe message metadata in one transaction', async () => {
    conversationFindFirst.mockResolvedValue({ id: conversation.id });
    messageCreate.mockResolvedValue({ id: 'message-a' });
    conversationUpdate.mockResolvedValue(conversation);
    activityLogCreate.mockResolvedValue({});

    await expect(service.addMessage('user-a', conversation.id, {
      role: 'user',
      content: '  Lập lịch học riêng tư  ',
    })).resolves.toMatchObject({ id: 'message-a' });

    expect(conversationFindFirst).toHaveBeenCalledWith({
      where: { id: conversation.id, userId: 'user-a' },
      select: { id: true },
    });
    expect(conversationUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: conversation.id } }));
    expect(activityLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        metadata: { role: 'user', messageId: 'message-a' },
      }),
    }));
    expect(JSON.stringify(activityLogCreate.mock.calls)).not.toContain('Lập lịch học riêng tư');
  });
});
