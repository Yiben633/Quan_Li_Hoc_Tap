import { Prisma, Priority, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type TaskInput = { studyPlanId?: string | null; subjectId?: string | null; title: string; description?: string | null; startDate?: Date | null; dueDate?: Date | null; estimatedMinutes?: number | null; difficulty?: number | null; priority?: Priority; status?: TaskStatus; sortOrder?: number };

function output(task: { [key: string]: unknown }) { return task; }
const taskListInclude = {
  subject: { select: { id: true, code: true, name: true, colorHex: true } },
  studyPlan: { select: { id: true, title: true } },
  _count: { select: { subTasks: true } },
  subTasks: { where: { isDone: true }, select: { id: true } },
  attachments: { select: { id: true } },
  documents: { where: { deletedAt: null }, select: { id: true } },
} satisfies Prisma.TaskInclude;
type TaskListItem = Prisma.TaskGetPayload<{ include: typeof taskListInclude }>;

function listOutput(task: TaskListItem) {
  const { _count, subTasks, attachments, documents, ...item } = task;
  return { ...item, attachmentCount: attachments.length + documents.length, subTaskProgress: { total: _count.subTasks, done: subTasks.length } };
}
function dayRange(date: Date) { const start = new Date(date); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); return { gte: start, lt: end }; }
function dueRange(from?: Date, to?: Date) {
  if (!from && !to) return undefined;
  return { ...(from ? { gte: dayRange(from).gte } : {}), ...(to ? { lt: dayRange(to).lt } : {}) };
}

async function owned(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
  if (!task) throw serviceError('Task not found', 404);
  return task;
}

async function verifyRelations(userId: string, input: { studyPlanId?: string | null; subjectId?: string | null }) {
  if (input.studyPlanId) {
    const plan = await prisma.studyPlan.findFirst({ where: { id: input.studyPlanId, userId, deletedAt: null } });
    if (!plan) throw serviceError('Study plan not found', 404);
  }
  if (input.subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, userId, deletedAt: null, semester: { deletedAt: null } } });
    if (!subject) throw serviceError('Subject not found', 404);
  }
}

async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'task', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } });
}

async function syncProgress(userId: string, studyPlanId: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const [total, done] = await Promise.all([
    client.task.count({ where: { userId, studyPlanId, deletedAt: null } }),
    client.task.count({ where: { userId, studyPlanId, status: 'done', deletedAt: null } }),
  ]);
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  await client.studyPlan.updateMany({ where: { id: studyPlanId, userId, deletedAt: null }, data: { progressPercent } });
  return progressPercent;
}

export async function list(userId: string, query: { studyPlanId?: string; subjectId?: string; status?: TaskStatus; priority?: Priority; difficulty?: number; dueDate?: Date; dueFrom?: Date; dueTo?: Date; search?: string; page: number; limit: number; sort: 'title' | 'dueDate' | 'priority' | 'sortOrder' | 'createdAt'; order: 'asc' | 'desc' }) {
  const dueDateFilter = query.dueDate ? dayRange(query.dueDate) : dueRange(query.dueFrom, query.dueTo);
  const where = { userId, deletedAt: null, ...(query.studyPlanId ? { studyPlanId: query.studyPlanId } : {}), ...(query.subjectId ? { subjectId: query.subjectId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.priority ? { priority: query.priority } : {}), ...(query.difficulty ? { difficulty: query.difficulty } : {}), ...(dueDateFilter ? { dueDate: dueDateFilter } : {}), ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' as const } }, { description: { contains: query.search, mode: 'insensitive' as const } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskListInclude, orderBy: { [query.sort]: query.order }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.task.count({ where }),
  ]);
  return { items: items.map(listOutput), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export async function today(userId: string) {
  const items = await prisma.task.findMany({ where: { userId, deletedAt: null, dueDate: dayRange(new Date()) }, include: taskListInclude, orderBy: [{ sortOrder: 'asc' }, { dueDate: 'asc' }] });
  return items.map(listOutput);
}

export async function overdue(userId: string) {
  const items = await prisma.task.findMany({ where: { userId, deletedAt: null, status: { not: 'done' }, dueDate: { lt: new Date() } }, include: taskListInclude, orderBy: { dueDate: 'asc' } });
  return items.map(listOutput);
}

export async function create(userId: string, input: TaskInput, context?: Context) {
  await verifyRelations(userId, input);
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) { const last = await prisma.task.findFirst({ where: { userId, studyPlanId: input.studyPlanId ?? null, deletedAt: null }, orderBy: { sortOrder: 'desc' } }); sortOrder = (last?.sortOrder ?? -1) + 1; }
  const task = await prisma.task.create({ data: { ...input, sortOrder, completedAt: input.status === 'done' ? new Date() : undefined, userId } });
  if (task.studyPlanId) await syncProgress(userId, task.studyPlanId);
  await log(userId, 'task.created', task.id, context);
  return output(task);
}

export async function detail(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId, deletedAt: null }, include: { subject: { select: { id: true, code: true, name: true, colorHex: true } }, studyPlan: { select: { id: true, title: true } }, subTasks: { orderBy: { sortOrder: 'asc' } }, attachments: true, documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } } });
  if (!task) throw serviceError('Task not found', 404);
  return { ...task, attachments: [...task.attachments, ...task.documents.map((document) => ({ id: document.id, taskId: document.taskId, fileName: document.title, fileUrl: document.fileUrl, fileType: document.fileType }))] };
}

