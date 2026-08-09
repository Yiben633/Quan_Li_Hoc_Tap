import 'dotenv/config';
import { z } from 'zod';

const optionalUrl = z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional());

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
  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: optionalUrl,
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false'),
  AI_PROVIDER: z.string().default('mock'),
  VERCEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const accessSecret = parsed.data.JWT_SECRET ?? parsed.data.JWT_ACCESS_SECRET;
const refreshSecret = parsed.data.REFRESH_TOKEN_SECRET ?? parsed.data.JWT_REFRESH_SECRET;
if (!accessSecret || !refreshSecret) throw new Error('JWT secrets are required');
if (parsed.data.STORAGE_PROVIDER === 's3-compatible') {
  const requiredStorageVariables = [
    parsed.data.S3_BUCKET,
    parsed.data.S3_ACCESS_KEY_ID,
    parsed.data.S3_SECRET_ACCESS_KEY,
    parsed.data.S3_PUBLIC_BASE_URL,
  ];
  if (requiredStorageVariables.some((value) => !value)) {
    throw new Error('S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_PUBLIC_BASE_URL are required for s3-compatible storage');
  }
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.VERCEL === '1' && parsed.data.STORAGE_PROVIDER === 'local') {
  throw new Error('Local file storage is not supported on Vercel. Configure STORAGE_PROVIDER=s3-compatible');
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.CRON_SECRET.length < 16) {
  throw new Error('CRON_SECRET must contain at least 16 characters in production');
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.VERCEL === '1' && !parsed.data.REDIS_URL.startsWith('rediss://')) {
  throw new Error('Vercel production requires a TLS Redis URL beginning with rediss://');
}
const frontendUrl = parsed.data.FRONTEND_URL ?? parsed.data.CLIENT_ORIGIN;
export const env = { ...parsed.data, JWT_ACCESS_SECRET: accessSecret, JWT_REFRESH_SECRET: refreshSecret, CLIENT_ORIGIN: frontendUrl, FRONTEND_URL: frontendUrl };
