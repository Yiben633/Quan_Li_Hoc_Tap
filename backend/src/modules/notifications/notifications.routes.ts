import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as controller from './notifications.controller.js';
import { listSchema, settingsSchema } from './notifications.schemas.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', validateQuery(listSchema), asyncHandler(controller.list));
notificationsRouter.patch('/read-all', asyncHandler(controller.readAll));
notificationsRouter.patch('/:id/read', asyncHandler(controller.read));
notificationsRouter.get('/settings', asyncHandler(controller.getSettings));
notificationsRouter.patch('/settings', validateBody(settingsSchema), asyncHandler(controller.updateSettings));

export const notificationSettingsRouter = Router();
notificationSettingsRouter.use(authenticate);
notificationSettingsRouter.get('/', asyncHandler(controller.getSettings));
notificationSettingsRouter.patch('/', validateBody(settingsSchema), asyncHandler(controller.updateSettings));

export const notificationCronRouter = Router();
notificationCronRouter.get('/notifications', asyncHandler(controller.cron));
