export type StorageProviderKind = 'local' | 's3-compatible';

export interface StorageProvider {
  save(input: { buffer: Buffer; extension: string; contentType: string; folder?: string }): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}
