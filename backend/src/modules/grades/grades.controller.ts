import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './grades.service.js';
function param(req: Request, name: string) { const value = req.params[name]; return Array.isArray(value) ? value[0] : value; }
function context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function list(req: Request, res: Response) { try { return sendSuccess(res, 'Grade components fetched', await service.listComponents(req.user!.id, param(req, 'subjectId'))); } catch (e) { return handle(res, e); } }
export async function create(req: Request, res: Response) { try { return sendSuccess(res, 'Grade component created', await service.createComponent(req.user!.id, param(req, 'subjectId'), req.body, context(req)), 201); } catch (e) { return handle(res, e); } }
export async function update(req: Request, res: Response) { try { return sendSuccess(res, 'Grade component updated', await service.updateComponent(req.user!.id, param(req, 'id'), req.body, context(req))); } catch (e) { return handle(res, e); } }
export async function remove(req: Request, res: Response) { try { return sendSuccess(res, 'Grade component deleted', await service.deleteComponent(req.user!.id, param(req, 'id'), context(req))); } catch (e) { return handle(res, e); } }
export async function grade(req: Request, res: Response) { try { return sendSuccess(res, 'Grade saved', await service.setGrade(req.user!.id, param(req, 'id'), req.body, context(req))); } catch (e) { return handle(res, e); } }
export async function summary(req: Request, res: Response) { try { return sendSuccess(res, 'Grade summary calculated', await service.summary(req.user!.id, param(req, 'subjectId'))); } catch (e) { return handle(res, e); } }
export async function gpa(req: Request, res: Response) { try { return sendSuccess(res, 'Semester GPA calculated', await service.semesterGpa(req.user!.id, param(req, 'semesterId'))); } catch (e) { return handle(res, e); } }
