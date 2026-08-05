import { z } from 'zod';

const fields = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).nullable().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable().optional(),
  isAllDay: z.boolean().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  reminderBefore: z.coerce.number().int().min(0).max(10080).nullable().optional(),
});
export const eventCreateSchema = fields.refine((value) => !value.endAt || value.endAt >= value.startAt, { message: 'endAt must be on or after startAt', path: ['endAt'] });
export const eventUpdateSchema = fields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one event field is required' });
