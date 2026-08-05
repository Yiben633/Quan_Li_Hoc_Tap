import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './calendar.controller.js';
import { calendarQuerySchema } from './calendar.schemas.js';
export const calendarRouter = Router();
calendarRouter.use(authenticate);
calendarRouter.get('/', validateQuery(calendarQuerySchema), asyncHandler(controller.get));
