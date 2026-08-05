import multer from 'multer';
import { env } from '../../config/env.js';

const allowedMimeTypes = new Set([
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'text/plain', 'text/markdown', 'application/json',
]);

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.DOCUMENT_MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) { callback(new Error('This file type is not allowed')); return; }
    callback(null, true);
  },
});

export function extensionForDocument(fileName: string, mimeType: string) {
  const extension = fileName.includes('.') ? `.${fileName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  if (extension && extension.length <= 10) return extension;
  const extensions: Record<string, string> = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'application/json': '.json' };
  return extensions[mimeType] ?? '.bin';
}

export function fileTypeForMime(mimeType: string) {
  if (mimeType === 'application/pdf') return 'pdf' as const;
  if (mimeType.includes('word')) return 'word' as const;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel' as const;
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ppt' as const;
  if (mimeType.startsWith('image/')) return 'image' as const;
  if (mimeType.startsWith('video/')) return 'video' as const;
  if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'application/json') return 'code' as const;
  return 'other' as const;
}
