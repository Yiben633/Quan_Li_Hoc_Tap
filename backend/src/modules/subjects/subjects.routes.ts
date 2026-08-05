import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './subjects.controller.js';
import { subjectCreateSchema, subjectListSchema, subjectUpdateSchema } from './subjects.schemas.js';

export const subjectsRouter = Router();
subjectsRouter.use(authenticate);
subjectsRouter.get('/', validateQuery(subjectListSchema), asyncHandler(controller.list));
subjectsRouter.post('/', validateBody(subjectCreateSchema), asyncHandler(controller.create));
subjectsRouter.get('/:id', asyncHandler(controller.detail));
subjectsRouter.patch('/:id', validateBody(subjectUpdateSchema), asyncHandler(controller.update));
subjectsRouter.delete('/:id', asyncHandler(controller.remove));
subjectsRouter.patch('/:id/complete', asyncHandler(controller.complete));
