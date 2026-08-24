import { env } from '../../config/env.js';
import { redis } from '../../lib/redis.js';
import { serviceError } from '../../utils/service-error.js';

function dailyKey(userId: string, now = new Date()) {
  return `ai:daily-requests:${now.toISOString().slice(0, 10)}:${userId}`;
}

/** Prevents oversized prompts from reaching a billable provider request. */
export function assertAIInputLength(input: string) {
  if (input.length > env.AI_MAX_INPUT_CHARS) {
    throw serviceError(`AI input exceeds the ${env.AI_MAX_INPUT_CHARS.toLocaleString('en-US')} character limit`, 413);
  }
}

/**
 * Counts user-initiated AI requests, not internal draft operations. Redis
 * outages fail open so the learning workflow remains available.
 */
export async function consumeAiDailyRequest(userId: string) {
  const key = dailyKey(userId);
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 24 * 60 * 60);
    if (count > env.AI_DAILY_REQUEST_LIMIT) {
      throw serviceError('Daily AI request limit reached. Please try again tomorrow.', 429);
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) throw error;
    // Do not include Redis connection details or user input in application logs.
    console.warn('AI daily request quota store is unavailable; allowing request');
  }
}
