import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './study-plans.controller.js';
import { studyPlanCreateSchema, studyPlanListSchema, studyPlanUpdateSchema } from './study-plans.schemas.js';

export const studyPlansRouter = Router();
studyPlansRouter.use(authenticate);
studyPlansRouter.get('/', validateQuery(studyPlanListSchema), asyncHandler(controller.list));
studyPlansRouter.post('/', validateBody(studyPlanCreateSchema), asyncHandler(controller.create));
studyPlansRouter.get('/:id', asyncHandler(controller.detail));
studyPlansRouter.patch('/:id', validateBody(studyPlanUpdateSchema), asyncHandler(controller.update));
studyPlansRouter.delete('/:id', asyncHandler(controller.remove));
