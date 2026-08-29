import { z } from 'zod';

const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  studentCode: optionalText.pipe(z.string().max(50).optional()),
  password: z.string().min(8).max(128),
  school: optionalText.pipe(z.string().max(160).optional()),
  major: optionalText.pipe(z.string().max(160).optional()),
  courseYear: z.coerce.number().int().min(1900).max(2200).optional(),
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(20).optional() }).default({});

export const emailSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});

export const verifyOtpSchema = emailSchema.extend({ otp: z.string().regex(/^\d{6}$/, 'OTP must contain 6 digits') });

export const resetPasswordSchema = verifyOtpSchema.extend({
  newPassword: z.string().min(8).max(128),
});
