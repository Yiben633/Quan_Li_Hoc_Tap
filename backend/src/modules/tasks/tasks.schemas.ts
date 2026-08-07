import { z } from 'zod';

const taskFields = {
  studyPlanId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(10000).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedMinutes: z.coerce.number().int().min(0).max(100000).nullable().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
};

export const taskCreateSchema = z.object(taskFields);
export const taskUpdateSchema = z.object(taskFields).partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one task field is required' });
export const taskStatusSchema = z.object({ status: z.enum(['todo', 'in_progress', 'waiting', 'done']) });
export const taskListSchema = z.object({
  studyPlanId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  dueDate: z.coerce.date().optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['title', 'dueDate', 'priority', 'sortOrder', 'createdAt']).default('sortOrder'),
  order: z.enum(['asc', 'desc']).default('asc'),
}).refine(({ dueFrom, dueTo }) => !dueFrom || !dueTo || dueFrom <= dueTo, { message: 'dueFrom must be before or equal to dueTo', path: ['dueTo'] });
const reorderItemsSchema = z.array(z.object({ id: z.string().uuid(), sortOrder: z.coerce.number().int().min(0) })).min(1).max(500);
export const reorderSchema = z.union([reorderItemsSchema, z.object({ items: reorderItemsSchema })]);
export const subTaskCreateSchema = z.object({ title: z.string().trim().min(1).max(240), sortOrder: z.coerce.number().int().min(0).optional() });
export const subTaskUpdateSchema = subTaskCreateSchema.partial().extend({ isDone: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, { message: 'At least one subtask field is required' });
