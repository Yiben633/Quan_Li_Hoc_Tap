import { DocumentFileType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { storageProvider } from '../users/storage/index.js';
import { serviceError } from '../../utils/service-error.js';
import { extensionForDocument, fileTypeForMime } from './documents.upload.js';

type Context = { ipAddress?: string; userAgent?: string };
type Links = { subjectId?: string | null; taskId?: string | null };
async function subject(userId: string, id?: string | null) { if (!id) return; const item = await prisma.subject.findFirst({ where: { id, userId, deletedAt: null, semester: { deletedAt: null } } }); if (!item) throw serviceError('Subject not found', 404); }
async function task(userId: string, id?: string | null) { if (!id) return; const item = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } }); if (!item) throw serviceError('Task not found', 404); }
async function links(userId: string, input: Links) { await subject(userId, input.subjectId); await task(userId, input.taskId); }
async function owned(userId: string, id: string) { const item = await prisma.document.findFirst({ where: { id, userId, deletedAt: null } }); if (!item) throw serviceError('Document not found', 404); return item; }
async function log(userId: string, action: string, entityId: string, context?: Context) { await prisma.activityLog.create({ data: { userId, action, entityType: 'document', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } }); }
export async function upload(userId: string, file: Express.Multer.File, input: { title?: string; subjectId?: string | null; taskId?: string | null; tags: string[] }, context?: Context) {
  await links(userId, input); let stored: { url: string; key: string } | null = null;
  try {
    stored = await storageProvider.save({ buffer: file.buffer, contentType: file.mimetype, extension: extensionForDocument(file.originalname, file.mimetype), folder: 'documents' });
    const documentStorageProvider = storageProvider.kind === 'local' ? 'local' : 's3';
    const item = await prisma.document.create({ data: { userId, subjectId: input.subjectId ?? null, taskId: input.taskId ?? null, title: input.title || file.originalname, fileUrl: stored.url, fileType: fileTypeForMime(file.mimetype), storageProvider: documentStorageProvider, sizeBytes: file.size, tags: input.tags } });
    await log(userId, 'document.created', item.id, context);
    return item;
  } catch (error) {
    if (stored) await storageProvider.delete(stored.key).catch(() => undefined);
    throw error;
  }
}
export async function list(userId: string, query: { semesterId?: string; subjectId?: string; taskId?: string; tag?: string; fileType?: DocumentFileType; search?: string; page: number; limit: number }) {
  const where: Prisma.DocumentWhereInput = { userId, deletedAt: null, ...(query.semesterId ? { subject: { semesterId: query.semesterId } } : {}), ...(query.subjectId ? { subjectId: query.subjectId } : {}), ...(query.taskId ? { taskId: query.taskId } : {}), ...(query.tag ? { tags: { has: query.tag } } : {}), ...(query.fileType ? { fileType: query.fileType } : {}), ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}) };
  const [items, total] = await Promise.all([prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.document.count({ where })]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}
export async function detail(userId: string, id: string) { return owned(userId, id); }
export async function update(userId: string, id: string, input: { title?: string; subjectId?: string | null; taskId?: string | null; tags?: string[] }, context?: Context) { await owned(userId, id); await links(userId, input); const item = await prisma.document.update({ where: { id }, data: input }); await log(userId, 'document.updated', id, context); return item; }
export async function remove(userId: string, id: string, context?: Context) { const item = await owned(userId, id); await storageProvider.delete(storageProvider.keyFromUrl(item.fileUrl)); await prisma.document.delete({ where: { id } }); await log(userId, 'document.deleted', id, context); return { id }; }
export async function download(userId: string, id: string) { const item = await owned(userId, id); return { url: item.fileUrl, fileName: item.title }; }
