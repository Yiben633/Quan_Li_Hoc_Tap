import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as c from './groups.controller.js';
import { groupSchema, groupTaskSchema, groupTaskUpdateSchema, memberSchema } from './groups.schemas.js';
export const groupsRouter = Router(); groupsRouter.use(authenticate);
groupsRouter.get('/', asyncHandler(c.list)); groupsRouter.post('/', validateBody(groupSchema), asyncHandler(c.create)); groupsRouter.get('/:id/progress', asyncHandler(c.progress)); groupsRouter.get('/:id', asyncHandler(c.detail)); groupsRouter.patch('/:id', validateBody(groupSchema.partial()), asyncHandler(c.update)); groupsRouter.delete('/:id', asyncHandler(c.remove)); groupsRouter.post('/:id/members', validateBody(memberSchema), asyncHandler(c.invite)); groupsRouter.post('/:id/members/:memberId/accept', asyncHandler(c.accept)); groupsRouter.post('/:id/tasks', validateBody(groupTaskSchema), asyncHandler(c.createTask)); groupsRouter.patch('/:id/tasks/:taskId', validateBody(groupTaskUpdateSchema), asyncHandler(c.updateTask));
