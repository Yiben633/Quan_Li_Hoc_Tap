import { z } from 'zod';

const componentFields = z.object({
  name: z.string().trim().min(1).max(200),
  maxScore: z.coerce.number().positive().max(1000).optional(),
  weightPercent: z.coerce.number().positive().max(1000),
  examDate: z.coerce.date().nullable().optional(),
  note: z.string().max(5000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const componentCreateSchema = componentFields;
export const componentUpdateSchema = componentFields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one component field is required' });

export const gradeInputSchema = z.object({
  score: z.coerce.number().min(0).nullable(),
  gradedAt: z.coerce.date().nullable().optional(),
});
