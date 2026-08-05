import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type ComponentInput = { name: string; maxScore?: number; weightPercent: number; examDate?: Date | null; note?: string | null; sortOrder?: number };
type ComponentWithGrade = Prisma.GradeComponentGetPayload<{ include: { grade: true } }>;

function number(value: Prisma.Decimal | number | null) { return value === null ? null : Number(value); }
function clean(component: ComponentWithGrade | (Omit<ComponentWithGrade, 'grade'> & { grade: null })) {
  return { ...component, maxScore: number(component.maxScore), weightPercent: number(component.weightPercent), grade: component.grade ? { ...component.grade, score: number(component.grade.score) } : null };
}
function contextData(context?: Context) { return { ipAddress: context?.ipAddress, userAgent: context?.userAgent }; }
async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'grade', entityId, ...contextData(context) } });
}
async function subject(userId: string, subjectId: string) {
  const item = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } });
  if (!item) throw serviceError('Subject not found', 404);
  return item;
}
async function componentForUser(userId: string, id: string) {
  const item = await prisma.gradeComponent.findFirst({ where: { id, subject: { userId, deletedAt: null, semester: { deletedAt: null } } }, include: { grade: true } });
  if (!item) throw serviceError('Grade component not found', 404);
  return item;
}
async function componentsForSubject(userId: string, subjectId: string) {
  await subject(userId, subjectId);
  return prisma.gradeComponent.findMany({ where: { subjectId }, include: { grade: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
}

export async function listComponents(userId: string, subjectId: string) {
  return (await componentsForSubject(userId, subjectId)).map(clean);
}
export async function createComponent(userId: string, subjectId: string, input: ComponentInput, context?: Context) {
  await subject(userId, subjectId);
  const item = await prisma.gradeComponent.create({ data: { ...input, subjectId, maxScore: input.maxScore ?? 10 } });
  await log(userId, 'grade_component.created', item.id, context);
  return clean({ ...item, grade: null });
}
export async function updateComponent(userId: string, id: string, input: Partial<ComponentInput>, context?: Context) {
  const current = await componentForUser(userId, id);
  if (input.maxScore !== undefined && current.grade?.score !== null && current.grade && input.maxScore < Number(current.grade.score)) throw serviceError('maxScore cannot be lower than the current score', 400);
  const item = await prisma.gradeComponent.update({ where: { id }, data: input, include: { grade: true } });
  await log(userId, 'grade_component.updated', id, context);
  return clean(item);
}
export async function deleteComponent(userId: string, id: string, context?: Context) {
  await componentForUser(userId, id);
  await prisma.gradeComponent.delete({ where: { id } });
  await log(userId, 'grade_component.deleted', id, context);
  return { id };
}
export async function setGrade(userId: string, id: string, input: { score: number | null; gradedAt?: Date | null }, context?: Context) {
  const component = await componentForUser(userId, id);
  if (input.score !== null && input.score > Number(component.maxScore)) throw serviceError(`Score cannot exceed maxScore (${Number(component.maxScore)})`, 400);
  const item = await prisma.grade.upsert({
    where: { gradeComponentId: id },
    create: { gradeComponentId: id, score: input.score, gradedAt: input.score === null ? null : input.gradedAt ?? new Date() },
    update: { score: input.score, gradedAt: input.score === null ? null : input.gradedAt ?? new Date() },
    include: { gradeComponent: true },
  });
  await log(userId, 'grade.updated', id, context);
  return { ...item, score: number(item.score), gradeComponent: clean({ ...item.gradeComponent, grade: null }) };
}

function calculate(components: ComponentWithGrade[], targetGrade: number | null) {
  const totalWeight = components.reduce((sum, item) => sum + Number(item.weightPercent), 0);
  const scored = components.filter((item) => item.grade?.score !== null && item.grade?.score !== undefined);
  const scoredWeight = scored.reduce((sum, item) => sum + Number(item.weightPercent), 0);
  const scoredSum = scored.reduce((sum, item) => sum + Number(item.grade!.score) * Number(item.weightPercent), 0);
  const remainingWeight = totalWeight - scoredWeight;
  const currentAverage = scoredWeight > 0 ? scoredSum / scoredWeight : null;
  const requiredFinalScore = targetGrade !== null && remainingWeight > 0 ? (targetGrade * totalWeight - scoredSum) / remainingWeight : null;
  const rounded = (value: number | null) => value === null ? null : Math.round(value * 100) / 100;
  const possible = targetGrade === null ? null : remainingWeight > 0 ? (requiredFinalScore as number) >= 0 && (requiredFinalScore as number) <= Math.max(...components.map((item) => Number(item.maxScore)), 0) : (currentAverage !== null && currentAverage >= targetGrade);
  const warnings: string[] = [];
  if (requiredFinalScore !== null && requiredFinalScore > Math.max(...components.map((item) => Number(item.maxScore)), 0)) warnings.push('requiredFinalScore exceeds maxScore');
  if (targetGrade !== null && remainingWeight <= 0 && currentAverage !== null && currentAverage < targetGrade) warnings.push('No remaining weight to reach target grade');
  return { currentAverage: rounded(currentAverage), targetGrade, requiredFinalScore: rounded(requiredFinalScore), isTargetPossible: possible, missingComponents: components.filter((item) => !item.grade || item.grade.score === null).map((item) => clean(item)), totalWeight: rounded(totalWeight), scoredWeight: rounded(scoredWeight), remainingWeight: rounded(remainingWeight), warnings };
}

export async function summary(userId: string, subjectId: string) {
  const item = await subject(userId, subjectId);
  const components = await componentsForSubject(userId, subjectId);
  return { subjectId, subjectName: item.name, ...calculate(components, number(item.targetGrade)) };
}
export async function semesterGpa(userId: string, semesterId: string) {
  const semester = await prisma.semester.findFirst({ where: { id: semesterId, userId, deletedAt: null }, include: { subjects: { where: { deletedAt: null }, include: { gradeComponents: { include: { grade: true } } } } } });
  if (!semester) throw serviceError('Semester not found', 404);
  const subjects = semester.subjects.map((item) => ({ subjectId: item.id, code: item.code, name: item.name, credits: item.credits, currentAverage: calculate(item.gradeComponents, null).currentAverage }));
  const scored = subjects.filter((item) => item.currentAverage !== null);
  const totalCredits = scored.reduce((sum, item) => sum + item.credits, 0);
  const gpa = totalCredits ? Math.round(scored.reduce((sum, item) => sum + (item.currentAverage as number) * item.credits, 0) / totalCredits * 100) / 100 : null;
  return { semesterId, semesterName: semester.name, gpa, totalCredits, subjects };
}
