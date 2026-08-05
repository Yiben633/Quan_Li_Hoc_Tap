import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './tasks.service.js';

function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function id(req: Request) { return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; }
function subtaskId(req: Request) { return Array.isArray(req.params.subtaskId) ? req.params.subtaskId[0] : req.params.subtaskId; }
function handleError(res: Response, error: unknown) { const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; const message = error instanceof Error ? error.message : 'Internal server error'; return sendError(res, statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, undefined, statusCode); }

export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Tasks fetched', await service.list(req.user!.id, res.locals.validatedQuery)); } catch (error) { return handleError(res, error); } }
export async function today(req: Request, res: Response) { try { return sendSuccess(res, "Today's tasks fetched", await service.today(req.user!.id)); } catch (error) { return handleError(res, error); } }
export async function overdue(req: Request, res: Response) { try { return sendSuccess(res, 'Overdue tasks fetched', await service.overdue(req.user!.id)); } catch (error) { return handleError(res, error); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Task created', await service.create(req.user!.id, req.body, context(req)), 201); } catch (error) { return handleError(res, error); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Task fetched', await service.detail(req.user!.id, id(req))); } catch (error) { return handleError(res, error); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Task updated', await service.update(req.user!.id, id(req), req.body, context(req))); } catch (error) { return handleError(res, error); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Task deleted', await service.remove(req.user!.id, id(req), context(req))); } catch (error) { return handleError(res, error); } }
export async function status(req: Request, res: Response) { try { return sendSuccess(res, 'Task status updated', await service.setStatus(req.user!.id, id(req), req.body.status, context(req))); } catch (error) { return handleError(res, error); } }
export async function complete(req: Request, res: Response) { try { return sendSuccess(res, 'Task completed', await service.complete(req.user!.id, id(req), context(req))); } catch (error) { return handleError(res, error); } }
export async function duplicate(req: Request, res: Response) { try { return sendSuccess(res, 'Task duplicated', await service.duplicate(req.user!.id, id(req), context(req)), 201); } catch (error) { return handleError(res, error); } }
export async function reorder(req: Request, res: Response) { try { const items = Array.isArray(req.body) ? req.body : req.body.items; return sendSuccess(res, 'Tasks reordered', await service.reorder(req.user!.id, items)); } catch (error) { return handleError(res, error); } }
export async function subtasks(req: Request, res: Response) { try { return sendSuccess(res, 'Subtasks fetched', await service.subtasks(req.user!.id, id(req))); } catch (error) { return handleError(res, error); } }
export async function createSubtask(req: Request, res: Response) { try { return sendSuccess(res, 'Subtask created', await service.createSubtask(req.user!.id, id(req), req.body), 201); } catch (error) { return handleError(res, error); } }
export async function updateSubtask(req: Request, res: Response) { try { return sendSuccess(res, 'Subtask updated', await service.updateSubtask(req.user!.id, id(req), subtaskId(req), req.body)); } catch (error) { return handleError(res, error); } }
export async function removeSubtask(req: Request, res: Response) { try { await service.removeSubtask(req.user!.id, id(req), subtaskId(req)); return sendSuccess(res, 'Subtask deleted', null); } catch (error) { return handleError(res, error); } }
