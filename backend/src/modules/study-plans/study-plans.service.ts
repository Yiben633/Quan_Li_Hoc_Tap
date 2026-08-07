import { Prisma, Priority, StudyPlanStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type PlanInput = { subjectId?: string | null; title: string; description?: string | null; startDate?: Date | null; endDate?: Date | null; targetGoal?: string | null; estimatedHours?: number | null; priority?: Priority; status?: StudyPlanStatus };

function output(plan: { estimatedHours: Prisma.Decimal | null; progressPercent: number; [key: string]: unknown }) {
  return { ...plan, estimatedHours: plan.estimatedHours === null ? null : Number(plan.estimatedHours) };
}

async function owned(userId: string, id: string) {
  const plan = await prisma.studyPlan.findFirst({ where: { id, userId, deletedAt: null } });
  if (!plan) throw serviceError('Study plan not found', 404);
  return plan;
}

async function subjectOwner(userId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } });
  if (!subject) throw serviceError('Subject not found', 404);
}

async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'study_plan', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } });
}

export async function list(userId: string, query: { subjectId?: string; status?: StudyPlanStatus; priority?: Priority; startDate?: Date; endDate?: Date; page: number; limit: number; sort: 'title' | 'startDate' | 'endDate' | 'priority' | 'createdAt'; order: 'asc' | 'desc' }) {
  const where = { userId, deletedAt: null, ...(query.subjectId ? { subjectId: query.subjectId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.priority ? { priority: query.priority } : {}), ...(query.startDate ? { startDate: { gte: query.startDate } } : {}), ...(query.endDate ? { endDate: { lte: query.endDate } } : {}) };
  const [items, total] = await Promise.all([
    prisma.studyPlan.findMany({ where, orderBy: { [query.sort]: query.order }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.studyPlan.count({ where }),
  ]);
  return { items: items.map(output), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function summary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSoonEnd = new Date(today);
  dueSoonEnd.setDate(dueSoonEnd.getDate() + 7);
  dueSoonEnd.setHours(23, 59, 59, 999);
  const baseWhere = { userId, deletedAt: null };

  const [active, dueSoon, completed, overdue] = await Promise.all([
    prisma.studyPlan.count({ where: { ...baseWhere, status: StudyPlanStatus.in_progress } }),
    prisma.studyPlan.count({ where: { ...baseWhere, status: { notIn: [StudyPlanStatus.completed, StudyPlanStatus.overdue] }, endDate: { gte: today, lte: dueSoonEnd } } }),
    prisma.studyPlan.count({ where: { ...baseWhere, status: StudyPlanStatus.completed } }),
    prisma.studyPlan.count({ where: { ...baseWhere, status: { not: StudyPlanStatus.completed }, OR: [{ status: StudyPlanStatus.overdue }, { endDate: { lt: today } }] } }),
  ]);

  return { active, dueSoon, completed, overdue };
}

export async function create(userId: string, input: PlanInput, context?: Context) {
  if (input.subjectId) await subjectOwner(userId, input.subjectId);
  const plan = await prisma.studyPlan.create({ data: { ...input, userId } });
  await log(userId, 'study_plan.created', plan.id, context);
  return output(plan);
}

export async function detail(userId: string, id: string) {
  const plan = await owned(userId, id);
  return output(plan);
}

export async function update(userId: string, id: string, input: Partial<PlanInput>, context?: Context) {
  const current = await owned(userId, id);
  if (input.subjectId) await subjectOwner(userId, input.subjectId);
  const startDate = input.startDate ?? current.startDate;
  const endDate = input.endDate ?? current.endDate;
  if (startDate && endDate && endDate < startDate) throw serviceError('endDate must be on or after startDate', 422);
  const plan = await prisma.studyPlan.update({ where: { id }, data: input });
  await log(userId, 'study_plan.updated', id, context);
  return output(plan);
}

export async function remove(userId: string, id: string, context?: Context) {
  await owned(userId, id);
  const plan = await prisma.studyPlan.update({ where: { id }, data: { deletedAt: new Date() } });
  await log(userId, 'study_plan.deleted', id, context);
  return output(plan);
}
