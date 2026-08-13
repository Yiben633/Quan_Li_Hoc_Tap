import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../../middlewares/validate.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import * as controller from './coach.controller.js';
import { updateStudyPlanningPreferenceSchema } from './planning-preferences.schemas.js';
import { conversationListQuerySchema, messageListQuerySchema } from './conversation.schemas.js';

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
coachRouter.get('/preferences', asyncHandler(controller.getPreferences));
coachRouter.patch('/preferences', validateBody(updateStudyPlanningPreferenceSchema), asyncHandler(controller.updatePreferences));
coachRouter.get('/conversations', validateQuery(conversationListQuerySchema), asyncHandler(controller.conversations));
coachRouter.get('/conversations/:id/messages', validateQuery(messageListQuerySchema), asyncHandler(controller.messages));
coachRouter.delete('/conversations/:id', asyncHandler(controller.removeConversation));
coachRouter.post('/chat', validateBody(chatSchema), asyncHandler(controller.chat));
