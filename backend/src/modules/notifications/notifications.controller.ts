import type { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { runNotificationJob } from '../../jobs/notificationJob.js';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './notifications.service.js';
function id(req: Request) { const value = req.params.id; return Array.isArray(value) ? value[0] : value; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Notifications fetched', await service.list(req.user!.id, res.locals.validatedQuery)); } catch (e) { return handle(res, e); } }
export async function read(req: Request, res: Response) { try { return sendSuccess(res, 'Notification marked as read', await service.markRead(req.user!.id, id(req), context(req))); } catch (e) { return handle(res, e); } }
export async function readAll(req: Request, res: Response) { try { return sendSuccess(res, 'Notifications marked as read', await service.markAllRead(req.user!.id, context(req))); } catch (e) { return handle(res, e); } }
export async function getSettings(req: Request, res: Response) { try { return sendSuccess(res, 'Notification settings fetched', await service.getSettings(req.user!.id)); } catch (e) { return handle(res, e); } }
export async function updateSettings(req: Request, res: Response) { try { return sendSuccess(res, 'Notification settings updated', await service.updateSettings(req.user!.id, req.body, context(req))); } catch (e) { return handle(res, e); } }

function secretMatches(provided: string | undefined) {
  if (!provided || !env.CRON_SECRET) return false;
  const actual = Buffer.from(provided);
  const expected = Buffer.from(env.CRON_SECRET);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function cronSecret(req: Request) {
  const authorization = req.header('authorization');
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const query = typeof req.query.secret === 'string' ? req.query.secret : undefined;
  return bearer ?? req.header('x-cron-secret') ?? query;
}

export async function cron(req: Request, res: Response) {
  try {
    if (!secretMatches(cronSecret(req))) return sendError(res, 'Invalid cron secret', undefined, 401);
    res.setHeader('Cache-Control', 'no-store');
    const userAgent = req.get('user-agent');
    const source = env.VERCEL === '1' || userAgent?.includes('vercel-cron') ? 'vercel' : 'manual';
    return sendSuccess(res, 'Notifications processed', await runNotificationJob({ source, userAgent }));
  } catch (error) {
    return handle(res, error);
  }
}
