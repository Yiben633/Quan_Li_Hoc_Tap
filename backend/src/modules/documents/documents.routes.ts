import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './documents.controller.js';
import { documentUpload } from './documents.upload.js';
import { listSchema, updateSchema, uploadSchema } from './documents.schemas.js';

export const documentsRouter = Router();
documentsRouter.use(authenticate);
documentsRouter.post('/upload', documentUpload.single('file'), validateBody(uploadSchema), asyncHandler(controller.upload));
documentsRouter.get('/', validateQuery(listSchema), asyncHandler(controller.list));
documentsRouter.get('/:id/download', asyncHandler(controller.download));
documentsRouter.get('/:id', asyncHandler(controller.detail));
documentsRouter.patch('/:id', validateBody(updateSchema), asyncHandler(controller.update));
documentsRouter.delete('/:id', asyncHandler(controller.remove));
