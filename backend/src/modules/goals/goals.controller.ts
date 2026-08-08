import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './goals.service.js';
function id(req: Request) { return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function list(req: Request, res: Response) { try { const query = res.locals.validatedQuery; return sendSuccess(res, 'Goals fetched', await service.list(req.user!.id, query?.status, query?.type)); } catch (e) { return handle(res, e); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Goal created', await service.create(req.user!.id, req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Goal fetched', await service.detail(req.user!.id, id(req))); } catch (e) { return handle(res, e); } }
export async function progress(req: Request, res: Response) { try { const goal = await service.detail(req.user!.id, id(req)); return sendSuccess(res, 'Goal progress calculated', { id: goal.id, name: goal.name, type: goal.type, targetValue: goal.targetValue, currentValue: goal.currentValue, progressPercent: goal.progressPercent }); } catch (e) { return handle(res, e); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Goal updated', await service.update(req.user!.id, id(req), req.body, context(req))); } catch (e) { return handle(res, e); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Goal archived', await service.remove(req.user!.id, id(req), context(req))); } catch (e) { return handle(res, e); } }
export async function dailyCron(req: Request, res: Response) { try { if (env.CRON_SECRET && req.header('x-cron-secret') !== env.CRON_SECRET) return sendError(res, 'Invalid cron secret', undefined, 401); if (!env.CRON_SECRET && env.NODE_ENV === 'production') return sendError(res, 'Cron secret is not configured', undefined, 503); return sendSuccess(res, 'Daily goal notifications processed', await service.runDailyNotifications()); } catch (e) { return handle(res, e); } }
