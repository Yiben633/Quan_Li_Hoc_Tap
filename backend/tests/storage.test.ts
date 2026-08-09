import { LocalStorageProvider } from '../src/modules/users/storage/local.storage.js';
import { S3CompatibleStorageProvider } from '../src/modules/users/storage/s3.storage.js';

describe('storage providers', () => {
  it('extracts local storage keys from public URLs', () => {
    expect(new LocalStorageProvider().keyFromUrl('/uploads/documents/example.pdf')).toBe('documents/example.pdf');
  });

  it('extracts decoded S3-compatible keys only from the configured public URL', () => {
    const provider = new S3CompatibleStorageProvider({
      endpoint: 'https://storage.example.com',
      region: 'auto',
      bucket: 'studyflow',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      publicBaseUrl: 'https://cdn.example.com/',
      forcePathStyle: true,
    });

    expect(provider.keyFromUrl('https://cdn.example.com/documents/my%20file.pdf')).toBe('documents/my file.pdf');
    expect(() => provider.keyFromUrl('https://other.example.com/documents/file.pdf')).toThrow(
      'Stored file URL does not belong to the configured object storage',
    );
  });
});
