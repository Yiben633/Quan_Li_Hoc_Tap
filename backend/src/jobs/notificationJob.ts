import { randomUUID } from 'node:crypto';
import type { NotificationSetting, NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ensureRedisReady, redis } from '../lib/redis.js';
import { logger } from '../middlewares/logger.js';
import { progress as goalProgress } from '../modules/goals/goals.service.js';
import { emailChannel, pushChannel } from '../modules/notifications/notification-channel.js';
import { getSettings } from '../modules/notifications/notifications.service.js';

export const NOTIFICATION_JOB_LOCK_KEY = 'jobs:notifications:lock';
const JOB_LOCK_TTL_SECONDS = 290;

type JobSource = 'local' | 'vercel' | 'manual';
type JobOptions = { source?: JobSource; userAgent?: string };
type User = { id: string; email: string; notificationSetting: NotificationSetting | null };
type Candidate = {
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: string;
  windowHours: number;
};

const releaseIfOwnedScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

function dayStart(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function dateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date(date);
  value.setUTCHours(hours, minutes, 0, 0);
  return value;
}

function nextScheduleOccurrence(
  schedule: {
    startDate: Date;
    endDate: Date | null;
    startTime: string;
    dayOfWeek: number | null;
    recurrenceRule: string;
  },
  now: Date,
  horizon: Date,
) {
  const first = dayStart(schedule.startDate) > dayStart(now) ? dayStart(schedule.startDate) : dayStart(now);
  const last = schedule.endDate
    ? new Date(Math.min(dayStart(schedule.endDate).getTime(), horizon.getTime()))
    : horizon;

  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    const isStart = cursor.getTime() === dayStart(schedule.startDate).getTime();
    const weekday = schedule.dayOfWeek ?? dayStart(schedule.startDate).getUTCDay();
    if (schedule.recurrenceRule === 'none' && !isStart) continue;
    if (schedule.recurrenceRule === 'weekly' && cursor.getUTCDay() !== weekday) continue;
    const occurrence = dateTime(cursor, schedule.startTime);
    if (occurrence >= now && occurrence <= horizon) return occurrence;
  }

  return null;
}

async function candidates(user: User & { notificationSetting: NotificationSetting }, now: Date): Promise<Candidate[]> {
  const reminderEnd = new Date(now.getTime() + user.notificationSetting.reminderMinutesBefore * 60_000);
  const planEnd = addDays(now, 7);
  const [tasksDue, tasksOverdue, plans, schedules, goals] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: { not: 'done' },
        dueDate: { gte: now, lte: reminderEnd },
      },
      select: { id: true, title: true, dueDate: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id, deletedAt: null, status: { not: 'done' }, dueDate: { lt: now } },
      select: { id: true, title: true, dueDate: true },
    }),
    prisma.studyPlan.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: { notIn: ['completed'] },
        endDate: { gte: now, lte: planEnd },
      },
      select: { id: true, title: true, endDate: true, progressPercent: true },
    }),
    prisma.schedule.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        startDate: { lte: planEnd },
        OR: [{ endDate: null }, { endDate: { gte: dayStart(now) } }],
      },
      select: {
        id: true,
        type: true,
        title: true,
        startDate: true,
        endDate: true,
        startTime: true,
        dayOfWeek: true,
        recurrenceRule: true,
      },
    }),
    prisma.goal.findMany({
      where: { userId: user.id, status: 'in_progress' },
      select: {
        id: true,
        name: true,
        type: true,
        targetValue: true,
        currentValue: true,
        subjectId: true,
        deadline: true,
      },
    }),
  ]);

  const result: Candidate[] = [];
  for (const task of tasksDue) {
    result.push({
      type: 'deadline_soon',
      title: 'Task deadline soon',
      message: `Task "${task.title}" is due soon.`,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      windowHours: 24,
    });
  }
  for (const task of tasksOverdue) {
    result.push({
      type: 'task_overdue',
      title: 'Task overdue',
      message: `Task "${task.title}" is overdue.`,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      windowHours: 24,
    });
  }
  for (const plan of plans) {
    result.push({
      type: 'plan_incomplete',
      title: 'Study plan deadline soon',
      message: `Study plan "${plan.title}" is ${plan.progressPercent}% complete and near its deadline.`,
      relatedEntityType: 'study_plan',
      relatedEntityId: plan.id,
      windowHours: 24,
    });
  }
  for (const schedule of schedules) {
    const occurrence = nextScheduleOccurrence(schedule, now, reminderEnd);
    if (!occurrence) continue;
    const type = schedule.type === 'exam' ? 'exam_soon' : 'class_soon';
    result.push({
      type,
      title: type === 'exam_soon' ? 'Exam soon' : 'Schedule soon',
      message: `${schedule.title} starts at ${occurrence.toISOString()}.`,
      relatedEntityType: 'schedule',
      relatedEntityId: schedule.id,
      windowHours: 24,
    });
  }
  for (const goal of goals) {
    const calculated = await goalProgress(user.id, goal);
    if (goal.deadline && goal.deadline <= planEnd && calculated.progressPercent < 100 && calculated.progressPercent <= 50) {
      result.push({
        type: 'goal_at_risk',
        title: 'Goal at risk',
        message: `Goal "${goal.name}" is approaching its deadline.`,
        relatedEntityType: 'goal',
        relatedEntityId: goal.id,
        windowHours: 24,
      });
    }
  }
  return result;
}

