import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as s from './groups.service.js';
function p(req: Request, n: string) { const v = req.params[n]; return Array.isArray(v) ? v[0] : v; } function h(res: Response, e: unknown) { const status = typeof e === 'object' && e && 'statusCode' in e && typeof e.statusCode === 'number' ? e.statusCode : 500; return sendError(res, e instanceof Error ? e.message : 'Internal server error', undefined, status); }
export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Study groups fetched', await s.list(req.user!.id)); } catch (e) { return h(res, e); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Study group created', await s.create(req.user!.id, req.body), 201); } catch (e) { return h(res, e); } }
export async function detail(req: Request, res: Response) { try { return sendSuccess(res, 'Study group fetched', await s.detail(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Study group updated', await s.update(req.user!.id, p(req, 'id'), req.body)); } catch (e) { return h(res, e); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Study group deleted', await s.remove(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
export async function invite(req: Request, res: Response) { try { return sendSuccess(res, 'Member invited', await s.invite(req.user!.id, p(req, 'id'), req.body.userId), 201); } catch (e) { return h(res, e); } }
export async function accept(req: Request, res: Response) { try { return sendSuccess(res, 'Invitation accepted', await s.accept(req.user!.id, p(req, 'id'), p(req, 'memberId'))); } catch (e) { return h(res, e); } }
export async function createTask(req: Request, res: Response) { try { return sendSuccess(res, 'Group task created', await s.createTask(req.user!.id, p(req, 'id'), req.body), 201); } catch (e) { return h(res, e); } }
export async function updateTask(req: Request, res: Response) { try { return sendSuccess(res, 'Group task updated', await s.updateTask(req.user!.id, p(req, 'taskId'), req.body)); } catch (e) { return h(res, e); } }
export async function progress(req: Request, res: Response) { try { return sendSuccess(res, 'Group progress calculated', await s.progress(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
