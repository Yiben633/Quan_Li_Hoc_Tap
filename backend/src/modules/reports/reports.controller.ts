import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './reports.service.js';
import type { ExportReportQuery, ReportFilters } from './reports.schemas.js';
function id(req: Request, name: string) { const value = req.params[name]; return Array.isArray(value) ? value[0] : value; }
function handle(res: Response, error: unknown) { const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; return sendError(res, error instanceof Error ? error.message : 'Internal server error', undefined, status); }
export async function overview(req: Request, res: Response) { try { return sendSuccess(res, 'Statistics overview fetched', await service.overview(req.user!.id)); } catch (e) { return handle(res, e); } }
export async function weekly(req: Request, res: Response) { try { return sendSuccess(res, 'Weekly report fetched', await service.weekly(req.user!.id, res.locals.validatedQuery as ReportFilters)); } catch (e) { return handle(res, e); } }
export async function monthly(req: Request, res: Response) { try { return sendSuccess(res, 'Monthly report fetched', await service.monthly(req.user!.id, res.locals.validatedQuery as ReportFilters)); } catch (e) { return handle(res, e); } }
export async function semester(req: Request, res: Response) { try { return sendSuccess(res, 'Semester report fetched', await service.semester(req.user!.id, id(req, 'semesterId'))); } catch (e) { return handle(res, e); } }
export async function subject(req: Request, res: Response) { try { return sendSuccess(res, 'Subject report fetched', await service.bySubject(req.user!.id, id(req, 'id'))); } catch (e) { return handle(res, e); } }
export async function exportReport(req: Request, res: Response) { try { const query = res.locals.validatedQuery as ExportReportQuery; const file = await service.exportReport(req.user!.id, query.format, query.type, { semesterId: query.semesterId, subjectId: query.subjectId }); res.setHeader('Content-Type', file.contentType); res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`); return res.send(file.buffer); } catch (e) { return handle(res, e); } }
