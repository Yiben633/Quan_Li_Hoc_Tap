import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type Settings = { reminderMinutesBefore: number; emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean };
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
