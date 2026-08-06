import { prisma } from '../../lib/prisma.js';
import { list as listGoals } from '../goals/goals.service.js';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
function vietnamParts(date = new Date()) { const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS); return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() }; }
function dateKey(date: Date) { const parts = vietnamParts(date); return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`; }
function startOfDay(date = new Date()) { const parts = vietnamParts(date); return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - VIETNAM_OFFSET_MS); }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
function monday(date = new Date()) { const parts = vietnamParts(date); const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(); return addDays(startOfDay(date), -(day === 0 ? 6 : day - 1)); }

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
  const start = chartRange === 'week' ? monday() : addDays(startOfDay(), -14); const end = addDays(start, chartRange === 'week' ? 7 : 30);
  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({ where: { userId, status: 'done', deletedAt: null, completedAt: { gte: start, lt: end } }, select: { completedAt: true } }),
    prisma.studySession.findMany({ where: { userId, startedAt: { gte: start, lt: end } }, select: { startedAt: true, totalMinutes: true } }),
  ]);
  const points = new Map<string, { date: string; taskDone: number; studyMinutes: number }>();
  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) { const key = dateKey(cursor); points.set(key, { date: key, taskDone: 0, studyMinutes: 0 }); }
  for (const task of tasks) { if (task.completedAt) { const point = points.get(dateKey(task.completedAt)); if (point) point.taskDone += 1; } }
  for (const session of sessions) { const point = points.get(dateKey(session.startedAt)); if (point) point.studyMinutes += session.totalMinutes; }
  return { range: chartRange, start, end, points: [...points.values()] };
}
