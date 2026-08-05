import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm');
const fields = z.object({
  subjectId: z.string().uuid().nullable().optional(),
  type: z.enum(['class', 'self_study', 'exam', 'presentation', 'group_work', 'personal']),
  title: z.string().trim().min(1).max(200),
  dayOfWeek: z.coerce.number().int().min(0).max(6).nullable().optional(),
  startTime: time,
  endTime: time,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  recurrenceRule: z.enum(['none', 'daily', 'weekly']).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  reminderBefore: z.coerce.number().int().min(0).max(10080).nullable().optional(),
});
export const scheduleCreateSchema = fields.refine((value) => !value.endDate || value.endDate >= value.startDate, { message: 'endDate must be on or after startDate', path: ['endDate'] });
export const scheduleUpdateSchema = fields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one schedule field is required' });
export const scheduleListSchema = z.object({ subjectId: z.string().uuid().optional(), type: z.enum(['class', 'self_study', 'exam', 'presentation', 'group_work', 'personal']).optional() });
