import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './ai.service.js';
import { applyScheduleDraft } from './coach/actionExecutor.service.js';
import { AIProviderError } from './ai.provider.js';
function handle(res: Response, error: unknown) {
  if (error instanceof AIProviderError) return sendError(res, error.message, undefined, error.statusCode);
  return sendError(res, 'Unable to process the AI request', undefined, 500);
}
export async function suggest(req: Request, res: Response) { try { return sendSuccess(res, 'Schedule suggestion generated', await service.suggestSchedule(req.user!.id, req.body.tasks, req.body.slots)); } catch (e) { return handle(res, e); } }
export async function reschedule(req: Request, res: Response) { try { return sendSuccess(res, 'Tasks rescheduled', await service.reschedule(req.user!.id, req.body.tasks, req.body.slots)); } catch (e) { return handle(res, e); } }
export async function chat(req: Request, res: Response) { try { return sendSuccess(res, 'AI response generated', await service.chat(req.user!.id, req.body.prompt)); } catch (e) { return handle(res, e); } }
export async function summarize(req: Request, res: Response) { try { return sendSuccess(res, 'Document summarized', await service.summarize(req.user!.id, req.body.text)); } catch (e) { return handle(res, e); } }
export async function flashcards(req: Request, res: Response) { try { return sendSuccess(res, 'Flashcards generated', await service.generateFlashcards(req.user!.id, req.body.text, req.body.count)); } catch (e) { return handle(res, e); } }
export async function applyDraft(req: Request, res: Response) {
  const draftId = Array.isArray(req.params.id) ? req.params.id[0] ?? '' : req.params.id;
  return sendSuccess(res, 'Draft applied', await applyScheduleDraft(req.user!.id, draftId, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }));
}
