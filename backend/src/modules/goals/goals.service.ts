import { GoalStatus, GoalType, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type GoalInput = { subjectId?: string | null; name: string; type: GoalType; targetValue: number; currentValue?: number; deadline?: Date | null; status?: GoalStatus };
async function owned(userId: string, id: string) { const goal = await prisma.goal.findFirst({ where: { id, userId } }); if (!goal) throw serviceError('Goal not found', 404); return goal; }
async function subject(userId: string, subjectId?: string | null) { if (!subjectId) return; const item = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } }); if (!item) throw serviceError('Subject not found', 404); }
async function log(userId: string, action: string, entityId: string, context?: Context) { await prisma.activityLog.create({ data: { userId, action, entityType: 'goal', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } }); }

async function scoreForSubject(userId: string, subjectId: string) {
  const components = await prisma.gradeComponent.findMany({ where: { subjectId, subject: { userId, deletedAt: null } }, include: { grade: true } });
  const scored = components.filter((item) => item.grade?.score !== null && item.grade?.score !== undefined);
  const weight = scored.reduce((sum, item) => sum + Number(item.weightPercent), 0);
  if (!weight) return 0;
  return scored.reduce((sum, item) => sum + Number(item.grade!.score) * Number(item.weightPercent), 0) / weight;
}

async function calculate(userId: string, goal: { type: GoalType; targetValue: Prisma.Decimal; currentValue: Prisma.Decimal; subjectId: string | null }) {
  let current = Number(goal.currentValue);
  if (goal.type === 'score') current = goal.subjectId ? await scoreForSubject(userId, goal.subjectId) : current;
  if (goal.type === 'study_time') { const aggregate = await prisma.studySession.aggregate({ where: { userId, ...(goal.subjectId ? { subjectId: goal.subjectId } : {}) }, _sum: { totalMinutes: true } }); current = aggregate._sum.totalMinutes ?? 0; }
  if (goal.type === 'task_count') current = await prisma.task.count({ where: { userId, status: 'done', deletedAt: null, ...(goal.subjectId ? { subjectId: goal.subjectId } : {}) } });
  if (goal.type === 'course_completion') { const total = await prisma.subject.count({ where: { userId, deletedAt: null, ...(goal.subjectId ? { id: goal.subjectId } : {}) } }); const done = await prisma.subject.count({ where: { userId, deletedAt: null, status: 'completed', ...(goal.subjectId ? { id: goal.subjectId } : {}) } }); current = total ? (done / total) * 100 : 0; }
  if (goal.type === 'gpa') { const subjects = await prisma.subject.findMany({ where: { userId, deletedAt: null, ...(goal.subjectId ? { id: goal.subjectId } : {}) }, select: { id: true, credits: true } }); const values = await Promise.all(subjects.map(async (item) => ({ credits: item.credits, score: await scoreForSubject(userId, item.id) }))); const credits = values.reduce((sum, item) => sum + item.credits, 0); current = credits ? values.reduce((sum, item) => sum + item.score * item.credits, 0) / credits : 0; }
  const target = Number(goal.targetValue);
  return { currentValue: Math.round(current * 100) / 100, progressPercent: Math.min(100, Math.max(0, Math.round((current / target) * 10000) / 100)), targetValue: target };
}

export async function progress(userId: string, goal: { id: string; type: GoalType; targetValue: Prisma.Decimal; currentValue: Prisma.Decimal; subjectId: string | null }) { return calculate(userId, goal); }
export async function list(userId: string, status?: GoalStatus) { const goals = await prisma.goal.findMany({ where: { userId, ...(status ? { status } : {}) }, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }] }); return Promise.all(goals.map(async (goal) => ({ ...goal, ...await calculate(userId, goal) }))); }
export async function create(userId: string, input: GoalInput, context?: Context) { await subject(userId, input.subjectId); const goal = await prisma.goal.create({ data: { ...input, userId } }); await log(userId, 'goal.created', goal.id, context); return { ...goal, ...(await calculate(userId, goal)) }; }
export async function detail(userId: string, id: string) { const goal = await owned(userId, id); return { ...goal, ...(await calculate(userId, goal)) }; }
export async function update(userId: string, id: string, input: Partial<GoalInput>, context?: Context) { await owned(userId, id); await subject(userId, input.subjectId); const goal = await prisma.goal.update({ where: { id }, data: input }); await log(userId, 'goal.updated', id, context); return detail(userId, goal.id); }
export async function remove(userId: string, id: string, context?: Context) { await owned(userId, id); const goal = await prisma.goal.update({ where: { id }, data: { status: 'archived' } }); await log(userId, 'goal.archived', id, context); return goal; }

export async function runDailyNotifications() {
  const goals = await prisma.goal.findMany({ where: { status: 'in_progress' } });
  let created = 0;
  const now = new Date();
  const horizon = new Date(now); horizon.setDate(horizon.getDate() + 7);
  for (const goal of goals) {
    const calculated = await calculate(goal.userId, goal);
    let type: NotificationType | null = null;
    let title = '';
    let message = '';
    if (calculated.progressPercent >= 100) { type = 'goal_achieved'; title = 'Goal achieved'; message = `Goal "${goal.name}" has been achieved.`; }
    else if (goal.deadline && goal.deadline <= horizon && calculated.progressPercent <= 50) { type = 'goal_at_risk'; title = 'Goal at risk'; message = `Goal "${goal.name}" is approaching its deadline.`; }
    if (!type) continue;
    const already = await prisma.notification.findFirst({ where: { userId: goal.userId, type, relatedEntityId: goal.id, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } });
    if (!already) { await prisma.notification.create({ data: { userId: goal.userId, type, title, message, relatedEntityType: 'goal', relatedEntityId: goal.id } }); created += 1; }
    if (type === 'goal_achieved') await prisma.goal.update({ where: { id: goal.id }, data: { status: 'achieved' } });
  }
  return { processed: goals.length, created };
}
