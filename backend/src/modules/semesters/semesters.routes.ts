import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './semesters.controller.js';
import { semesterCreateSchema, semesterListSchema, semesterUpdateSchema } from './semesters.schemas.js';

export const semestersRouter = Router();
semestersRouter.use(authenticate);
semestersRouter.get('/', validateQuery(semesterListSchema), asyncHandler(controller.list));
semestersRouter.post('/', validateBody(semesterCreateSchema), asyncHandler(controller.create));
semestersRouter.post('/:id/close', asyncHandler(controller.close));
semestersRouter.post('/:id/duplicate', asyncHandler(controller.duplicate));
semestersRouter.get('/:id', asyncHandler(controller.detail));
semestersRouter.patch('/:id', validateBody(semesterUpdateSchema), asyncHandler(controller.update));
semestersRouter.delete('/:id', asyncHandler(controller.remove));
