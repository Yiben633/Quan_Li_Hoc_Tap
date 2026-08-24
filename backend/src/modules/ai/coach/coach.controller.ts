import type { Request, Response } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../../../utils/http.js';
import { AIProviderError, AI_PROVIDER_UNAVAILABLE_MESSAGE } from '../ai.provider.js';
import { chatWithCoach } from './coach.service.js';
import { deleteConversation, listConversations, listMessages } from './conversation.service.js';
import { getStudyPlanningPreference, updateStudyPlanningPreference } from './planning-preferences.service.js';

function requestId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function conversationIdFromParams(req: Request, res: Response) {
  const parsed = z.string().uuid().safeParse(requestId(req.params.id));
  if (parsed.success) return parsed.data;
  sendError(res, 'Conversation id is invalid', undefined, 422);
  return null;
}

export async function chat(req: Request, res: Response) {
  try {
    const result = await chatWithCoach(req.user!.id, {
      conversationId: req.body.conversationId,
      message: req.body.message,
      context: req.body.context,
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    return sendSuccess(res, 'Coach response generated', result);
  } catch (error) {
    if (error instanceof AIProviderError) return sendError(res, AI_PROVIDER_UNAVAILABLE_MESSAGE, undefined, error.statusCode);
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;
    const message = error instanceof Error && statusCode < 500 ? error.message : 'Unable to process the coach request';
    return sendError(res, message, undefined, statusCode);
  }
}

function writeSseEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function streamErrorMessage(error: unknown) {
  if (error instanceof AIProviderError) return AI_PROVIDER_UNAVAILABLE_MESSAGE;
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
    ? error.statusCode
    : 500;
  return error instanceof Error && statusCode < 500 ? error.message : 'Không thể xử lý yêu cầu Trợ lý AI lúc này.';
}

export async function streamChat(req: Request, res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  writeSseEvent(res, 'ready', { streaming: true });

  let clientConnected = true;
  res.on('close', () => { clientConnected = false; });

  try {
    const result = await chatWithCoach(req.user!.id, {
      conversationId: req.body.conversationId,
      message: req.body.message,
      context: req.body.context,
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }, {
      onTextDelta: (text) => {
        if (clientConnected && !res.writableEnded) writeSseEvent(res, 'delta', { text });
      },
    });

    if (clientConnected && !res.writableEnded) {
      // Drafts only arrive after the coach has finished validation and persistence.
      writeSseEvent(res, 'final', { success: true, data: result });
      writeSseEvent(res, 'done', {});
      res.end();
    }
  } catch (error) {
    if (clientConnected && !res.writableEnded) {
      writeSseEvent(res, 'error', { message: streamErrorMessage(error) });
      writeSseEvent(res, 'done', {});
      res.end();
    }
  }
}

export async function getPreferences(req: Request, res: Response) {
  return sendSuccess(res, 'Study planning preferences fetched', await getStudyPlanningPreference(req.user!.id));
}

export async function updatePreferences(req: Request, res: Response) {
  return sendSuccess(res, 'Study planning preferences updated', await updateStudyPlanningPreference(req.user!.id, req.body, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }));
}

export async function conversations(req: Request, res: Response) {
  return sendSuccess(res, 'Coach conversations fetched', await listConversations(req.user!.id, res.locals.validatedQuery));
}

export async function messages(req: Request, res: Response) {
  const conversationId = conversationIdFromParams(req, res);
  if (!conversationId) return;
  return sendSuccess(res, 'Coach messages fetched', await listMessages(req.user!.id, conversationId, res.locals.validatedQuery));
}

export async function removeConversation(req: Request, res: Response) {
  const conversationId = conversationIdFromParams(req, res);
  if (!conversationId) return;
  return sendSuccess(res, 'Coach conversation deleted', await deleteConversation(req.user!.id, conversationId, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }));
}

export const getDraftId = requestId;
