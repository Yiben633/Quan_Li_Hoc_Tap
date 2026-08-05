import { Priority, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { serviceError } from '../../utils/service-error.js';

const statuses: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];

async function verifySubject(userId: string, subjectId?: string) {
  if (!subjectId) return;
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } });
  if (!subject) throw serviceError('Subject not found', 404);
}

export async function board(userId: string, query: { subjectId?: string; priority?: Priority }) {
  await verifySubject(userId, query.subjectId);
  const tasks = await prisma.task.findMany({ where: { userId, deletedAt: null, ...(query.subjectId ? { subjectId: query.subjectId } : {}), ...(query.priority ? { priority: query.priority } : {}) }, orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
  const columns = Object.fromEntries(statuses.map((status) => [status, tasks.filter((task) => task.status === status)])) as Record<TaskStatus, typeof tasks>;
  return { columns, tasks, total: tasks.length };
}

export async function move(userId: string, input: { taskId: string; toStatus: TaskStatus; newIndex: number }) {
  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { id: input.taskId, userId, deletedAt: null } });
    if (!task) throw serviceError('Task not found', 404);
    const scope = { userId, deletedAt: null, ...(task.subjectId ? { subjectId: task.subjectId } : { subjectId: null }), ...(task.priority ? {} : {}) };
    const sourceTasks = await tx.task.findMany({ where: { ...scope, status: task.status }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const targetTasks = input.toStatus === task.status
      ? sourceTasks
      : await tx.task.findMany({ where: { ...scope, status: input.toStatus }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const sourceIds = sourceTasks.filter((item) => item.id !== task.id).map((item) => item.id);
    const targetIds = targetTasks.filter((item) => item.id !== task.id).map((item) => item.id);
    const targetIndex = Math.min(input.newIndex, targetIds.length);
    targetIds.splice(targetIndex, 0, task.id);
    for (const [index, id] of sourceIds.entries()) await tx.task.update({ where: { id }, data: { sortOrder: index } });
    for (const [index, id] of targetIds.entries()) await tx.task.update({ where: { id }, data: { sortOrder: index, status: input.toStatus, ...(id === task.id ? { completedAt: input.toStatus === 'done' ? new Date() : null } : {}) } });
    return tx.task.findUnique({ where: { id: task.id } });
  });
  if (!result) throw serviceError('Task not found', 404);
  return board(userId, { subjectId: result.subjectId ?? undefined });
}
