import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './study-sessions.controller.js';
import { pomodoroStartSchema, startSchema, statisticsQuerySchema } from './study-sessions.schemas.js';

export const studySessionsRouter = Router();
studySessionsRouter.use(authenticate);
studySessionsRouter.post('/study-sessions/start', validateBody(startSchema), asyncHandler(controller.start));
studySessionsRouter.post('/study-sessions/:id/pause', asyncHandler(controller.pause));
studySessionsRouter.post('/study-sessions/:id/resume', asyncHandler(controller.resume));
studySessionsRouter.post('/study-sessions/:id/end', asyncHandler(controller.end));
studySessionsRouter.post('/study-sessions/:id/pomodoro/start', validateBody(pomodoroStartSchema), asyncHandler(controller.pomodoroStart));
studySessionsRouter.post('/study-sessions/:id/pomodoro/:pomodoroId/end', asyncHandler(controller.pomodoroEnd));
studySessionsRouter.get('/statistics/study-time', validateQuery(statisticsQuerySchema), asyncHandler(controller.statistics));
