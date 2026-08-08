import { prisma } from '../../lib/prisma.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { serviceError } from '../../utils/service-error.js';
import type { ReportFilters } from './reports.schemas.js';

function startOfDay(date = new Date()) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
function range(kind: 'weekly' | 'monthly') { const end = addDays(startOfDay(), 1); return { start: kind === 'weekly' ? addDays(end, -7) : addDays(end, -30), end }; }
async function subjectOwned(userId: string, id: string) { const subject = await prisma.subject.findFirst({ where: { id, userId, deletedAt: null, semester: { deletedAt: null } } }); if (!subject) throw serviceError('Subject not found', 404); return subject; }
async function semesterOwned(userId: string, id: string) { const semester = await prisma.semester.findFirst({ where: { id, userId, deletedAt: null } }); if (!semester) throw serviceError('Semester not found', 404); return semester; }
async function report(userId: string, start: Date, end: Date, filters: ReportFilters = {}) {
  if (filters.subjectId) await subjectOwned(userId, filters.subjectId);
  if (filters.semesterId) await semesterOwned(userId, filters.semesterId);
  const where = { userId, ...(filters.subjectId ? { subjectId: filters.subjectId } : {}), ...(filters.semesterId && !filters.subjectId ? { subject: { semesterId: filters.semesterId } } : {}) };
  const subjectWhere = { userId, deletedAt: null, ...(filters.subjectId ? { id: filters.subjectId } : {}), ...(filters.semesterId ? { semesterId: filters.semesterId } : {}) };
  const [tasks, sessions, subjects, overdue] = await Promise.all([
    prisma.task.findMany({ where: { ...where, deletedAt: null, completedAt: { gte: start, lt: end } }, select: { id: true, title: true, completedAt: true, subjectId: true } }),
    prisma.studySession.findMany({ where: { ...where, startedAt: { gte: start, lt: end } }, select: { id: true, startedAt: true, totalMinutes: true, subjectId: true } }),
    prisma.subject.findMany({ where: subjectWhere, select: { id: true, code: true, name: true, credits: true } }),
    prisma.task.count({ where: { ...where, deletedAt: null, status: { not: 'done' }, dueDate: { lt: new Date() } } }),
  ]);
  const totalMinutes = sessions.reduce((sum, item) => sum + item.totalMinutes, 0);
  return { start, end, semesterId: filters.semesterId ?? null, subjectId: filters.subjectId ?? null, taskDone: tasks.length, overdueTasks: overdue, totalStudyMinutes: totalMinutes, totalStudyHours: Math.round(totalMinutes / 60 * 100) / 100, sessions, subjects, tasks };
}
export async function overview(userId: string) { const today = startOfDay(); const tomorrow = addDays(today, 1); const week = addDays(today, -7); const [taskTotal, taskDone, overdue, study, activeSubjects, goals] = await Promise.all([prisma.task.count({ where: { userId, deletedAt: null } }), prisma.task.count({ where: { userId, deletedAt: null, status: 'done' } }), prisma.task.count({ where: { userId, deletedAt: null, status: { not: 'done' }, dueDate: { lt: new Date() } } }), prisma.studySession.aggregate({ where: { userId, startedAt: { gte: week, lt: tomorrow } }, _sum: { totalMinutes: true } }), prisma.subject.count({ where: { userId, deletedAt: null, status: 'in_progress' } }), prisma.goal.count({ where: { userId, status: 'in_progress' } })]); return { taskTotal, taskDone, overdueTasks: overdue, studyMinutesThisWeek: study._sum.totalMinutes ?? 0, activeSubjects, activeGoals: goals }; }
export async function weekly(userId: string, filters: ReportFilters = {}) { const r = range('weekly'); return report(userId, r.start, r.end, filters); }
export async function monthly(userId: string, filters: ReportFilters = {}) { const r = range('monthly'); return report(userId, r.start, r.end, filters); }
export async function semester(userId: string, semesterId: string) { const item = await semesterOwned(userId, semesterId); return { semester: item, ...(await report(userId, item.startDate, addDays(item.endDate, 1), { semesterId })) }; }
export async function bySubject(userId: string, subjectId: string) { const subject = await subjectOwned(userId, subjectId); const end = addDays(startOfDay(), 1); return { subject, ...(await report(userId, startOfDay(new Date(subject.createdAt)), end, { subjectId })) }; }
export async function exportReport(userId: string, format: 'pdf' | 'excel', type: 'weekly' | 'monthly' = 'weekly', filters: ReportFilters = {}) { const data = type === 'monthly' ? await monthly(userId, filters) : await weekly(userId, filters); if (format === 'excel') { const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Report'); sheet.addRows([['StudyFlow Report', type], ['Start', data.start.toISOString()], ['End', data.end.toISOString()], ['Tasks done', data.taskDone], ['Overdue tasks', data.overdueTasks], ['Study minutes', data.totalStudyMinutes]]); return { buffer: Buffer.from(await workbook.xlsx.writeBuffer()), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName: `studyflow-${type}.xlsx` }; } const chunks: Buffer[] = []; const document = new PDFDocument(); document.on('data', (chunk: Buffer) => chunks.push(chunk)); const finished = new Promise<void>((resolve) => document.on('end', resolve)); document.fontSize(20).text(`StudyFlow ${type} report`); document.moveDown().fontSize(12).text(`Tasks done: ${data.taskDone}`).text(`Overdue tasks: ${data.overdueTasks}`).text(`Study minutes: ${data.totalStudyMinutes}`); document.end(); await finished; return { buffer: Buffer.concat(chunks), contentType: 'application/pdf', fileName: `studyflow-${type}.pdf` }; }
