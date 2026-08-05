import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './users.controller.js';
import { avatarUpload } from './avatar.upload.js';
import { updatePasswordSchema, updateProfileSchema } from './users.schemas.js';

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get('/me', asyncHandler(controller.getMe));
usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(controller.updateMe));
usersRouter.patch('/me/avatar', avatarUpload.single('avatar'), asyncHandler(controller.updateAvatar));
usersRouter.patch('/me/password', validateBody(updatePasswordSchema), asyncHandler(controller.updatePassword));
usersRouter.delete('/me', asyncHandler(controller.deleteMe));
