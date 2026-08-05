import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from './storage.provider.js';

const uploadDirectory = join(process.cwd(), 'uploads', 'avatars');

export class LocalStorageProvider implements StorageProvider {
  async save(input: { buffer: Buffer; extension: string; contentType: string }) {
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}${input.extension}`;
    const key = `avatars/${filename}`;
    await writeFile(join(uploadDirectory, filename), input.buffer);
    return { key, url: `/uploads/${key}` };
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();
