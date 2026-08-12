import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRateLimitStore } from '../../lib/redis-rate-limit-store.js';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './ai.controller.js';
import { z } from 'zod';
const slot = z.object({ startAt: z.coerce.date(), endAt: z.coerce.date() });
const tasks = z.array(z.object({ id: z.string().uuid().optional(), title: z.string().min(1), estimatedMinutes: z.coerce.number().int().positive(), dueDate: z.coerce.date().nullable().optional() }));
const scheduleSchema = z.object({ tasks, slots: z.array(slot).min(1) });
const chatSchema = z.object({ prompt: z.string().min(1).max(20000) });
const textSchema = z.object({ text: z.string().min(1).max(100000), count: z.coerce.number().int().min(1).max(50).default(10) });
export const aiRouter = Router(); aiRouter.use(authenticate); aiRouter.use(rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('ai'),
  passOnStoreError: true,
}));
aiRouter.post('/suggest-schedule', validateBody(scheduleSchema), asyncHandler(controller.suggest)); aiRouter.post('/reschedule', validateBody(scheduleSchema), asyncHandler(controller.reschedule)); aiRouter.post('/chat', validateBody(chatSchema), asyncHandler(controller.chat)); aiRouter.post('/summarize-document', validateBody(textSchema.omit({ count: true })), asyncHandler(controller.summarize)); aiRouter.post('/generate-flashcards', validateBody(textSchema), asyncHandler(controller.flashcards)); aiRouter.post('/coach/drafts/:id/apply', asyncHandler(controller.applyDraft));
