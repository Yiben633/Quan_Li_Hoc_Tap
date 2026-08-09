import { z } from 'zod';
export const usersQuery = z.object({ search: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const userUpdate = z.object({ deletedAt: z.coerce.date().nullable().optional(), isEmailVerified: z.boolean().optional() }).refine((v) => Object.keys(v).length > 0, { message: 'At least one user field is required' });
export const feedbackQuery = usersQuery.extend({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional() });
export const activityLogsQuery = usersQuery;
export const feedbackUpdate = z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']), adminReply: z.string().max(10000).nullable().optional() });
