import { jest } from '@jest/globals';

const increment = jest.fn<(...args: unknown[]) => Promise<number>>();
const expire = jest.fn<(...args: unknown[]) => Promise<number>>();

jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    AI_MAX_INPUT_CHARS: 100,
    AI_DAILY_REQUEST_LIMIT: 2,
  },
}));
jest.unstable_mockModule('../src/lib/redis.js', () => ({
  redis: { incr: increment, expire },
}));

const { assertAIInputLength, consumeAiDailyRequest } = await import('../src/modules/ai/aiCostControl.service.js');

describe('AI cost controls', () => {
  beforeEach(() => {
    increment.mockReset();
    expire.mockReset();
    expire.mockResolvedValue(1);
  });

  it('rejects oversized provider input before it can be sent', () => {
    expect(() => assertAIInputLength('x'.repeat(101))).toThrow(expect.objectContaining({ statusCode: 413 }));
  });

  it('enforces the configured daily request quota per user', async () => {
    increment.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    await expect(consumeAiDailyRequest('user-a')).resolves.toBeUndefined();
    await expect(consumeAiDailyRequest('user-a')).resolves.toBeUndefined();
    await expect(consumeAiDailyRequest('user-a')).rejects.toMatchObject({ statusCode: 429 });
    expect(expire).toHaveBeenCalledTimes(1);
  });
});
