import { jest } from '@jest/globals';

const activityLogCreate = jest.fn<(input: unknown) => Promise<unknown>>();

class TestAIProviderError extends Error {
  readonly statusCode: number;

  constructor(message = 'AI provider is temporarily unavailable', statusCode = 503) {
    super(message);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
  }
}

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    activityLog: { create: activityLogCreate },
  },
}));

jest.unstable_mockModule('../src/modules/ai/ai.provider.js', () => ({
  aiProviderName: 'openai',
  aiProvider: {
    chat: jest.fn(async () => {
      throw new Error('401 Authorization: Bearer sk-sensitive-test-key');
    }),
  },
  normalizeAIProviderError: () => new TestAIProviderError(),
}));

const { chat, suggestSchedule } = await import('../src/modules/ai/ai.service.js');

describe('AI service provider failures', () => {
  beforeEach(() => {
    activityLogCreate.mockReset();
    activityLogCreate.mockResolvedValue({});
  });

  it('sanitizes a provider failure and logs only safe metadata', async () => {
    await expect(chat('user-1', 'Nội dung riêng tư của người dùng')).rejects.toMatchObject({
      message: 'AI provider is temporarily unavailable',
      statusCode: 503,
    });

    expect(activityLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'ai.chat',
        metadata: expect.objectContaining({
          provider: 'openai',
          success: false,
          promptLength: expect.any(Number),
        }),
      }),
    });

    const metadata = activityLogCreate.mock.calls[0]?.[0] as { data: { metadata: Record<string, unknown> } } | undefined;
    expect(metadata).toBeDefined();
    if (!metadata) return;
    expect(JSON.stringify(metadata.data.metadata)).not.toContain('Nội dung riêng tư');
    expect(JSON.stringify(metadata.data.metadata)).not.toContain('sk-sensitive-test-key');
  });

  it('keeps the legacy schedule endpoint all-or-nothing per task', async () => {
    const result = await suggestSchedule(
      'user-1',
      [{ id: 'task-1', title: 'Long task', estimatedMinutes: 90 }],
      [{ startAt: new Date('2026-08-10T09:00:00.000Z'), endAt: new Date('2026-08-10T10:00:00.000Z') }],
    );

    expect(result.assignments).toEqual([]);
    expect(result.totalRequestedMinutes).toBe(90);
    expect(result.totalAssignedMinutes).toBe(0);
    expect(result.warnings).toEqual([expect.objectContaining({ code: 'INSUFFICIENT_TIME', taskId: 'task-1' })]);
    expect(result.warningMessages).toHaveLength(1);
    expect(activityLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', action: 'ai.schedule_suggested' }),
    });
  });
});
