import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type Input = { title: string; description?: string | null; startAt: Date; endAt?: Date | null; isAllDay?: boolean; colorHex?: string | null; reminderBefore?: number | null };
async function owned(userId: string, id: string) { const item = await prisma.event.findFirst({ where: { id, userId, deletedAt: null } }); if (!item) throw serviceError('Event not found', 404); return item; }
async function log(userId: string, action: string, entityId: string, context?: Context) { await prisma.activityLog.create({ data: { userId, action, entityType: 'event', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } }); }
export async function list(userId: string) { return prisma.event.findMany({ where: { userId, deletedAt: null }, orderBy: { startAt: 'asc' } }); }
export async function create(userId: string, input: Input, context?: Context) { const item = await prisma.event.create({ data: { ...input, userId } }); await log(userId, 'event.created', item.id, context); return item; }
export async function detail(userId: string, id: string) { return owned(userId, id); }
export async function update(userId: string, id: string, input: Partial<Input>, context?: Context) { const current = await owned(userId, id); const startAt = input.startAt ?? current.startAt; const endAt = input.endAt === undefined ? current.endAt : input.endAt; if (endAt && endAt < startAt) throw serviceError('endAt must be on or after startAt', 422); const item = await prisma.event.update({ where: { id }, data: input }); await log(userId, 'event.updated', id, context); return item; }
export async function remove(userId: string, id: string, context?: Context) { await owned(userId, id); const item = await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } }); await log(userId, 'event.deleted', id, context); return item; }
