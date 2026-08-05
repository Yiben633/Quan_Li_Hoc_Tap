import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './auth.controller.js';
import { emailSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema, verifyOtpSchema } from './auth.schemas.js';

export const authRouter = Router();
authRouter.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
authRouter.post('/logout', validateBody(refreshSchema), asyncHandler(controller.logout));
authRouter.post('/forgot-password', validateBody(emailSchema), asyncHandler(controller.forgotPassword));
authRouter.post('/verify-otp', validateBody(verifyOtpSchema), asyncHandler(controller.verifyOtp));
authRouter.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
authRouter.get('/me', authenticate, asyncHandler(controller.me));
