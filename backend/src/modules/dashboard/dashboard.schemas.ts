import { z } from 'zod';
export const chartQuerySchema = z.object({ range: z.enum(['week', 'month']).default('week') });
