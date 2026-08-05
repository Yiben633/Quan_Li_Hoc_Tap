import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './semesters.service.js';

function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function paramId(req: Request) { return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; }
function handleError(res: Response, error: unknown) {
  const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';
  return sendError(res, statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, undefined, statusCode);
}

export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Semesters fetched', await service.list(req.user!.id, res.locals.validatedQuery)); } catch (error) { return handleError(res, error); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Semester created', await service.create(req.user!.id, req.body, context(req)), 201); } catch (error) { return handleError(res, error); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Semester fetched', await service.getDetail(req.user!.id, paramId(req))); } catch (error) { return handleError(res, error); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Semester updated', await service.update(req.user!.id, paramId(req), req.body, context(req))); } catch (error) { return handleError(res, error); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Semester deleted', await service.softDelete(req.user!.id, paramId(req), context(req))); } catch (error) { return handleError(res, error); } }
export async function close(req: Request, res: Response) { try { return sendSuccess(res, 'Semester closed', await service.close(req.user!.id, paramId(req), context(req))); } catch (error) { return handleError(res, error); } }
export async function duplicate(req: Request, res: Response) { try { return sendSuccess(res, 'Semester duplicated', await service.duplicate(req.user!.id, paramId(req), context(req)), 201); } catch (error) { return handleError(res, error); } }
