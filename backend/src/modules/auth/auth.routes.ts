import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { rateLimit } from 'express-rate-limit';
import { createRateLimitStore } from '../../lib/redis-rate-limit-store.js';
import { rateLimitKey } from '../../lib/rate-limit-key.js';
import * as controller from './auth.controller.js';
import { emailSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema, verifyOtpSchema } from './auth.schemas.js';

export const authRouter = Router();
authRouter.use(rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  store: createRateLimitStore('auth'),
  passOnStoreError: true,
}));
authRouter.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
authRouter.post('/logout', validateBody(refreshSchema), asyncHandler(controller.logout));
authRouter.post('/forgot-password', validateBody(emailSchema), asyncHandler(controller.forgotPassword));
authRouter.post('/verify-otp', validateBody(verifyOtpSchema), asyncHandler(controller.verifyOtp));
authRouter.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
authRouter.get('/me', authenticate, asyncHandler(controller.me));
