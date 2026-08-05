import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './events.service.js';
function id(req: Request) { return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Events fetched', await service.list(req.user!.id)); } catch (e) { return handle(res, e); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Event created', await service.create(req.user!.id, req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Event fetched', await service.detail(req.user!.id, id(req))); } catch (e) { return handle(res, e); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Event updated', await service.update(req.user!.id, id(req), req.body, context(req))); } catch (e) { return handle(res, e); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Event deleted', await service.remove(req.user!.id, id(req), context(req))); } catch (e) { return handle(res, e); } }
