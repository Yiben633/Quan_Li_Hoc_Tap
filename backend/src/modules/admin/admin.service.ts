import ExcelJS from 'exceljs';
import { FeedbackStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type PageQuery = { search?: string; page: number; limit: number };
type FeedbackQuery = PageQuery & { status?: FeedbackStatus };
type StatisticsQuery = { range: '7d' | '30d' | '90d' };

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfVietnamDay(date = new Date()) {
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - VIETNAM_OFFSET_MS);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function vietnamDateKey(date: Date) {
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type AnalyticsPoint = { date: string; users: number; sessions: number; taskCompletions: number; plans: number };

function createAnalyticsPoints(start: Date, end: Date) {
  const points = new Map<string, AnalyticsPoint>();
  for (let cursor = new Date(start); cursor < end; cursor = addDays(cursor, 1)) {
    const date = vietnamDateKey(cursor);
    points.set(date, { date, users: 0, sessions: 0, taskCompletions: 0, plans: 0 });
  }
  return points;
}

const adminUserSelect = {
  id: true,
  fullName: true,
  email: true,
  isEmailVerified: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { name: true } } } },
} satisfies Prisma.UserSelect;

function withAccountStatus<T extends { deletedAt: Date | null }>(user: T) {
  return { ...user, status: user.deletedAt ? 'disabled' as const : 'active' as const };
}

async function audit(adminId: string, action: string, entityType: string, entityId?: string, metadata?: Prisma.InputJsonValue) {
  await prisma.activityLog.create({ data: { userId: adminId, action, entityType, entityId, metadata } });
}

