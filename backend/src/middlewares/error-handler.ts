import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { logger } from './logger.js';
import { sendError } from '../utils/http.js';
import { env } from '../config/env.js';

export const notFound: RequestHandler = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.path}`, undefined, 404);
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) return;
  if (error instanceof ZodError) {
    sendError(res, 'Validation failed', error.issues, 422);
    return;
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? `Uploaded file must not exceed ${Math.round(env.DOCUMENT_MAX_UPLOAD_BYTES / 1024 / 1024)}MB` : error.message;
    sendError(res, message, undefined, 422);
    return;
  }
  if (error instanceof Error && req.path.startsWith('/api/documents')) {
    sendError(res, error.message, undefined, 422);
    return;
  }
  logger.error('unhandled_error', { requestId: res.locals.requestId, error });
  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error',
    undefined,
    500,
  );
};
