import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../../middlewares/validate.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import * as controller from './coach.controller.js';

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(6_000),
  context: z.object({
    subjectId: z.string().uuid().optional(),
    studyPlanId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
  }).strict().optional(),
}).strict();

export const coachRouter = Router();
coachRouter.post('/chat', validateBody(chatSchema), asyncHandler(controller.chat));
