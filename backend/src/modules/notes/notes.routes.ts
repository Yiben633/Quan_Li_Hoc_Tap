import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './notes.controller.js';
import { createSchema, listSchema, pinSchema, updateSchema } from './notes.schemas.js';

export const notesRouter = Router();
notesRouter.use(authenticate);
notesRouter.get('/', validateQuery(listSchema), asyncHandler(controller.list));
notesRouter.post('/', validateBody(createSchema), asyncHandler(controller.create));
notesRouter.get('/:id', asyncHandler(controller.detail));
notesRouter.patch('/:id/pin', validateBody(pinSchema), asyncHandler(controller.pin));
notesRouter.patch('/:id', validateBody(updateSchema), asyncHandler(controller.update));
notesRouter.delete('/:id', asyncHandler(controller.remove));
