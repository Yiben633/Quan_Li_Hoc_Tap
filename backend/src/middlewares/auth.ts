import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/http.js';

export type AuthUser = { id: string; roles: string[] };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export const authenticate: RequestHandler = (req, res, next) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return sendError(res, 'Authentication required', undefined, 401);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & { roles?: string[] };
    if (!payload.sub) return sendError(res, 'Invalid access token', undefined, 401);
    req.user = { id: payload.sub, roles: payload.roles ?? [] };
    next();
  } catch {
    sendError(res, 'Invalid or expired access token', undefined, 401);
  }
};

export const authorize = (...allowedRoles: string[]): RequestHandler => (req, res, next) => {
  if (!req.user || !allowedRoles.some((role) => req.user?.roles.includes(role))) {
    return sendError(res, 'Forbidden', undefined, 403);
  }
  next();
};
