import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createRateLimitStore } from '../../lib/redis-rate-limit-store.js';
import { rateLimitKey } from '../../lib/rate-limit-key.js';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { z } from 'zod';
import * as controller from './ai.controller.js';
import { coachRouter } from './coach/coach.routes.js';
import { updateScheduleDraftSchema } from './coach/draft.service.js';

const slot = z.object({ startAt: z.coerce.date(), endAt: z.coerce.date() });
const tasks = z.array(z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  estimatedMinutes: z.coerce.number().int().positive(),
  dueDate: z.coerce.date().nullable().optional(),
}));
const scheduleSchema = z.object({ tasks, slots: z.array(slot).min(1) });
const chatSchema = z.object({ prompt: z.string().min(1).max(20_000) });
const textSchema = z.object({ text: z.string().min(1).max(100_000), count: z.coerce.number().int().min(1).max(50).default(10) });

// One Redis-backed limiter for every AI route, including /api/ai/coach/*.
// Conversation memory itself never creates a separate limiter or quota store.
export const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  store: createRateLimitStore('ai'),
  passOnStoreError: true,
});

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiRateLimiter);

aiRouter.post('/suggest-schedule', validateBody(scheduleSchema), asyncHandler(controller.suggest));
aiRouter.post('/reschedule', validateBody(scheduleSchema), asyncHandler(controller.reschedule));
aiRouter.post('/chat', validateBody(chatSchema), asyncHandler(controller.chat));
aiRouter.post('/summarize-document', validateBody(textSchema.omit({ count: true })), asyncHandler(controller.summarize));
aiRouter.post('/generate-flashcards', validateBody(textSchema), asyncHandler(controller.flashcards));
aiRouter.patch('/coach/drafts/:id', validateBody(updateScheduleDraftSchema), asyncHandler(controller.updateDraft));
aiRouter.post('/coach/drafts/:id/apply', asyncHandler(controller.applyDraft));
aiRouter.post('/coach/drafts/:id/discard', asyncHandler(controller.discardDraftController));

// Mount last, but after aiRateLimiter so every Coach endpoint shares it.
aiRouter.use('/coach', coachRouter);
