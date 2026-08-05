import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './kanban.controller.js';
import { kanbanMoveSchema, kanbanQuerySchema } from './kanban.schemas.js';

export const kanbanRouter = Router();
kanbanRouter.use(authenticate);
kanbanRouter.get('/board', validateQuery(kanbanQuerySchema), asyncHandler(controller.board));
kanbanRouter.patch('/move', validateBody(kanbanMoveSchema), asyncHandler(controller.move));
