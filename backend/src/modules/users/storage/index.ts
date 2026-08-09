import { env } from '../../../config/env.js';
import { LocalStorageProvider } from './local.storage.js';
import { S3CompatibleStorageProvider } from './s3.storage.js';
import type { StorageProvider } from './storage.provider.js';

function createStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER === 'local') return new LocalStorageProvider();

  return new S3CompatibleStorageProvider({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET!,
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL!,
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
  });
}

export const storageProvider = createStorageProvider();
