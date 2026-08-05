import { z } from 'zod';

export const kanbanQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const kanbanMoveSchema = z.object({
  taskId: z.string().uuid(),
  toStatus: z.enum(['todo', 'in_progress', 'waiting', 'done']),
  newIndex: z.coerce.number().int().min(0).max(10000),
});
