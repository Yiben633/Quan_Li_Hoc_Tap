import { z } from 'zod';

const dateField = z.coerce.date();

const semesterFields = z.object({
  name: z.string().trim().min(1).max(120),
  academicYear: z.string().trim().min(4).max(30),
  startDate: dateField,
  endDate: dateField,
  status: z.enum(['planning', 'active', 'closed', 'archived']).optional(),
  targetGpa: z.coerce.number().min(0).max(10).nullable().optional(),
  expectedCredits: z.coerce.number().int().min(0).max(500).nullable().optional(),
  note: z.string().max(5000).nullable().optional(),
});

export const semesterCreateSchema = semesterFields.refine((value) => value.endDate >= value.startDate, { message: 'endDate must be on or after startDate', path: ['endDate'] });

export const semesterUpdateSchema = semesterFields.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one semester field is required' });

export const semesterListSchema = z.object({
  status: z.enum(['planning', 'active', 'closed', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'startDate', 'endDate', 'createdAt']).default('startDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
