import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './documents.service.js';
function id(req: Request) { const value = req.params.id; return Array.isArray(value) ? value[0] : value; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function upload(req: Request, res: Response) { try { if (!req.file) return sendError(res, 'A document file is required', undefined, 422); return sendSuccess(res, 'Document uploaded', await service.upload(req.user!.id, req.file, req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Documents fetched', await service.list(req.user!.id, res.locals.validatedQuery)); } catch (e) { return handle(res, e); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Document fetched', await service.detail(req.user!.id, id(req))); } catch (e) { return handle(res, e); } }
export async function download(req: Request, res: Response) { try { const item = await service.download(req.user!.id, id(req)); return res.redirect(item.url); } catch (e) { return handle(res, e); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Document updated', await service.update(req.user!.id, id(req), req.body, context(req))); } catch (e) { return handle(res, e); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Document deleted', await service.remove(req.user!.id, id(req), context(req))); } catch (e) { return handle(res, e); } }
