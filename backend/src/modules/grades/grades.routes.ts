import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './grades.controller.js';
import { componentCreateSchema, componentUpdateSchema, gradeInputSchema } from './grades.schemas.js';

export const gradesRouter = Router();
gradesRouter.use(authenticate);
gradesRouter.get('/subjects/:subjectId/grade-components', asyncHandler(controller.list));
gradesRouter.post('/subjects/:subjectId/grade-components', validateBody(componentCreateSchema), asyncHandler(controller.create));
gradesRouter.patch('/grade-components/:id', validateBody(componentUpdateSchema), asyncHandler(controller.update));
gradesRouter.delete('/grade-components/:id', asyncHandler(controller.remove));
gradesRouter.put('/grade-components/:id/grade', validateBody(gradeInputSchema), asyncHandler(controller.grade));
gradesRouter.get('/subjects/:subjectId/grade-summary', asyncHandler(controller.summary));
gradesRouter.get('/gpa/:semesterId', asyncHandler(controller.gpa));
