import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './study-sessions.service.js';
function param(req: Request, name: string) { const value = req.params[name]; return Array.isArray(value) ? value[0] : value; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function start(req: Request, res: Response) { try { return sendSuccess(res, 'Study session started', await service.start(req.user!.id, req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function active(req: Request, res: Response) { try { return sendSuccess(res, 'Active study session fetched', await service.active(req.user!.id)); } catch (e) { return handle(res, e); } }
export async function pause(req: Request, res: Response) { try { return sendSuccess(res, 'Study session paused', await service.pause(req.user!.id, param(req, 'id'), context(req))); } catch (e) { return handle(res, e); } }
export async function resume(req: Request, res: Response) { try { return sendSuccess(res, 'Study session resumed', await service.resume(req.user!.id, param(req, 'id'), context(req))); } catch (e) { return handle(res, e); } }
export async function end(req: Request, res: Response) { try { return sendSuccess(res, 'Study session ended', await service.end(req.user!.id, param(req, 'id'), context(req))); } catch (e) { return handle(res, e); } }
export async function pomodoroStart(req: Request, res: Response) { try { return sendSuccess(res, 'Pomodoro started', await service.startPomodoro(req.user!.id, param(req, 'id'), req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function pomodoroEnd(req: Request, res: Response) { try { return sendSuccess(res, 'Pomodoro ended', await service.endPomodoro(req.user!.id, param(req, 'id'), param(req, 'pomodoroId'), context(req))); } catch (e) { return handle(res, e); } }
export async function statistics(req: Request, res: Response) { try { return sendSuccess(res, 'Study time statistics fetched', await service.statistics(req.user!.id, res.locals.validatedQuery)); } catch (e) { return handle(res, e); } }