export async function users(query: PageQuery) {
  const where: Prisma.UserWhereInput = query.search ? { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { fullName: { contains: query.search, mode: 'insensitive' } }] } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: adminUserSelect, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);
  return { items: items.map(withAccountStatus), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function updateUser(adminId: string, id: string, input: { deletedAt?: Date | null; isEmailVerified?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw serviceError('User not found', 404);
  if (adminId === id && input.deletedAt !== undefined && input.deletedAt !== null) {
    throw serviceError('You cannot deactivate your own administrator account', 409);
  }
  const changes: Record<string, string | boolean> = {};
  if (input.isEmailVerified !== undefined) changes.isEmailVerified = input.isEmailVerified;
  if (input.deletedAt !== undefined) changes.status = input.deletedAt === null ? 'active' : 'disabled';
  const [updated] = await prisma.$transaction([
    prisma.user.update({ where: { id }, data: input, select: adminUserSelect }),
    prisma.activityLog.create({ data: { userId: adminId, action: 'admin.user_updated', entityType: 'user', entityId: id, metadata: { changes } } }),
  ]);
  return withAccountStatus(updated);
}

export async function feedback(query: FeedbackQuery) {
  const where: Prisma.FeedbackWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { OR: [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } },
      { user: { is: { OR: [{ fullName: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }] } } },
    ] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({ where, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.feedback.count({ where }),
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function replyFeedback(adminId: string, id: string, input: { status: FeedbackStatus; adminReply?: string | null }) {
  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) throw serviceError('Feedback not found', 404);
  const item = await prisma.feedback.update({ where: { id }, data: { ...input, resolvedAt: input.status === 'resolved' ? new Date() : null } });
  await audit(adminId, 'admin.feedback_updated', 'feedback', id, { status: item.status, replied: Boolean(item.adminReply) });
  return item;
}

export async function logs(query: PageQuery) {
  const where: Prisma.ActivityLogWhereInput = query.search ? { OR: [
    { action: { contains: query.search, mode: 'insensitive' } },
    { entityType: { contains: query.search, mode: 'insensitive' } },
    { user: { is: { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { fullName: { contains: query.search, mode: 'insensitive' } }] } } },
  ] } : {};
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({ where, include: { user: { select: { id: true, email: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.activityLog.count({ where }),
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function statistics(query: StatisticsQuery) {
  const days = Number.parseInt(query.range, 10);
  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - days);
  const today = startOfVietnamDay();
  const tomorrow = addDays(today, 1);
  const dueSoonEnd = addDays(today, 8);
  const analyticsStart = addDays(today, -(days - 1));
  const analyticsEnd = tomorrow;
  const overduePlansWhere: Prisma.StudyPlanWhereInput = {
    deletedAt: null,
    status: { not: 'completed' },
    OR: [{ status: 'overdue' }, { endDate: { lt: today } }],
  };

  const [totalUsers, activeUsers, newUsers, disabledUsers, studyGroups, openFeedback, tasks, openTasks, completedTasks, studyPlans, activeStudyPlans, studySessions, studyTime, sessionsToday, tasksCompletedToday, activity, overduePlans, attentionPlans, analyticsUsers, analyticsSessions, analyticsTaskCompletions, analyticsPlans] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.studyGroup.count(),
    prisma.feedback.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    prisma.task.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { deletedAt: null, status: { not: 'done' } } }),
    prisma.task.count({ where: { deletedAt: null, status: 'done' } }),
    prisma.studyPlan.count({ where: { deletedAt: null } }),
    prisma.studyPlan.count({ where: { deletedAt: null, status: 'in_progress' } }),
    prisma.studySession.count(),
    prisma.studySession.aggregate({ _sum: { totalMinutes: true } }),
    prisma.studySession.count({ where: { startedAt: { gte: today, lt: tomorrow } } }),
    prisma.task.count({ where: { deletedAt: null, status: 'done', completedAt: { gte: today, lt: tomorrow } } }),
    prisma.activityLog.findMany({
      where: { action: { startsWith: 'admin.' } },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.studyPlan.count({ where: overduePlansWhere }),
    prisma.studyPlan.findMany({
      where: {
        deletedAt: null,
        status: { not: 'completed' },
        OR: [
          { status: 'overdue' },
          { endDate: { lt: today } },
          { endDate: { gte: today, lt: dueSoonEnd } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        progressPercent: true,
        endDate: true,
        user: { select: { fullName: true, email: true } },
        subject: { select: { code: true, name: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 8,
    }),
    prisma.user.findMany({ where: { createdAt: { gte: analyticsStart, lt: analyticsEnd } }, select: { createdAt: true } }),
    prisma.studySession.findMany({ where: { startedAt: { gte: analyticsStart, lt: analyticsEnd } }, select: { startedAt: true } }),
    prisma.task.findMany({ where: { deletedAt: null, status: 'done', completedAt: { gte: analyticsStart, lt: analyticsEnd } }, select: { completedAt: true } }),
    prisma.studyPlan.findMany({ where: { deletedAt: null, createdAt: { gte: analyticsStart, lt: analyticsEnd } }, select: { createdAt: true } }),
  ]);
  const analyticsByDate = createAnalyticsPoints(analyticsStart, analyticsEnd);
  for (const item of analyticsUsers) {
    const point = analyticsByDate.get(vietnamDateKey(item.createdAt));
    if (point) point.users += 1;
  }
  for (const item of analyticsSessions) {
    const point = analyticsByDate.get(vietnamDateKey(item.startedAt));
    if (point) point.sessions += 1;
  }
  for (const item of analyticsTaskCompletions) {
    const point = item.completedAt ? analyticsByDate.get(vietnamDateKey(item.completedAt)) : undefined;
    if (point) point.taskCompletions += 1;
  }
  for (const item of analyticsPlans) {
    const point = analyticsByDate.get(vietnamDateKey(item.createdAt));
    if (point) point.plans += 1;
  }
  return {
    range: { key: query.range, days, from: rangeStart, to: rangeEnd },
    totalUsers,
    activeUsers,
    newUsers,
    disabledUsers,
    studyGroups,
    openFeedback,
    tasks,
    openTasks,
    completedTasks,
    studyPlans,
    activeStudyPlans,
    studySessions,
    activityToday: sessionsToday + tasksCompletedToday,
    totalStudyMinutes: studyTime._sum.totalMinutes ?? 0,
    analytics: Array.from(analyticsByDate.values()),
    attention: { overduePlans },
    plansRequiringAttention: attentionPlans.map((plan) => ({
      ...plan,
      attention: plan.status === 'overdue' || (plan.endDate !== null && plan.endDate < today) ? 'overdue' as const : 'due_soon' as const,
    })),
    recentAdminActivity: activity.map(({ user, ...item }) => ({ ...item, actor: user })),
  };
}

export async function importTemplates(adminId: string, buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as never);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw serviceError('Excel workbook has no worksheet', 422);
  const templates: Array<{ code: string; name: string; credits: number }> = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const code = String(row.getCell(1).value ?? '').trim();
    const name = String(row.getCell(2).value ?? '').trim();
    const credits = Number(row.getCell(3).value ?? 0);
    if (code && name && Number.isFinite(credits)) templates.push({ code, name, credits });
  });
  await audit(adminId, 'admin.topic_templates_imported', 'topic_template', undefined, { imported: templates.length });
  return { imported: templates.length, templates };
}
