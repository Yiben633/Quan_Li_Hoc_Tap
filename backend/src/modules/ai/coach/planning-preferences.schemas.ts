import { z } from 'zod';

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format');

const timezoneSchema = z.string().trim().min(1).max(80).superRefine((value, context) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
  } catch {
    context.addIssue({ code: 'custom', message: 'Timezone must be a valid IANA timezone' });
  }
});

const preferredDaysSchema = z.array(z.coerce.number().int().min(0).max(6))
  .min(1)
  .max(7)
  .refine((days) => new Set(days).size === days.length, 'Preferred days must not contain duplicates');

export const updateStudyPlanningPreferenceSchema = z.object({
  timezone: timezoneSchema.optional(),
  preferredStudyStart: timeOfDaySchema.nullable().optional(),
  preferredStudyEnd: timeOfDaySchema.nullable().optional(),
  maxStudyMinutesPerDay: z.coerce.number().int().min(15).max(720).optional(),
  defaultSessionMinutes: z.coerce.number().int().min(15).max(180).optional(),
  minBreakMinutes: z.coerce.number().int().min(0).max(120).optional(),
  allowWeekend: z.boolean().optional(),
  preferredDays: preferredDaysSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one study planning preference is required',
});

export type UpdateStudyPlanningPreferenceInput = z.infer<typeof updateStudyPlanningPreferenceSchema>;
