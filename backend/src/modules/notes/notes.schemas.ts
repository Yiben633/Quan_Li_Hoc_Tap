import { z } from 'zod';

const fields = { subjectId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), title: z.string().trim().min(1).max(200), contentRichText: z.string().max(100000), tags: z.array(z.string().trim().min(1).max(50)).max(30).optional() };
export const createSchema = z.object(fields);
export const updateSchema = z.object(fields).partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one note field is required' });
export const pinSchema = z.object({ isPinned: z.boolean().optional() });
export const listSchema = z.object({ subjectId: z.string().uuid().optional(), taskId: z.string().uuid().optional(), search: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
