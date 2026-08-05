import { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';
import { emailChannel } from './notification-channel.js';
import { progress as goalProgress } from '../goals/goals.service.js';

type Context = { ipAddress?: string; userAgent?: string };
type Settings = { reminderMinutesBefore: number; emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean };
type User = { id: string; email: string; notificationSetting: Settings | null };
type Candidate = { type: NotificationType; title: string; message: string; relatedEntityType: string; relatedEntityId: string; windowHours: number };
function dayStart(date: Date) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
function dateTime(date: Date, time: string) { const [hours, minutes] = time.split(':').map(Number); const value = new Date(date); value.setUTCHours(hours, minutes, 0, 0); return value; }
function nextScheduleOccurrence(schedule: { startDate: Date; endDate: Date | null; startTime: string; dayOfWeek: number | null; recurrenceRule: string }, now: Date, horizon: Date) {
  const first = dayStart(schedule.startDate) > dayStart(now) ? dayStart(schedule.startDate) : dayStart(now);
  const last = schedule.endDate ? new Date(Math.min(dayStart(schedule.endDate).getTime(), horizon.getTime())) : horizon;
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    const isStart = cursor.getTime() === dayStart(schedule.startDate).getTime();
    const weekday = schedule.dayOfWeek ?? dayStart(schedule.startDate).getUTCDay();
    if ((schedule.recurrenceRule === 'none' && !isStart) || (schedule.recurrenceRule === 'weekly' && cursor.getUTCDay() !== weekday)) continue;
    const occurrence = dateTime(cursor, schedule.startTime);
    if (occurrence >= now && occurrence <= horizon) return occurrence;
  }
  return null;
}
async function settings(userId: string) { return prisma.notificationSetting.upsert({ where: { userId }, create: { userId }, update: {} }); }
async function ownedNotification(userId: string, id: string) { const item = await prisma.notification.findFirst({ where: { id, userId } }); if (!item) throw serviceError('Notification not found', 404); return item; }
async function log(userId: string, action: string, entityId?: string, context?: Context) { await prisma.activityLog.create({ data: { userId, action, entityType: 'notification', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } }); }

export async function list(userId: string, query: { isRead?: boolean; page: number; limit: number }) {
  const where = { userId, ...(query.isRead === undefined ? {} : { isRead: query.isRead }) };
  const [items, total] = await Promise.all([prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.notification.count({ where })]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}
export async function markRead(userId: string, id: string, context?: Context) { await ownedNotification(userId, id); const item = await prisma.notification.update({ where: { id }, data: { isRead: true } }); await log(userId, 'notification.read', id, context); return item; }
export async function markAllRead(userId: string, context?: Context) { const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }); await log(userId, 'notification.read_all', undefined, context); return { updated: result.count }; }
export async function getSettings(userId: string) { return settings(userId); }
export async function updateSettings(userId: string, input: Partial<Settings>, context?: Context) { const item = await prisma.notificationSetting.upsert({ where: { userId }, create: { userId, ...input }, update: input }); await log(userId, 'notification_settings.updated', item.id, context); return item; }

