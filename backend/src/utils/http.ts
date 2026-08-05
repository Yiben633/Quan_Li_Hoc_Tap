import type { Response } from 'express';

export function sendSuccess<T>(res: Response, message: string, data: T, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function sendError(
  res: Response,
  message: string,
  errors?: unknown,
  status = 400,
) {
  return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
}
