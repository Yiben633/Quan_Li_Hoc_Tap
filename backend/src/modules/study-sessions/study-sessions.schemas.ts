import { z } from 'zod';

export const startSchema = z.object({
  subjectId: z.string().uuid().nullable().optional(),
  note: z.string().max(5000).nullable().optional(),
});

export const pomodoroStartSchema = z.object({
  sessionType: z.enum(['focus', 'short_break', 'long_break']).default('focus'),
  plannedMinutes: z.coerce.number().int().positive().max(240),
});

export const statisticsQuerySchema = z.object({
  range: z.enum(['day', 'week', 'month']).default('week'),
  subjectId: z.string().uuid().optional(),
});
