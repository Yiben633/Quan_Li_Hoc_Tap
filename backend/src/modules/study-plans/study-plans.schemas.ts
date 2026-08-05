import { z } from 'zod';

const fields = z.object({
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  targetGoal: z.string().max(500).nullable().optional(),
  estimatedHours: z.coerce.number().min(0).max(100000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'overdue']).optional(),
});

export const studyPlanCreateSchema = fields.refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: 'endDate must be on or after startDate', path: ['endDate'] });
export const studyPlanUpdateSchema = fields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one study plan field is required' }).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: 'endDate must be on or after startDate', path: ['endDate'] });

export const studyPlanListSchema = z.object({
  subjectId: z.string().uuid().optional(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['title', 'startDate', 'endDate', 'priority', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
