import { z } from 'zod';

const tagList = z.array(z.string().trim().min(1).max(50)).max(30);
const tags = z.preprocess((value) => typeof value === 'string' ? value.split(',').map((tag) => tag.trim()).filter(Boolean) : value, tagList);
export const uploadSchema = z.object({ title: z.string().trim().max(200).optional(), subjectId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), tags: tags.default([]) });
export const updateSchema = z.object({ title: z.string().trim().min(1).max(200).optional(), subjectId: z.string().uuid().nullable().optional(), taskId: z.string().uuid().nullable().optional(), tags: tags.optional() }).refine((value) => Object.keys(value).length > 0, { message: 'At least one document field is required' });
export const listSchema = z.object({ subjectId: z.string().uuid().optional(), taskId: z.string().uuid().optional(), tag: z.string().trim().max(50).optional(), search: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
