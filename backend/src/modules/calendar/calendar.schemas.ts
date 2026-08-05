import { z } from 'zod';
export const calendarQuerySchema = z.object({ view: z.enum(['day', 'week', 'month']).default('week'), date: z.coerce.date().default(() => new Date()) });
