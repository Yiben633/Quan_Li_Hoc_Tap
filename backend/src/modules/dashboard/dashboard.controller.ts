import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './dashboard.service.js';
function handle(res: Response, error: unknown) { return sendError(res, error instanceof Error ? error.message : 'Internal server error', undefined, 500); }
export async function summary(req: Request, res: Response) { try { return sendSuccess(res, 'Dashboard summary fetched', await service.summary(req.user!.id)); } catch (e) { return handle(res, e); } }
export async function chart(req: Request, res: Response) { try { return sendSuccess(res, 'Progress chart fetched', await service.progressChart(req.user!.id, res.locals.validatedQuery.range)); } catch (e) { return handle(res, e); } }
