import cron from 'node-cron';
import { logger } from '../middlewares/logger.js';
import { runNotificationJob } from './notificationJob.js';

export const NOTIFICATION_CRON_SCHEDULE = '*/5 * * * *';

type Runner = () => Promise<unknown>;

export function startNotificationCron(
  schedule = NOTIFICATION_CRON_SCHEDULE,
  runner: Runner = () => runNotificationJob({ source: 'local', userAgent: 'node-cron' }),
) {
  const job = cron.schedule(schedule, () => {
    void runner().catch((error) => logger.error('notification_cron_failed', { error }));
  }, { timezone: 'Asia/Ho_Chi_Minh', noOverlap: true });
  logger.info('notification_cron_started', { schedule, timezone: 'Asia/Ho_Chi_Minh' });
  return job;
}
