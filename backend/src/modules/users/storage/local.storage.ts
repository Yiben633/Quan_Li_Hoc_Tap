import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from './storage.provider.js';

const uploadRoot = join(process.cwd(), 'uploads');

export class LocalStorageProvider implements StorageProvider {
  readonly kind = 'local' as const;

  async save(input: { buffer: Buffer; extension: string; contentType: string; folder?: string }) {
    const folder = 'folder' in input && input.folder ? input.folder : 'avatars';
    const uploadDirectory = join(uploadRoot, folder);
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}${input.extension}`;
    const key = `${folder}/${filename}`;
    await writeFile(join(uploadDirectory, filename), input.buffer);
    return { key, url: `/uploads/${key}` };
  }

  async delete(key: string) {
    try { await unlink(join(uploadRoot, key)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }

  keyFromUrl(url: string) {
    return url.replace(/^\/uploads\//, '');
  }
}
