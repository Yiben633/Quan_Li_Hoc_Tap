import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './flashcards.service.js';
function p(req: Request, name: string) { const v = req.params[name]; return Array.isArray(v) ? v[0] : v; }
function h(res: Response, e: unknown) { const s = typeof e === 'object' && e && 'statusCode' in e && typeof e.statusCode === 'number' ? e.statusCode : 500; return sendError(res, e instanceof Error ? e.message : 'Internal server error', undefined, s); }
export async function sets(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard sets fetched', await service.listSets(req.user!.id)); } catch (e) { return h(res, e); } }
export async function createSet(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard set created', await service.createSet(req.user!.id, req.body), 201); } catch (e) { return h(res, e); } }
export async function set(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard set fetched', await service.detailSet(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
export async function updateSet(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard set updated', await service.updateSet(req.user!.id, p(req, 'id'), req.body)); } catch (e) { return h(res, e); } }
export async function removeSet(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard set deleted', await service.removeSet(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
export async function cards(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcards fetched', await service.listCards(req.user!.id, p(req, 'setId'))); } catch (e) { return h(res, e); } }
export async function createCard(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard created', await service.createCard(req.user!.id, p(req, 'setId'), req.body), 201); } catch (e) { return h(res, e); } }
export async function updateCard(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard updated', await service.updateCard(req.user!.id, p(req, 'id'), req.body)); } catch (e) { return h(res, e); } }
export async function removeCard(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard deleted', await service.removeCard(req.user!.id, p(req, 'id'))); } catch (e) { return h(res, e); } }
export async function review(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcard reviewed', await service.review(req.user!.id, p(req, 'id'), req.body.correct)); } catch (e) { return h(res, e); } }
export async function due(req: Request, res: Response) { try { return sendSuccess(res, 'Due flashcards fetched', await service.due(req.user!.id)); } catch (e) { return h(res, e); } }
