import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/http.js';
import { AIProviderError } from '../ai.provider.js';
import { chatWithCoach } from './coach.service.js';

function requestId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
    if (error instanceof AIProviderError) return sendError(res, error.message, undefined, error.statusCode);
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;
    const message = error instanceof Error && statusCode < 500 ? error.message : 'Unable to process the coach request';
    return sendError(res, message, undefined, statusCode);
  }
}

export const getDraftId = requestId;
