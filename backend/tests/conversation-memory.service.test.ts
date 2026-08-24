import { jest } from '@jest/globals';

const conversationFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageFindMany = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const messageUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    aiConversation: { findFirst: conversationFindFirst },
    aiMessage: {
      findMany: messageFindMany,
      create: messageCreate,
      update: messageUpdate,
    },
  },
}));

const { getConversationMemory } = await import('../src/modules/ai/coach/conversationMemory.service.js');

const conversationId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const at = (second: number) => new Date(`2026-08-24T00:00:${String(second).padStart(2, '0')}.000Z`);

describe('AI Coach conversation memory', () => {
  beforeEach(() => {
    [conversationFindFirst, messageFindMany, messageCreate, messageUpdate].forEach((mock) => mock.mockReset());
    conversationFindFirst.mockResolvedValue({ id: conversationId });
  });

  it('summarizes older public messages and returns only the recent bounded window', async () => {
    const older = Array.from({ length: 3 }, (_, index) => ({
      id: `older-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Nội dung trước đó ${index}`,
      metadata: null,
      createdAt: at(index),
    }));
    const recent = Array.from({ length: 12 }, (_, index) => ({
      id: `recent-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Tin gần đây ${index}`,
      metadata: null,
      createdAt: at(index + 10),
    }));

    messageFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([...recent].reverse())
      .mockResolvedValueOnce(older);
    messageCreate.mockResolvedValue({ id: 'summary-message' });

    const memory = await getConversationMemory(userId, conversationId);

    expect(memory.recentMessages).toHaveLength(12);
    expect(memory.recentMessages[0]).toMatchObject({ content: 'Tin gần đây 0' });
    expect(memory.summary).toContain('Nội dung trước đó 0');
    expect(memory.metrics).toEqual({ recentMessageCount: 12, summarizedMessageCount: 3 });
    expect(messageCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: 'system' }),
    }));
  });

  it('does not expose an unowned conversation as memory', async () => {
    conversationFindFirst.mockResolvedValue(null);

    await expect(getConversationMemory(userId, 'conversation-owned-by-another-user')).resolves.toEqual({
      summary: null,
      recentMessages: [],
      metrics: { recentMessageCount: 0, summarizedMessageCount: 0 },
    });
    expect(messageFindMany).not.toHaveBeenCalled();
  });
});
