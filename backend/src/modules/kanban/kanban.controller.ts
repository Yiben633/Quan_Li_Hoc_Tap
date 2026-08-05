import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './kanban.service.js';

function handleError(res: Response, error: unknown) { const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; const message = error instanceof Error ? error.message : 'Internal server error'; return sendError(res, statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, undefined, statusCode); }
export async function board(req: Request, res: Response) { try { return sendSuccess(res, 'Kanban board fetched', await service.board(req.user!.id, res.locals.validatedQuery)); } catch (error) { return handleError(res, error); } }
export async function move(req: Request, res: Response) { try { return sendSuccess(res, 'Kanban task moved', await service.move(req.user!.id, req.body)); } catch (error) { return handleError(res, error); } }
