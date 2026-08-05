import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_SECRET: z.string().min(16).optional(),
  REFRESH_TOKEN_SECRET: z.string().min(16).optional(),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  TRUST_PROXY: z.string().default('false'),
  CRON_SECRET: z.string().default(''),
  DOCUMENT_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  STORAGE_PROVIDER: z.enum(['local', 's3-compatible']).default('local'),
  AI_PROVIDER: z.string().default('mock'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const accessSecret = parsed.data.JWT_SECRET ?? parsed.data.JWT_ACCESS_SECRET;
const refreshSecret = parsed.data.REFRESH_TOKEN_SECRET ?? parsed.data.JWT_REFRESH_SECRET;
if (!accessSecret || !refreshSecret) throw new Error('JWT secrets are required');
const frontendUrl = parsed.data.FRONTEND_URL ?? parsed.data.CLIENT_ORIGIN;
export const env = { ...parsed.data, JWT_ACCESS_SECRET: accessSecret, JWT_REFRESH_SECRET: refreshSecret, CLIENT_ORIGIN: frontendUrl, FRONTEND_URL: frontendUrl };
