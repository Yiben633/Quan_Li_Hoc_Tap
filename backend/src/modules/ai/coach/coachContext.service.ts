import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';
import type { StudyCoachContext, StudyCoachContextOptions } from './coach.types.js';

const MAX_HORIZON_DAYS = 30;
const DEFAULT_HORIZON_DAYS = 14;
const MAX_SUBJECTS = 30;
const MAX_TASKS = 100;
const MAX_PLANS = 50;
const MAX_CALENDAR_ITEMS = 100;
const MAX_GOALS = 30;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function resolveTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}

function zonedParts(date: Date, timezone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function zonedDateTimeToUtc(parts: ZonedDateParts, timezone: string) {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let timestamp = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = zonedParts(new Date(timestamp), timezone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    timestamp += target - actualAsUtc;
  }

  return new Date(timestamp);
}

function startOfLocalDay(date: Date, timezone: string) {
  const parts = zonedParts(date, timezone);
  return zonedDateTimeToUtc({ ...parts, hour: 0, minute: 0, second: 0 }, timezone);
}

function addLocalDays(date: Date, days: number, timezone: string) {
  const parts = zonedParts(date, timezone);
  const local = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return zonedDateTimeToUtc({
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  }, timezone);
}

function startOfWeek(date: Date, timezone: string) {
  const localStart = startOfLocalDay(date, timezone);
  const localParts = zonedParts(localStart, timezone);
  const weekday = new Date(Date.UTC(localParts.year, localParts.month - 1, localParts.day)).getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addLocalDays(localStart, -daysSinceMonday, timezone);
}

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

function clampHorizon(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_HORIZON_DAYS;
  return Math.min(MAX_HORIZON_DAYS, Math.max(1, Math.floor(value ?? DEFAULT_HORIZON_DAYS)));
}

function taskRank(task: { dueDate: Date | null; priority: string; status: string }, now: Date) {
  if (task.dueDate && task.dueDate < now) return 0;
  if (task.dueDate && task.dueDate.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000) return 1;
  if (task.status === 'in_progress') return 2;
  if (task.priority === 'urgent') return 3;
  if (task.priority === 'high') return 4;
  return 5;
}

async function verifyScopeOwnership(userId: string, options: StudyCoachContextOptions) {
  const [subject, plan, task] = await Promise.all([
    options.subjectId
      ? prisma.subject.findFirst({ where: { id: options.subjectId, userId, deletedAt: null, semester: { deletedAt: null } }, select: { id: true } })
      : Promise.resolve(null),
    options.studyPlanId
      ? prisma.studyPlan.findFirst({ where: { id: options.studyPlanId, userId, deletedAt: null }, select: { id: true } })
      : Promise.resolve(null),
    options.taskId
      ? prisma.task.findFirst({ where: { id: options.taskId, userId, deletedAt: null }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (options.subjectId && !subject) throw serviceError('Subject not found', 404);
  if (options.studyPlanId && !plan) throw serviceError('Study plan not found', 404);
  if (options.taskId && !task) throw serviceError('Task not found', 404);
}

export async function buildStudyCoachContext(userId: string, options: StudyCoachContextOptions = {}): Promise<StudyCoachContext> {
  await verifyScopeOwnership(userId, options);

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { timezone: true } });
  if (!user) throw serviceError('User not found', 404);

  const timezone = resolveTimezone(user.timezone);
  const now = new Date();
  const horizonDays = clampHorizon(options.horizonDays);
  const horizonEnd = addLocalDays(now, horizonDays + 1, timezone);
  const today = startOfLocalDay(now, timezone);
  const weekStart = startOfWeek(now, timezone);
  const weekEnd = addLocalDays(weekStart, 7, timezone);

  const taskWhere: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    status: { not: 'done' },
    ...(options.subjectId ? { subjectId: options.subjectId } : {}),
    ...(options.studyPlanId ? { studyPlanId: options.studyPlanId } : {}),
    ...(options.taskId ? { id: options.taskId } : {}),
    OR: [{ dueDate: null }, { dueDate: { lt: horizonEnd } }],
  };
  const planWhere: Prisma.StudyPlanWhereInput = {
    userId,
    deletedAt: null,
    status: { not: 'completed' },
    ...(options.subjectId ? { subjectId: options.subjectId } : {}),
    ...(options.studyPlanId ? { id: options.studyPlanId } : {}),
  };

  const [subjects, tasks, plans, schedules, events, goals, studyMinutes, completedTasks] = await Promise.all([
    prisma.subject.findMany({
      where: { userId, deletedAt: null, status: 'in_progress', semester: { deletedAt: null }, ...(options.subjectId ? { id: options.subjectId } : {}) },
      select: { id: true, code: true, name: true, credits: true, status: true, targetGrade: true },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SUBJECTS,
    }),
    prisma.task.findMany({
      where: taskWhere,
      select: { id: true, title: true, subjectId: true, studyPlanId: true, dueDate: true, priority: true, status: true, estimatedMinutes: true, difficulty: true },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
      take: MAX_TASKS,
    }),
    prisma.studyPlan.findMany({
      where: planWhere,
      select: { id: true, title: true, subjectId: true, startDate: true, endDate: true, priority: true, status: true, progressPercent: true, estimatedHours: true },
      orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }],
      take: MAX_PLANS,
    }),
    prisma.schedule.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(options.subjectId ? { subjectId: options.subjectId } : {}),
        startDate: { lte: horizonEnd },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      select: { id: true, title: true, subjectId: true, startDate: true, endDate: true, recurrenceRule: true },
      orderBy: { startDate: 'asc' },
      take: MAX_CALENDAR_ITEMS,
    }),
    prisma.event.findMany({
      // Events are user-level records today and do not have subjectId. Keep them
      // in scoped context so the planner still avoids a user's occupied time.
      where: { userId, deletedAt: null, startAt: { gte: now, lt: horizonEnd } },
      select: { id: true, title: true, startAt: true, endAt: true },
      orderBy: { startAt: 'asc' },
      take: MAX_CALENDAR_ITEMS,
    }),
    prisma.goal.findMany({
      where: { userId, status: 'in_progress', ...(options.subjectId ? { subjectId: options.subjectId } : {}) },
      select: { id: true, name: true, type: true, subjectId: true, targetValue: true, currentValue: true, deadline: true },
      orderBy: [{ deadline: 'asc' }, { updatedAt: 'desc' }],
      take: MAX_GOALS,
    }),
    prisma.studySession.aggregate({ where: { userId, startedAt: { gte: weekStart, lt: weekEnd }, ...(options.subjectId ? { subjectId: options.subjectId } : {}) }, _sum: { totalMinutes: true } }),
    prisma.task.count({ where: { userId, deletedAt: null, status: 'done', completedAt: { gte: weekStart, lt: weekEnd }, ...(options.subjectId ? { subjectId: options.subjectId } : {}), ...(options.studyPlanId ? { studyPlanId: options.studyPlanId } : {}) } }),
  ]);

  const rankedTasks = [...tasks].sort((left, right) => {
    const rankDifference = taskRank(left, now) - taskRank(right, now);
    if (rankDifference !== 0) return rankDifference;
    return (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER);
  });

  return {
    now: now.toISOString(),
    timezone,
    subjects: subjects.map((subject) => ({ ...subject, targetGrade: subject.targetGrade === null ? null : Number(subject.targetGrade) })),
    tasks: rankedTasks.map((task) => ({ ...task, dueDate: iso(task.dueDate) })),
    plans: plans.map((plan) => ({ ...plan, startDate: iso(plan.startDate), endDate: iso(plan.endDate), estimatedHours: plan.estimatedHours === null ? null : Number(plan.estimatedHours) })),
    calendar: [
      ...events.map((event) => ({ id: event.id, type: 'event' as const, title: event.title, subjectId: null, startAt: event.startAt.toISOString(), endAt: iso(event.endAt) })),
      ...schedules.map((schedule) => ({ id: schedule.id, type: 'schedule' as const, title: schedule.title, subjectId: schedule.subjectId, startAt: schedule.startDate.toISOString(), endAt: iso(schedule.endDate), recurrenceRule: schedule.recurrenceRule })),
    ].sort((left, right) => left.startAt.localeCompare(right.startAt)),
    goals: goals.map((goal) => ({ ...goal, targetValue: Number(goal.targetValue), currentValue: Number(goal.currentValue), deadline: iso(goal.deadline) })),
    stats: {
      studyMinutesThisWeek: studyMinutes._sum.totalMinutes ?? 0,
      completedTasksThisWeek: completedTasks,
    },
  };
}
