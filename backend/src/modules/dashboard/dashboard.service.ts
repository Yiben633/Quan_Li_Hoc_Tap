import { prisma } from '../../lib/prisma.js';
import { list as listGoals } from '../goals/goals.service.js';

function startOfDay(date = new Date()) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
function monday(date = new Date()) { const day = date.getUTCDay(); return addDays(startOfDay(date), -(day === 0 ? 6 : day - 1)); }

export async function summary(userId: string) {
  const today = startOfDay(); const tomorrow = addDays(today, 1); const weekStart = monday(); const weekEnd = addDays(weekStart, 7); const upcomingEnd = addDays(today, 7);
  const [tasksToday, taskDone, taskOverdue, studyTime, activeSubjects, upcomingSchedules, activeGoals] = await Promise.all([
    prisma.task.findMany({ where: { userId, deletedAt: null, dueDate: { gte: today, lt: tomorrow } }, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }] }),
    prisma.task.count({ where: { userId, status: 'done', deletedAt: null, completedAt: { gte: today, lt: tomorrow } } }),
    prisma.task.count({ where: { userId, status: { not: 'done' }, deletedAt: null, dueDate: { lt: new Date() } } }),
    prisma.studySession.aggregate({ where: { userId, startedAt: { gte: weekStart, lt: weekEnd } }, _sum: { totalMinutes: true } }),
    prisma.subject.findMany({ where: { userId, status: 'in_progress', deletedAt: null, semester: { deletedAt: null } }, orderBy: { name: 'asc' } }),
    prisma.schedule.findMany({ where: { userId, deletedAt: null, startDate: { lte: upcomingEnd }, OR: [{ endDate: null }, { endDate: { gte: today } }] }, orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }], take: 10 }),
    listGoals(userId, 'in_progress'),
  ]);
  return { tasksToday, taskDone, taskOverdue, studyMinutesThisWeek: studyTime._sum.totalMinutes ?? 0, studyHoursThisWeek: Math.round(((studyTime._sum.totalMinutes ?? 0) / 60) * 100) / 100, activeSubjects, upcomingSchedules, activeGoals };
}

export async function progressChart(userId: string, chartRange: 'week' | 'month') {
  const start = chartRange === 'week' ? monday() : addDays(startOfDay(), -29); const end = addDays(start, chartRange === 'week' ? 7 : 30);
  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({ where: { userId, status: 'done', deletedAt: null, completedAt: { gte: start, lt: end } }, select: { completedAt: true } }),
    prisma.studySession.findMany({ where: { userId, startedAt: { gte: start, lt: end } }, select: { startedAt: true, totalMinutes: true } }),
  ]);
  const points = new Map<string, { date: string; taskDone: number; studyMinutes: number }>();
  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) { const key = cursor.toISOString().slice(0, 10); points.set(key, { date: key, taskDone: 0, studyMinutes: 0 }); }
  for (const task of tasks) { if (task.completedAt) { const point = points.get(task.completedAt.toISOString().slice(0, 10)); if (point) point.taskDone += 1; } }
  for (const session of sessions) { const point = points.get(session.startedAt.toISOString().slice(0, 10)); if (point) point.studyMinutes += session.totalMinutes; }
  return { range: chartRange, start, end, points: [...points.values()] };
}
