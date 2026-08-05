import cron from 'node-cron';
import { logger } from '../../middlewares/logger.js';
import { runNotificationEngine } from './notifications.service.js';

export function startNotificationCron() {
  const job = cron.schedule('*/5 * * * *', () => { void runNotificationEngine().then((result) => logger.info('notification_cron_completed', result)).catch((error) => logger.error('notification_cron_failed', { error })); });
  return job;
}
