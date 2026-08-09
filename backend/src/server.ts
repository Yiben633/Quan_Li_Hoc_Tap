import { app } from './app.js';
import { env } from './config/env.js';
import { startNotificationCron } from './jobs/notificationScheduler.js';

const server = app.listen(env.PORT, () => {
  console.log(`StudyFlow backend listening on http://localhost:${env.PORT}`);
});
if (env.NODE_ENV !== 'production' && env.VERCEL !== '1') startNotificationCron();

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
