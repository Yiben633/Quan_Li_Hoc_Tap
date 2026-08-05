import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { toSafeUser } from '../auth/auth.service.js';
import { storageProvider } from './storage/local.storage.js';
import { extensionForMimeType } from './avatar.upload.js';

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

async function findUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw serviceError('User not found', 404);
  return user;
}

async function activity(userId: string, action: string, metadata?: Record<string, string>) {
  await prisma.activityLog.create({ data: { userId, action, metadata } });
}

export async function getProfile(userId: string) {
  return toSafeUser(await findUser(userId));
}

export async function updateProfile(userId: string, input: {
  fullName?: string;
  school?: string | null;
  major?: string | null;
  courseYear?: number | null;
  timezone?: string;
  language?: string;
  themeMode?: 'light' | 'dark';
}) {
  const user = await findUser(userId);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: input,
    include: { roles: { include: { role: true } } },
  });
  return toSafeUser(updated);
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  await findUser(userId);
  const stored = await storageProvider.save({
    buffer: file.buffer,
    contentType: file.mimetype,
    extension: extensionForMimeType(file.mimetype),
  });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: stored.url },
    include: { roles: { include: { role: true } } },
  });
  await activity(userId, 'user.avatar_updated', { storageKey: stored.key });
  return toSafeUser(updated);
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await findUser(userId);
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw serviceError('Current password is incorrect', 400);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.activityLog.create({ data: { userId, action: 'user.password_changed' } }),
  ]);
}

export async function deleteAccount(userId: string) {
  await findUser(userId);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.activityLog.create({ data: { userId, action: 'user.account_deleted' } }),
  ]);
}
