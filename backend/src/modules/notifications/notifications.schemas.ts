import { z } from 'zod';

export const listSchema = z.object({
  isRead: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const settingsSchema = z.object({
  reminderMinutesBefore: z.coerce.number().int().min(0).max(10080).optional(),
  emailEnabled: z.coerce.boolean().optional(),
  pushEnabled: z.coerce.boolean().optional(),
  inAppEnabled: z.coerce.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one notification setting is required' });
