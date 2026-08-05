import { z } from 'zod';
export const setSchema = z.object({ subjectId: z.string().uuid().nullable().optional(), name: z.string().trim().min(1).max(160), description: z.string().max(5000).nullable().optional() });
export const setUpdateSchema = setSchema.partial().refine((v) => Object.keys(v).length > 0, { message: 'At least one set field is required' });
export const cardSchema = z.object({ question: z.string().trim().min(1).max(10000), answer: z.string().trim().min(1).max(10000), isDifficult: z.boolean().optional() });
export const cardUpdateSchema = cardSchema.partial().refine((v) => Object.keys(v).length > 0, { message: 'At least one card field is required' });
export const reviewSchema = z.object({ correct: z.boolean() });
