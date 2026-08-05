import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as s from './admin.service.js';
function p(req: Request, n: string) { const v = req.params[n]; return Array.isArray(v) ? v[0] : v; } function h(res: Response, e: unknown) { const status = typeof e === 'object' && e && 'statusCode' in e && typeof e.statusCode === 'number' ? e.statusCode : 500; return sendError(res, e instanceof Error ? e.message : 'Internal server error', undefined, status); }
export async function users(req: Request, res: Response) { try { return sendSuccess(res, 'Users fetched', await s.users(res.locals.validatedQuery)); } catch (e) { return h(res, e); } }
export async function updateUser(req: Request, res: Response) { try { return sendSuccess(res, 'User updated', await s.updateUser(p(req, 'id'), req.body)); } catch (e) { return h(res, e); } }
export async function feedback(req: Request, res: Response) { try { return sendSuccess(res, 'Feedback fetched', await s.feedback(res.locals.validatedQuery.status)); } catch (e) { return h(res, e); } }
export async function reply(req: Request, res: Response) { try { return sendSuccess(res, 'Feedback updated', await s.replyFeedback(p(req, 'id'), req.body)); } catch (e) { return h(res, e); } }
export async function logs(req: Request, res: Response) { try { return sendSuccess(res, 'Activity logs fetched', await s.logs(res.locals.validatedQuery)); } catch (e) { return h(res, e); } }
export async function statistics(req: Request, res: Response) { try { const { overview } = await import('../reports/reports.service.js'); return sendSuccess(res, 'Admin statistics fetched', await overview(req.user!.id)); } catch (e) { return h(res, e); } }
export async function templates(req: Request, res: Response) { try { if (!req.file) return sendError(res, 'Excel file is required', undefined, 422); return sendSuccess(res, 'Subject templates imported', await s.importTemplates(req.file.buffer)); } catch (e) { return h(res, e); } }
