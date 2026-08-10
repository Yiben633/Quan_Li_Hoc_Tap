import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ensureRedisReady, redis } from '../lib/redis.js';
import { logger } from '../middlewares/logger.js';
import { sendSuccess } from '../utils/http.js';

export const healthRouter = Router();

healthRouter.get(['/health', '/api/health'], async (_req, res) => {
  const checks: { server: 'ok'; database: 'ok' | 'error'; redis: 'ok' | 'error' } = {
    server: 'ok', database: 'error', redis: 'error',
  };
  try {
    // A raw connection check can pass even when migrations were applied to a
    // different database. Reading core models verifies the runtime schema too.
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.role.count(),
    ]);
    checks.database = 'ok';
  } catch (error) {
    logger.error('database_schema_check_failed', {
      requestId: res.locals.requestId,
      error: serializeDatabaseError(error),
    });
  }
  try {
    await ensureRedisReady();
    await redis.ping();
    checks.redis = 'ok';
  } catch { /* reported below */ }
  const healthy = checks.database === 'ok' && checks.redis === 'ok';
  return sendSuccess(res, healthy ? 'Service is healthy' : 'Service is degraded', checks, healthy ? 200 : 503);
});

function serializeDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return { message: 'Unknown database error' };
  const details = error as Error & { code?: string; clientVersion?: string; meta?: unknown };
  return {
    name: details.name,
    message: details.message,
    code: details.code,
    clientVersion: details.clientVersion,
    meta: details.meta,
  };
}
