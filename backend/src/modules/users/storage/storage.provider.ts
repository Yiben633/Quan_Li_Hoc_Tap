export type StorageProviderKind = 'local' | 's3-compatible' | 'disabled';

export interface StorageProvider {
  readonly kind: StorageProviderKind;
  save(input: { buffer: Buffer; extension: string; contentType: string; folder?: string }): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
  keyFromUrl(url: string): string;
}
