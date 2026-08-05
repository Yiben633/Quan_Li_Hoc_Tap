import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Avatar must be a JPG, PNG, or WEBP image'));
      return;
    }
    callback(null, true);
  },
});

export function extensionForMimeType(mimeType: string) {
  return mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
}
