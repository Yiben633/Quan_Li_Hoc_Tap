import { z } from 'zod';

export const subjectCreateSchema = z.object({
  semesterId: z.string().uuid(),
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  credits: z.coerce.number().int().min(0).max(100),
  lecturer: z.string().trim().max(160).nullable().optional(),
  room: z.string().trim().max(80).nullable().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'colorHex must be a 6-digit hex color'),
  targetGrade: z.coerce.number().min(0).max(10).nullable().optional(),
  status: z.enum(['in_progress', 'completed', 'dropped', 'archived']).optional(),
  note: z.string().max(5000).nullable().optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.omit({ semesterId: true }).partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one subject field is required' });

export const subjectListSchema = z.object({
  semesterId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(['in_progress', 'completed', 'dropped', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['code', 'name', 'credits', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
