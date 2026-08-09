import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ensureRedisReady, redis } from '../lib/redis.js';
import { sendSuccess } from '../utils/http.js';

export const healthRouter = Router();

healthRouter.get(['/health', '/api/health'], async (_req, res) => {
  const checks: { server: 'ok'; database: 'ok' | 'error'; redis: 'ok' | 'error' } = {
    server: 'ok', database: 'error', redis: 'error',
  };
  try { await prisma.$queryRaw`SELECT 1`; checks.database = 'ok'; } catch { /* reported below */ }
  try {
    await ensureRedisReady();
    await redis.ping();
    checks.redis = 'ok';
  } catch { /* reported below */ }
  const healthy = checks.database === 'ok' && checks.redis === 'ok';
  return sendSuccess(res, healthy ? 'Service is healthy' : 'Service is degraded', checks, healthy ? 200 : 503);
});
