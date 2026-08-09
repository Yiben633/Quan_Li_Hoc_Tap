import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { StorageProvider } from './storage.provider.js';

type S3StorageOptions = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  forcePathStyle: boolean;
};

export class S3CompatibleStorageProvider implements StorageProvider {
  readonly kind = 's3-compatible' as const;
  private readonly client: S3Client;
  private readonly publicBaseUrl: string;

  constructor(private readonly options: S3StorageOptions) {
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/$/, '');
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async save(input: { buffer: Buffer; extension: string; contentType: string; folder?: string }) {
    const folder = input.folder ?? 'avatars';
    const key = `${folder}/${randomUUID()}${input.extension}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.options.bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
    }));
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return { key, url: `${this.publicBaseUrl}/${encodedKey}` };
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }));
  }

  keyFromUrl(url: string) {
    const prefix = `${this.publicBaseUrl}/`;
    if (!url.startsWith(prefix)) throw new Error('Stored file URL does not belong to the configured object storage');
    return decodeURIComponent(url.slice(prefix.length));
  }
}
