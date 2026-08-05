import { RecurrenceRule, ScheduleType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type Input = { subjectId?: string | null; type: ScheduleType; title: string; dayOfWeek?: number | null; startTime: string; endTime: string; startDate: Date; endDate?: Date | null; recurrenceRule?: RecurrenceRule; colorHex?: string | null; reminderBefore?: number | null };
async function owned(userId: string, id: string) { const item = await prisma.schedule.findFirst({ where: { id, userId, deletedAt: null } }); if (!item) throw serviceError('Schedule not found', 404); return item; }
async function subject(userId: string, subjectId?: string | null) { if (!subjectId) return; const item = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } }); if (!item) throw serviceError('Subject not found', 404); }
async function log(userId: string, action: string, entityId: string, context?: Context) { await prisma.activityLog.create({ data: { userId, action, entityType: 'schedule', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } }); }
export async function list(userId: string, query: { subjectId?: string; type?: ScheduleType }) { return prisma.schedule.findMany({ where: { userId, deletedAt: null, ...(query.subjectId ? { subjectId: query.subjectId } : {}), ...(query.type ? { type: query.type } : {}) }, orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }] }); }
export async function create(userId: string, input: Input, context?: Context) { await subject(userId, input.subjectId); const item = await prisma.schedule.create({ data: { ...input, userId } }); await log(userId, 'schedule.created', item.id, context); return item; }
export async function detail(userId: string, id: string) { return owned(userId, id); }
export async function update(userId: string, id: string, input: Partial<Input>, context?: Context) { const current = await owned(userId, id); if (input.subjectId) await subject(userId, input.subjectId); const startDate = input.startDate ?? current.startDate; const endDate = input.endDate === undefined ? current.endDate : input.endDate; if (endDate && endDate < startDate) throw serviceError('endDate must be on or after startDate', 422); const item = await prisma.schedule.update({ where: { id }, data: input }); await log(userId, 'schedule.updated', id, context); return item; }
export async function remove(userId: string, id: string, context?: Context) { await owned(userId, id); const item = await prisma.schedule.update({ where: { id }, data: { deletedAt: new Date() } }); await log(userId, 'schedule.deleted', id, context); return item; }
