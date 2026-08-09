import { z } from 'zod';
export const groupSchema = z.object({ name: z.string().trim().min(1).max(160), description: z.string().max(5000).nullable().optional() });
export const memberSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()) });
export const groupTaskSchema = z.object({ assignedUserId: z.string().uuid().nullable().optional(), title: z.string().trim().min(1).max(240), description: z.string().max(5000).nullable().optional(), dueDate: z.coerce.date().nullable().optional(), status: z.enum(['todo', 'in_progress', 'waiting', 'done']).optional() });
export const groupTaskUpdateSchema = groupTaskSchema.partial().refine((v) => Object.keys(v).length > 0, { message: 'At least one group task field is required' });
