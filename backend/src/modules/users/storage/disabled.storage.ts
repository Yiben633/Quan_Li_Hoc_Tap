import { serviceError } from '../../../utils/service-error.js';
import type { StorageProvider } from './storage.provider.js';

function storageUnavailable(): never {
  throw serviceError('Cloud file storage is not configured', 503);
}

export class DisabledStorageProvider implements StorageProvider {
  readonly kind = 'disabled' as const;

  async save(): Promise<never> {
    return storageUnavailable();
  }

  async delete(): Promise<never> {
    return storageUnavailable();
  }

  keyFromUrl(): never {
    return storageUnavailable();
  }
}
