import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './users.service.js';

function handleError(res: Response, error: unknown) {
  const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';
  return sendError(res, statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, undefined, statusCode);
}

export async function getMe(req: Request, res: Response) {
  try { return sendSuccess(res, 'Current user profile', await service.getProfile(req.user!.id)); } catch (error) { return handleError(res, error); }
}

export async function updateMe(req: Request, res: Response) {
  try { return sendSuccess(res, 'Profile updated', await service.updateProfile(req.user!.id, req.body)); } catch (error) { return handleError(res, error); }
}

export async function updateAvatar(req: Request, res: Response) {
  try {
    if (!req.file) return sendError(res, 'Avatar file is required', undefined, 400);
    return sendSuccess(res, 'Avatar updated', await service.updateAvatar(req.user!.id, req.file));
  } catch (error) { return handleError(res, error); }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    await service.updatePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, 'Password updated', null);
  } catch (error) { return handleError(res, error); }
}

export async function deleteMe(req: Request, res: Response) {
  try {
    await service.deleteAccount(req.user!.id);
    return sendSuccess(res, 'Account marked as deleted', null);
  } catch (error) { return handleError(res, error); }
}
