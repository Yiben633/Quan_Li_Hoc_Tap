import { z } from 'zod';
const fields = z.object({
  subjectId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(['score', 'study_time', 'task_count', 'course_completion', 'gpa']),
  targetValue: z.coerce.number().positive().max(1000000000),
  currentValue: z.coerce.number().min(0).max(1000000000).optional(),
  deadline: z.coerce.date().nullable().optional(),
  status: z.enum(['in_progress', 'achieved', 'failed', 'archived']).optional(),
});
export const goalCreateSchema = fields;
export const goalUpdateSchema = fields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one goal field is required' });
export const goalListSchema = z.object({ status: z.enum(['in_progress', 'achieved', 'failed', 'archived']).optional() });
