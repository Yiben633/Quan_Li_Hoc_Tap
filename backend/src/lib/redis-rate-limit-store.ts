import { randomUUID } from 'node:crypto';
import type { ClientRateLimitInfo, IncrementResponse, Options, Store } from 'express-rate-limit';
import { ensureRedisReady, redis } from './redis.js';

const incrementScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`;

const decrementScript = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current > 0 then
  return redis.call('DECR', KEYS[1])
end
return current
`;

export class RedisRateLimitStore implements Store {
  // Each store instance owns a distinct Redis namespace through `prefix`.
  // Marking keys as instance-local lets express-rate-limit safely compose the
  // global limiter with stricter route-specific limiters on the same request.
  readonly localKeys = true;
  readonly prefix: string;
  private windowMs = 60_000;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private key(key: string) {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    await ensureRedisReady();
    const redisKey = this.key(key);
    const [rawHits, ttl] = await Promise.all([redis.get(redisKey), redis.pttl(redisKey)]);
    if (rawHits === null) return undefined;
    return {
      totalHits: Number(rawHits),
      resetTime: new Date(Date.now() + Math.max(ttl, 0)),
    };
  }

  async increment(key: string): Promise<IncrementResponse> {
    await ensureRedisReady();
    const result = await redis.eval(incrementScript, 1, this.key(key), this.windowMs);
    if (!Array.isArray(result)) throw new Error('Invalid Redis rate-limit response');
    const totalHits = Number(result[0]);
    const ttl = Number(result[1]);
    return {
      totalHits,
      resetTime: new Date(Date.now() + Math.max(ttl, 0)),
    };
  }

  async decrement(key: string) {
    await ensureRedisReady();
    await redis.eval(decrementScript, 1, this.key(key));
  }

  async resetKey(key: string) {
    await ensureRedisReady();
    await redis.del(this.key(key));
  }
}

export function createRateLimitStore(prefix: string) {
  const testNamespace = process.env.NODE_ENV === 'test' ? `${process.pid}:${randomUUID()}:` : '';
  return new RedisRateLimitStore(`rate-limit:${testNamespace}${prefix}:`);
}
