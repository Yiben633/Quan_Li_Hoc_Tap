import { prisma } from '../../lib/prisma.js';

type CalendarQuery = { view: 'day' | 'week' | 'month'; date: Date };
type CalendarItem = { type: string; title: string; startAt: Date; endAt: Date; colorHex: string | null; sourceEntity: { type: string; id: string; subjectId?: string | null } };

function dayStart(date: Date) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
function range(query: CalendarQuery) {
  const date = dayStart(query.date);
  if (query.view === 'day') return { start: date, end: addDays(date, 1) };
  if (query.view === 'month') return { start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)), end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)) };
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const start = addDays(date, -mondayOffset);
  return { start, end: addDays(start, 7) };
}
function dateTime(date: Date, time: string) { const [hours, minutes] = time.split(':').map(Number); const value = new Date(date); value.setUTCHours(hours, minutes, 0, 0); return value; }
function scheduleOccurrences(schedule: { id: string; type: string; title: string; dayOfWeek: number | null; startTime: string; endTime: string; startDate: Date; endDate: Date | null; recurrenceRule: string; colorHex: string | null; subjectId: string | null }, start: Date, end: Date): CalendarItem[] {
  const first = dayStart(schedule.startDate) > start ? dayStart(schedule.startDate) : start;
  const last = schedule.endDate && dayStart(schedule.endDate) < end ? dayStart(schedule.endDate) : addDays(end, -1);
  const items: CalendarItem[] = [];
  for (let cursor = first; cursor < end && cursor <= last; cursor = addDays(cursor, 1)) {
    const isFirstDate = cursor.getTime() === dayStart(schedule.startDate).getTime();
    const dayOfWeek = schedule.dayOfWeek ?? dayStart(schedule.startDate).getUTCDay();
    if ((schedule.recurrenceRule === 'none' && !isFirstDate) || (schedule.recurrenceRule === 'weekly' && cursor.getUTCDay() !== dayOfWeek)) continue;
    const startAt = dateTime(cursor, schedule.startTime);
    let endAt = dateTime(cursor, schedule.endTime);
    if (endAt <= startAt) endAt = addDays(endAt, 1);
    items.push({ type: 'schedule', title: schedule.title, startAt, endAt, colorHex: schedule.colorHex, sourceEntity: { type: 'schedule', id: schedule.id, subjectId: schedule.subjectId } });
  }
  return items;
}

export async function getCalendar(userId: string, query: CalendarQuery) {
  const { start, end } = range(query);
  const [schedules, events, tasks, exams] = await Promise.all([
    prisma.schedule.findMany({ where: { userId, deletedAt: null, startDate: { lte: end }, OR: [{ endDate: null }, { endDate: { gte: start } }] } }),
    prisma.event.findMany({ where: { userId, deletedAt: null, startAt: { lt: end }, OR: [{ endAt: null }, { endAt: { gte: start } }] } }),
    prisma.task.findMany({ where: { userId, deletedAt: null, dueDate: { gte: start, lt: end } } }),
    prisma.gradeComponent.findMany({ where: { examDate: { gte: start, lt: end }, subject: { userId, deletedAt: null, semester: { deletedAt: null } } }, include: { subject: true } }),
  ]);
  const items: CalendarItem[] = schedules.flatMap((schedule) => scheduleOccurrences(schedule, start, end));
  items.push(...events.map((event) => ({ type: 'event', title: event.title, startAt: event.startAt, endAt: event.endAt ?? event.startAt, colorHex: event.colorHex, sourceEntity: { type: 'event', id: event.id } })));
  items.push(...tasks.map((task) => ({ type: 'task_due', title: task.title, startAt: task.dueDate!, endAt: task.dueDate!, colorHex: null, sourceEntity: { type: 'task', id: task.id, subjectId: task.subjectId } })));
  items.push(...exams.map((exam) => ({ type: 'exam', title: `${exam.subject.name}: ${exam.name}`, startAt: exam.examDate!, endAt: exam.examDate!, colorHex: exam.subject.colorHex, sourceEntity: { type: 'grade_component', id: exam.id, subjectId: exam.subjectId } })));
  items.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return { view: query.view, start, end, items, total: items.length };
}
