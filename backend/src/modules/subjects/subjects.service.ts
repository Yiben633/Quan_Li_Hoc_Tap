import { Prisma, SubjectStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };

function decimal(value: Prisma.Decimal | null) { return value === null ? null : Number(value); }

function average(components: { weightPercent: Prisma.Decimal; grade: { score: Prisma.Decimal | null } | null }[]) {
  const scored = components.filter((component) => component.grade?.score !== null && component.grade?.score !== undefined);
  const totalWeight = scored.reduce((sum, component) => sum + Number(component.weightPercent), 0);
  if (!totalWeight) return null;
  const total = scored.reduce((sum, component) => sum + Number(component.grade!.score) * Number(component.weightPercent), 0);
  return Math.round((total / totalWeight) * 100) / 100;
}

async function getOwnedSubject(userId: string, id: string) {
  const subject = await prisma.subject.findFirst({ where: { id, userId, deletedAt: null, semester: { deletedAt: null } } });
  if (!subject) throw serviceError('Subject not found', 404);
  return subject;
}

async function ensureSemester(userId: string, semesterId: string) {
  const semester = await prisma.semester.findFirst({ where: { id: semesterId, userId, deletedAt: null } });
  if (!semester) throw serviceError('Semester not found', 404);
}

async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'subject', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } });
}

export async function list(userId: string, query: { semesterId?: string; search?: string; status?: SubjectStatus; page: number; limit: number; sort: 'code' | 'name' | 'credits' | 'createdAt' | 'updatedAt'; order: 'asc' | 'desc' }) {
  if (query.semesterId) await ensureSemester(userId, query.semesterId);
  const where = { userId, deletedAt: null, semester: { deletedAt: null }, ...(query.semesterId ? { semesterId: query.semesterId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ code: { contains: query.search, mode: 'insensitive' as const } }, { name: { contains: query.search, mode: 'insensitive' as const } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.subject.findMany({ where, orderBy: { [query.sort]: query.order }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.subject.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, targetGrade: decimal(item.targetGrade) })), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function create(userId: string, input: {
  semesterId: string; code: string; name: string; credits: number; lecturer?: string | null; room?: string | null; colorHex: string; targetGrade?: number | null; status?: SubjectStatus; note?: string | null;
}, context?: Context) {
  await ensureSemester(userId, input.semesterId);
  const existing = await prisma.subject.findFirst({ where: { userId, semesterId: input.semesterId, code: input.code, deletedAt: null } });
  if (existing) throw serviceError('Subject code already exists in this semester', 409);
  try {
    const subject = await prisma.subject.create({ data: { ...input, userId } });
    await log(userId, 'subject.created', subject.id, context);
    return { ...subject, targetGrade: decimal(subject.targetGrade) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw serviceError('Subject code already exists in this semester', 409);
    throw error;
  }
}

export async function getDetail(userId: string, id: string) {
  const subject = await getOwnedSubject(userId, id);
  const [taskTotal, taskDone, studyTime, gradeComponents] = await Promise.all([
    prisma.task.count({ where: { userId, subjectId: id, deletedAt: null } }),
    prisma.task.count({ where: { userId, subjectId: id, status: 'done', deletedAt: null } }),
    prisma.studySession.aggregate({ where: { userId, subjectId: id }, _sum: { totalMinutes: true } }),
    prisma.gradeComponent.findMany({ where: { subjectId: id }, include: { grade: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  return { ...subject, targetGrade: decimal(subject.targetGrade), statistics: { taskTotal, taskDone, totalStudyMinutes: studyTime._sum.totalMinutes ?? 0, currentAverage: average(gradeComponents) } };
}

export async function update(userId: string, id: string, input: Partial<{ code: string; name: string; credits: number; lecturer: string | null; room: string | null; colorHex: string; targetGrade: number | null; status: SubjectStatus; note: string | null }>, context?: Context) {
  const current = await getOwnedSubject(userId, id);
  if (input.code) {
    const duplicate = await prisma.subject.findFirst({ where: { userId, semesterId: current.semesterId, code: input.code, deletedAt: null, NOT: { id } } });
    if (duplicate) throw serviceError('Subject code already exists in this semester', 409);
  }
  const subject = await prisma.subject.update({ where: { id }, data: input });
  await log(userId, 'subject.updated', id, context);
  return { ...subject, targetGrade: decimal(subject.targetGrade) };
}

export async function softDelete(userId: string, id: string, context?: Context) {
  await getOwnedSubject(userId, id);
  const subject = await prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
  await log(userId, 'subject.deleted', id, context);
  return { ...subject, targetGrade: decimal(subject.targetGrade) };
}

export async function complete(userId: string, id: string, context?: Context) {
  await getOwnedSubject(userId, id);
  const subject = await prisma.subject.update({ where: { id }, data: { status: 'completed' } });
  await log(userId, 'subject.completed', id, context);
  return { ...subject, targetGrade: decimal(subject.targetGrade) };
}
