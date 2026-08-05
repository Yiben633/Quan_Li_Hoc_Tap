export interface StorageProvider {
  save(input: { buffer: Buffer; extension: string; contentType: string }): Promise<{ url: string; key: string }>;
}
