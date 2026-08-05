import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './calendar.service.js';
function handle(res: Response, error: unknown) { return sendError(res, error instanceof Error ? error.message : 'Internal server error', undefined, 500); }
export async function get(req: Request, res: Response) { try { return sendSuccess(res, 'Calendar fetched', await service.getCalendar(req.user!.id, res.locals.validatedQuery)); } catch (e) { return handle(res, e); } }
