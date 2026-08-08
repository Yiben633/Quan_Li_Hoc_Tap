import { z } from 'zod';

export const reportFilterSchema = z.object({
  semesterId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
});

export const exportReportSchema = reportFilterSchema.extend({
  format: z.enum(['pdf', 'excel']),
  type: z.enum(['weekly', 'monthly']).default('weekly'),
});

export type ReportFilters = z.infer<typeof reportFilterSchema>;
export type ExportReportQuery = z.infer<typeof exportReportSchema>;