async function candidates(user: User, now: Date): Promise<Candidate[]> {
  const reminderEnd = new Date(now.getTime() + user.notificationSetting!.reminderMinutesBefore * 60_000);
  const planEnd = addDays(now, 7);
  const [tasksDue, tasksOverdue, plans, schedules, goals] = await Promise.all([
    prisma.task.findMany({ where: { userId: user.id, deletedAt: null, status: { not: 'done' }, dueDate: { gte: now, lte: reminderEnd } }, select: { id: true, title: true, dueDate: true } }),
    prisma.task.findMany({ where: { userId: user.id, deletedAt: null, status: { not: 'done' }, dueDate: { lt: now } }, select: { id: true, title: true, dueDate: true } }),
    prisma.studyPlan.findMany({ where: { userId: user.id, deletedAt: null, status: { notIn: ['completed'] }, endDate: { gte: now, lte: planEnd } }, select: { id: true, title: true, endDate: true, progressPercent: true } }),
    prisma.schedule.findMany({ where: { userId: user.id, deletedAt: null, startDate: { lte: planEnd }, OR: [{ endDate: null }, { endDate: { gte: dayStart(now) } }] }, select: { id: true, type: true, title: true, startDate: true, endDate: true, startTime: true, dayOfWeek: true, recurrenceRule: true } }),
    prisma.goal.findMany({ where: { userId: user.id, status: 'in_progress' }, select: { id: true, name: true, type: true, targetValue: true, currentValue: true, subjectId: true, deadline: true } }),
  ]);
  const result: Candidate[] = [];
  for (const task of tasksDue) result.push({ type: 'deadline_soon', title: 'Task deadline soon', message: `Task "${task.title}" is due soon.`, relatedEntityType: 'task', relatedEntityId: task.id, windowHours: 24 });
  for (const task of tasksOverdue) result.push({ type: 'task_overdue', title: 'Task overdue', message: `Task "${task.title}" is overdue.`, relatedEntityType: 'task', relatedEntityId: task.id, windowHours: 24 });
  for (const plan of plans) result.push({ type: 'plan_incomplete', title: 'Study plan deadline soon', message: `Study plan "${plan.title}" is ${plan.progressPercent}% complete and near its deadline.`, relatedEntityType: 'study_plan', relatedEntityId: plan.id, windowHours: 24 });
  for (const schedule of schedules) { const occurrence = nextScheduleOccurrence(schedule, now, reminderEnd); if (occurrence) { const type = schedule.type === 'exam' ? 'exam_soon' : 'class_soon'; result.push({ type, title: type === 'exam_soon' ? 'Exam soon' : 'Schedule soon', message: `${schedule.title} starts at ${occurrence.toISOString()}.`, relatedEntityType: 'schedule', relatedEntityId: schedule.id, windowHours: 24 }); } }
  for (const goal of goals) { const calculated = await goalProgress(user.id, goal); if (goal.deadline && goal.deadline <= planEnd && calculated.progressPercent < 100 && calculated.progressPercent <= 50) result.push({ type: 'goal_at_risk', title: 'Goal at risk', message: `Goal "${goal.name}" is approaching its deadline.`, relatedEntityType: 'goal', relatedEntityId: goal.id, windowHours: 24 }); }
  return result;
}

async function dispatch(user: User, candidate: Candidate, now: Date) {
  const duplicateSince = new Date(now.getTime() - candidate.windowHours * 3_600_000);
  const exists = await prisma.notification.findFirst({ where: { userId: user.id, type: candidate.type, relatedEntityId: candidate.relatedEntityId, createdAt: { gte: duplicateSince } } });
  if (exists) return false;
  let item;
  if (user.notificationSetting!.inAppEnabled) item = await prisma.notification.create({ data: { userId: user.id, type: candidate.type, title: candidate.title, message: candidate.message, relatedEntityType: candidate.relatedEntityType, relatedEntityId: candidate.relatedEntityId, channel: 'in_app' } });
  if (user.notificationSetting!.emailEnabled) {
    await emailChannel.send({ to: user.email, subject: candidate.title, text: candidate.message });
    if (!item) item = await prisma.notification.create({ data: { userId: user.id, type: candidate.type, title: candidate.title, message: candidate.message, relatedEntityType: candidate.relatedEntityType, relatedEntityId: candidate.relatedEntityId, channel: 'email', sentAt: now } });
    else await prisma.notification.update({ where: { id: item.id }, data: { sentAt: now } });
  }
  return Boolean(item);
}

export async function runNotificationEngine() {
  const now = new Date();
  const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, email: true, notificationSetting: true } });
  let created = 0; let candidatesCount = 0;
  for (const user of users) { const setting = user.notificationSetting ?? await settings(user.id); const normalized = { ...user, notificationSetting: setting }; const items = await candidates(normalized, now); candidatesCount += items.length; for (const item of items) if (setting.inAppEnabled || setting.emailEnabled) created += Number(await dispatch(normalized, item, now)); }
  return { users: users.length, candidates: candidatesCount, created };
}
