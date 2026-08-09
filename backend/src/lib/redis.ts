import { Redis } from 'ioredis';
import { env } from '../config/env.js';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 10_000,
    commandTimeout: 5_000,
    enableAutoPipelining: true,
    connectionName: 'studyflow-backend',
  });
globalForRedis.redis = redis;

let connecting: Promise<void> | null = null;

export async function ensureRedisReady() {
  if (redis.status === 'ready') return;

  if (redis.status === 'wait' || redis.status === 'end') {
    connecting ??= redis.connect().finally(() => {
      connecting = null;
    });
    await connecting;
    return;
  }

  if (connecting) {
    await connecting;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Redis connection timed out'));
    }, 10_000);
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      redis.off('ready', onReady);
      redis.off('error', onError);
    };

    redis.once('ready', onReady);
    redis.once('error', onError);
  });
}
