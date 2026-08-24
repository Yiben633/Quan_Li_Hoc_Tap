import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import type { StudyCoachContext, StudyCoachContextOptions } from './coach.types.js';

export type WeeklyCoachAnalytics = {
  range: { startAt: string; endAt: string };
  timezone: string;
  studyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  subjectBreakdown: Array<{
    subjectId: string | null;
    name: string;
    minutes: number;
    percent: number;
  }>;
};

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

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
  const parts = zonedParts(date, timezone);
  const localDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = localDay.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addLocalDays(date, -daysSinceMonday, timezone);
}

function resolvedSubjectId(context: StudyCoachContext, options: StudyCoachContextOptions) {
  if (options.subjectId) return options.subjectId;
  if (options.studyPlanId) return context.plans.find((plan) => plan.id === options.studyPlanId)?.subjectId ?? undefined;
  if (options.taskId) return context.tasks.find((task) => task.id === options.taskId)?.subjectId ?? undefined;
  return undefined;
}

export async function buildWeeklyCoachAnalytics(
  userId: string,
  context: StudyCoachContext,
  options: StudyCoachContextOptions = {},
): Promise<WeeklyCoachAnalytics> {
  const now = new Date(context.now);
  const weekStart = startOfWeek(now, context.timezone);
  const weekEnd = addLocalDays(weekStart, 7, context.timezone);
  const subjectId = resolvedSubjectId(context, options);
  const taskScope: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    ...(subjectId ? { subjectId } : {}),
    ...(options.studyPlanId ? { studyPlanId: options.studyPlanId } : {}),
    ...(options.taskId ? { id: options.taskId } : {}),
  };
  const sessionScope: Prisma.StudySessionWhereInput = {
    userId,
    ...(subjectId ? { subjectId } : {}),
    startedAt: { gte: weekStart, lt: weekEnd },
  };

  const [completedTasks, totalTasks, overdueTasks, studyMinutes, sessionsBySubject] = await Promise.all([
    prisma.task.count({ where: { ...taskScope, status: 'done', completedAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.task.count({
      where: {
        ...taskScope,
        OR: [
          { completedAt: { gte: weekStart, lt: weekEnd } },
          { dueDate: { gte: weekStart, lt: weekEnd } },
        ],
      },
    }),
    prisma.task.count({ where: { ...taskScope, status: { not: 'done' }, dueDate: { lt: now } } }),
    prisma.studySession.aggregate({ where: sessionScope, _sum: { totalMinutes: true } }),
    prisma.studySession.groupBy({ by: ['subjectId'], where: sessionScope, _sum: { totalMinutes: true } }),
  ]);

  const totalMinutes = studyMinutes._sum.totalMinutes ?? 0;
  const subjectIds = sessionsBySubject
    .map((item) => item.subjectId)
    .filter((id): id is string => id !== null);
  const subjects = subjectIds.length
    ? await prisma.subject.findMany({ where: { userId, deletedAt: null, id: { in: subjectIds } }, select: { id: true, name: true } })
    : [];
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const subjectBreakdown = sessionsBySubject
    .map((item) => {
      const minutes = item._sum.totalMinutes ?? 0;
      return {
        subjectId: item.subjectId,
        name: item.subjectId ? (subjectNames.get(item.subjectId) ?? 'Môn học đã xóa') : 'Chưa gắn môn học',
        minutes,
        percent: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      };
    })
    .filter((item) => item.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes)
    .slice(0, 5);

  return {
    range: { startAt: weekStart.toISOString(), endAt: weekEnd.toISOString() },
    timezone: context.timezone,
    studyMinutes: totalMinutes,
    completedTasks,
    totalTasks: Math.max(totalTasks, completedTasks),
    overdueTasks,
    subjectBreakdown,
  };
}

export function weeklyAnalyticsFallback(analytics: WeeklyCoachAnalytics) {
  const hours = Math.floor(analytics.studyMinutes / 60);
  const minutes = analytics.studyMinutes % 60;
  const studyTime = hours > 0 ? `${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}` : `${minutes} phút`;
  const taskSummary = analytics.totalTasks > 0
    ? `Bạn đã hoàn thành ${analytics.completedTasks}/${analytics.totalTasks} công việc trong tuần.`
    : 'Tuần này chưa có công việc nào trong phạm vi thống kê.';
  const overdueSummary = analytics.overdueTasks > 0
    ? `Hiện có ${analytics.overdueTasks} công việc quá hạn cần xử lý.`
    : 'Hiện không có công việc quá hạn.';
  const topSubject = analytics.subjectBreakdown[0];
  const focusSummary = topSubject ? `${topSubject.name} chiếm ${topSubject.percent}% thời gian tập trung.` : 'Chưa có phiên tập trung được ghi nhận trong tuần.';

  return `Tuần này bạn đã tập trung ${studyTime}. ${taskSummary} ${overdueSummary} ${focusSummary}`;
}