export async function update(userId: string, id: string, input: Partial<TaskInput>, context?: Context) {
  const current = await owned(userId, id);
  await verifyRelations(userId, input);
  const task = await prisma.task.update({ where: { id }, data: { ...input, ...(input.status === 'done' ? { completedAt: new Date() } : input.status ? { completedAt: null } : {}) } });
  if (current.studyPlanId) await syncProgress(userId, current.studyPlanId);
  if (task.studyPlanId && task.studyPlanId !== current.studyPlanId) await syncProgress(userId, task.studyPlanId);
  await log(userId, 'task.updated', id, context);
  return output(task);
}

export async function setStatus(userId: string, id: string, status: TaskStatus, context?: Context) { return update(userId, id, { status }, context); }
export async function complete(userId: string, id: string, context?: Context) { return update(userId, id, { status: 'done' }, context); }

export async function remove(userId: string, id: string, context?: Context) {
  const task = await owned(userId, id);
  const removed = await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  if (task.studyPlanId) await syncProgress(userId, task.studyPlanId);
  await log(userId, 'task.deleted', id, context);
  return removed;
}

export async function duplicate(userId: string, id: string, context?: Context) {
  const original = await owned(userId, id);
  const duplicated = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({ data: { userId, studyPlanId: original.studyPlanId, subjectId: original.subjectId, title: `${original.title} (Copy)`, description: original.description, startDate: original.startDate, dueDate: original.dueDate, estimatedMinutes: original.estimatedMinutes, difficulty: original.difficulty, priority: original.priority, status: 'todo', sortOrder: original.sortOrder + 1 } });
    const subtasks = await tx.subTask.findMany({ where: { taskId: original.id }, orderBy: { sortOrder: 'asc' } });
    if (subtasks.length) await tx.subTask.createMany({ data: subtasks.map((subtask) => ({ taskId: task.id, title: subtask.title, isDone: false, sortOrder: subtask.sortOrder })) });
    if (task.studyPlanId) await syncProgress(userId, task.studyPlanId, tx);
    return task;
  });
  await log(userId, 'task.duplicated', duplicated.id, context);
  return duplicated;
}

export async function reorder(userId: string, items: { id: string; sortOrder: number }[]) {
  const result = await prisma.$transaction(async (tx) => {
    const ids = items.map((item) => item.id);
    const tasks = await tx.task.findMany({ where: { id: { in: ids }, userId, deletedAt: null } });
    if (tasks.length !== ids.length) throw serviceError('One or more tasks were not found', 404);
    for (const item of items) await tx.task.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
    return tx.task.findMany({ where: { id: { in: ids }, userId, deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  });
  return result;
}

export async function subtasks(userId: string, taskId: string) { await owned(userId, taskId); return prisma.subTask.findMany({ where: { taskId }, orderBy: { sortOrder: 'asc' } }); }

export async function createSubtask(userId: string, taskId: string, input: { title: string; sortOrder?: number }) {
  await owned(userId, taskId);
  const sortOrder = input.sortOrder ?? ((await prisma.subTask.findFirst({ where: { taskId }, orderBy: { sortOrder: 'desc' } }))?.sortOrder ?? -1) + 1;
  return prisma.subTask.create({ data: { taskId, title: input.title, sortOrder } });
}

export async function updateSubtask(userId: string, taskId: string, subtaskId: string, input: { title?: string; sortOrder?: number; isDone?: boolean }) {
  await owned(userId, taskId);
  const subtask = await prisma.subTask.findFirst({ where: { id: subtaskId, taskId } });
  if (!subtask) throw serviceError('Subtask not found', 404);
  return prisma.subTask.update({ where: { id: subtaskId }, data: input });
}

export async function removeSubtask(userId: string, taskId: string, subtaskId: string) {
  await owned(userId, taskId);
  const subtask = await prisma.subTask.findFirst({ where: { id: subtaskId, taskId } });
  if (!subtask) throw serviceError('Subtask not found', 404);
  await prisma.subTask.delete({ where: { id: subtaskId } });
}
