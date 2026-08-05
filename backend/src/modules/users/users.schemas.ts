import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  school: z.string().trim().max(160).nullable().optional(),
  major: z.string().trim().max(160).nullable().optional(),
  courseYear: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  language: z.string().trim().min(2).max(10).optional(),
  themeMode: z.enum(['light', 'dark']).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one profile field is required' });

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});
