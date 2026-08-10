import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { logger } from '../../middlewares/logger.js';
import { sendError, sendSuccess } from '../../utils/http.js';
import * as service from './auth.service.js';

const COOKIE_NAME = 'refreshToken';
const CSRF_COOKIE_NAME = 'csrfToken';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const csrfCookieOptions = { ...cookieOptions, httpOnly: false, path: '/' };
const legacyCsrfCookieOptions = { ...cookieOptions, httpOnly: false, path: '/api/auth' };

function context(req: Request) {
  return { ipAddress: req.ip, userAgent: req.get('user-agent') };
}

function getRefreshToken(req: Request, bodyToken?: string) {
  return req.cookies?.[COOKIE_NAME] ?? bodyToken;
}

function setAuthCookies(res: Response, refreshToken: string) {
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, legacyCsrfCookieOptions);
  res.cookie(CSRF_COOKIE_NAME, randomBytes(32).toString('hex'), csrfCookieOptions);
}

function assertCsrf(req: Request) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (!cookieToken) return true;
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.header('x-csrf-token');
  return Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader);
}

function handleError(req: Request, res: Response, error: unknown) {
  const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';
  if (statusCode >= 500) {
    const details = error instanceof Error
      ? error as Error & { code?: string; clientVersion?: string; meta?: unknown }
      : undefined;
    logger.error('auth_request_failed', {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.path,
      error: details
        ? {
            name: details.name,
            message: details.message,
            code: details.code,
            clientVersion: details.clientVersion,
            meta: details.meta,
          }
        : { message },
    });
  }
  return sendError(res, statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, undefined, statusCode);
}

export async function register(req: Request, res: Response) {
  try { return sendSuccess(res, 'Registration successful', await service.register(req.body, context(req)), 201); } catch (error) { return handleError(req, res, error); }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await service.login(req.body.email, req.body.password, context(req));
    setAuthCookies(res, result.refreshToken);
    return sendSuccess(res, 'Login successful', { user: result.user, accessToken: result.accessToken });
  } catch (error) { return handleError(req, res, error); }
}

export async function refresh(req: Request, res: Response) {
  try {
    if (!assertCsrf(req)) return sendError(res, 'CSRF validation failed', undefined, 403);
    const rawToken = getRefreshToken(req, req.body.refreshToken);
    if (!rawToken) return sendError(res, 'Refresh token required', undefined, 401);
    const result = await service.refresh(rawToken, context(req));
    setAuthCookies(res, result.refreshToken);
    return sendSuccess(res, 'Token refreshed', { user: result.user, accessToken: result.accessToken });
  } catch (error) { return handleError(req, res, error); }
}

export async function logout(req: Request, res: Response) {
  try {
    if (!assertCsrf(req)) return sendError(res, 'CSRF validation failed', undefined, 403);
    await service.logout(getRefreshToken(req, req.body.refreshToken), context(req));
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
    res.clearCookie(CSRF_COOKIE_NAME, { ...csrfCookieOptions, maxAge: undefined });
    return sendSuccess(res, 'Logout successful', null);
  } catch (error) { return handleError(req, res, error); }
}

export async function forgotPassword(req: Request, res: Response) {
  try { return sendSuccess(res, 'If the account exists, a reset OTP has been sent', await service.forgotPassword(req.body.email)); } catch (error) { return handleError(req, res, error); }
}

export async function verifyOtp(req: Request, res: Response) {
  try { await service.verifyOtp(req.body.email, req.body.otp); return sendSuccess(res, 'OTP verified', null); } catch (error) { return handleError(req, res, error); }
}

export async function resetPassword(req: Request, res: Response) {
  try { await service.resetPassword(req.body.email, req.body.otp, req.body.newPassword, context(req)); return sendSuccess(res, 'Password reset successful', null); } catch (error) { return handleError(req, res, error); }
}

export async function me(req: Request, res: Response) {
  try { return sendSuccess(res, 'Current user', await service.getCurrentUser(req.user!.id)); } catch (error) { return handleError(req, res, error); }
}