function dedupeKey(userId: string, candidate: Candidate) {
  return [
    'notifications',
    'dedupe',
    userId,
    candidate.type,
    candidate.relatedEntityType,
    candidate.relatedEntityId,
  ].join(':');
}

async function releaseIfOwned(key: string, token: string) {
  await redis.eval(releaseIfOwnedScript, 1, key, token);
}

async function dispatch(user: User & { notificationSetting: NotificationSetting }, candidate: Candidate, now: Date) {
  const key = dedupeKey(user.id, candidate);
  const token = randomUUID();
  const ttlSeconds = Math.max(candidate.windowHours * 3_600, 60);
  const acquired = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
  if (!acquired) return false;

  let claimedInDatabase = false;
  try {
    const duplicateSince = new Date(now.getTime() - candidate.windowHours * 3_600_000);
    const exists = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: candidate.type,
        relatedEntityType: candidate.relatedEntityType,
        relatedEntityId: candidate.relatedEntityId,
        createdAt: { gte: duplicateSince },
      },
    });
    if (exists) return false;

    const setting = user.notificationSetting;
    if (!setting.inAppEnabled && !setting.emailEnabled && !setting.pushEnabled) {
      await releaseIfOwned(key, token);
      return false;
    }

    const channel = setting.inAppEnabled ? 'in_app' : setting.emailEnabled ? 'email' : 'push';
    const item = await prisma.notification.create({
      data: {
        userId: user.id,
        type: candidate.type,
        title: candidate.title,
        message: candidate.message,
        relatedEntityType: candidate.relatedEntityType,
        relatedEntityId: candidate.relatedEntityId,
        channel,
      },
    });
    claimedInDatabase = true;

    if (setting.emailEnabled) {
      await emailChannel.send({ to: user.email, subject: candidate.title, text: candidate.message });
    }
    if (setting.pushEnabled) {
      await pushChannel.send({ to: user.id, subject: candidate.title, text: candidate.message });
    }
    if (setting.emailEnabled || setting.pushEnabled) {
      await prisma.notification.update({ where: { id: item.id }, data: { sentAt: now } });
    }

    return true;
  } catch (error) {
    // Once the database claim exists, retain both claims to avoid sending an
    // already-delivered external notification again on the next cron retry.
    if (!claimedInDatabase) await releaseIfOwned(key, token).catch(() => undefined);
    throw error;
  }
}

export async function runNotificationJob(options: JobOptions = {}) {
  const source = options.source ?? 'manual';
  const startedAt = Date.now();
  await ensureRedisReady();
  const lockToken = randomUUID();
  const acquired = await redis.set(NOTIFICATION_JOB_LOCK_KEY, lockToken, 'EX', JOB_LOCK_TTL_SECONDS, 'NX');

  if (!acquired) {
    logger.info('notification_job_skipped', { source, reason: 'already_running', userAgent: options.userAgent });
    return { source, skipped: true, reason: 'already_running', users: 0, candidates: 0, created: 0, durationMs: 0 };
  }

  logger.info('notification_job_started', { source, userAgent: options.userAgent });
  try {
    const now = new Date();
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, notificationSetting: true },
    });
    let created = 0;
    let candidatesCount = 0;

    for (const user of users) {
      const setting = user.notificationSetting ?? await getSettings(user.id);
      const normalized = { ...user, notificationSetting: setting };
      const items = await candidates(normalized, now);
      candidatesCount += items.length;
      for (const item of items) created += Number(await dispatch(normalized, item, now));
    }

    const result = {
      source,
      skipped: false,
      users: users.length,
      candidates: candidatesCount,
      created,
      durationMs: Date.now() - startedAt,
    };
    logger.info('notification_job_completed', result);
    return result;
  } catch (error) {
    logger.error('notification_job_failed', { source, userAgent: options.userAgent, error });
    throw error;
  } finally {
    await releaseIfOwned(NOTIFICATION_JOB_LOCK_KEY, lockToken).catch((error) => {
      logger.error('notification_job_lock_release_failed', { source, error });
    });
  }
}
