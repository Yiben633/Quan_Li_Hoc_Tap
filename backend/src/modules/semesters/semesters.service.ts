import { Prisma, SemesterStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };

function cleanSemester<T extends { targetGpa: Prisma.Decimal | null }>(semester: T) {
  return { ...semester, targetGpa: semester.targetGpa === null ? null : Number(semester.targetGpa) };
}

async function getOwnedSemester(userId: string, id: string) {
  const semester = await prisma.semester.findFirst({ where: { id, userId, deletedAt: null } });
  if (!semester) throw serviceError('Semester not found', 404);
  return semester;
}

async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'semester', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } });
}

export async function list(userId: string, query: { status?: SemesterStatus; page: number; limit: number; sort: 'name' | 'startDate' | 'endDate' | 'createdAt'; order: 'asc' | 'desc' }) {
  const where = { userId, deletedAt: null, ...(query.status ? { status: query.status } : {}) };
  const [items, total] = await Promise.all([
    prisma.semester.findMany({ where, orderBy: { [query.sort]: query.order }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.semester.count({ where }),
  ]);
  return { items: items.map(cleanSemester), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function create(userId: string, input: {
  name: string; academicYear: string; startDate: Date; endDate: Date; status?: SemesterStatus; targetGpa?: number | null; expectedCredits?: number | null; note?: string | null;
}, context?: Context) {
  const semester = await prisma.semester.create({ data: { ...input, userId }, });
  await log(userId, 'semester.created', semester.id, context);
  return cleanSemester(semester);
}

export async function getDetail(userId: string, id: string) {
  const semester = await getOwnedSemester(userId, id);
  const subjects = await prisma.subject.findMany({ where: { userId, semesterId: id, deletedAt: null }, orderBy: { name: 'asc' } });
  return { ...cleanSemester(semester), subjects: subjects.map((subject) => ({ ...subject, targetGrade: subject.targetGrade === null ? null : Number(subject.targetGrade) })) };
}

export async function update(userId: string, id: string, input: Partial<{
  name: string; academicYear: string; startDate: Date; endDate: Date; status: SemesterStatus; targetGpa: number | null; expectedCredits: number | null; note: string | null;
}>, context?: Context) {
  const current = await getOwnedSemester(userId, id);
  const nextStartDate = input.startDate ?? current.startDate;
  const nextEndDate = input.endDate ?? current.endDate;
  if (nextEndDate < nextStartDate) throw serviceError('endDate must be on or after startDate', 422);
  const semester = await prisma.semester.update({ where: { id }, data: input });
  await log(userId, 'semester.updated', id, context);
  return cleanSemester(semester);
}

export async function softDelete(userId: string, id: string, context?: Context) {
  await getOwnedSemester(userId, id);
  const semester = await prisma.semester.update({ where: { id }, data: { deletedAt: new Date() } });
  await log(userId, 'semester.deleted', id, context);
  return cleanSemester(semester);
}

export async function close(userId: string, id: string, context?: Context) {
  await getOwnedSemester(userId, id);
  const semester = await prisma.semester.update({ where: { id }, data: { status: 'closed' } });
  await log(userId, 'semester.closed', id, context);
  return cleanSemester(semester);
}

export async function duplicate(userId: string, id: string, context?: Context) {
  const original = await getOwnedSemester(userId, id);
  const subjects = await prisma.subject.findMany({ where: { userId, semesterId: id, deletedAt: null }, include: { gradeComponents: true } });
  const duplicated = await prisma.$transaction(async (tx) => {
    const semester = await tx.semester.create({ data: { userId, name: `${original.name} (Copy)`, academicYear: original.academicYear, startDate: original.startDate, endDate: original.endDate, status: 'planning', targetGpa: original.targetGpa, expectedCredits: original.expectedCredits, note: original.note } });
    for (const subject of subjects) {
      const copiedSubject = await tx.subject.create({ data: { userId, semesterId: semester.id, code: subject.code, name: subject.name, credits: subject.credits, lecturer: subject.lecturer, room: subject.room, colorHex: subject.colorHex, targetGrade: subject.targetGrade, status: 'in_progress', note: subject.note } });
      if (subject.gradeComponents.length) await tx.gradeComponent.createMany({ data: subject.gradeComponents.map((component) => ({ subjectId: copiedSubject.id, name: component.name, maxScore: component.maxScore, weightPercent: component.weightPercent, examDate: component.examDate, note: component.note, sortOrder: component.sortOrder })) });
    }
    return semester;
  });
  await log(userId, 'semester.duplicated', duplicated.id, context);
  return cleanSemester(duplicated);
}
