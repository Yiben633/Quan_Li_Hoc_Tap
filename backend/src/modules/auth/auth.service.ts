import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { env } from '../../config/env.js';
import { sendPasswordResetOtp } from './email.adapter.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from './auth.tokens.js';

const PASSWORD_RESET_TTL_SECONDS = 5 * 60;
const MAX_LOGIN_FAILURES = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  avatarUrl: string | null;
  school: string | null;
  major: string | null;
  courseYear: number | null;
  timezone: string;
  language: string;
  themeMode: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
};

type AuthTokens = { accessToken: string; refreshToken: string };

export function toSafeUser(user: {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  avatarUrl: string | null;
  school: string | null;
  major: string | null;
  courseYear: number | null;
  timezone: string;
  language: string;
  themeMode: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: { name: string } }[];
}): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    studentCode: user.studentCode,
    avatarUrl: user.avatarUrl,
    school: user.school,
    major: user.major,
    courseYear: user.courseYear,
    timezone: user.timezone,
    language: user.language,
    themeMode: user.themeMode,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map(({ role }) => role.name),
  };
}

async function addActivityLog(
  action: string,
  userId: string | undefined,
  context: { ipAddress?: string; userAgent?: string; metadata?: Prisma.InputJsonValue },
) {
  await prisma.activityLog.create({
    data: {
      action,
      userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.metadata,
    },
  });
}

async function getUserWithRoles(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { roles: { include: { role: true } } },
  });
}

function getLoginLockMessage() {
  return 'Invalid email or password';
}

async function issueTokens(userId: string, roles: string[]): Promise<AuthTokens> {
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return { accessToken: createAccessToken(userId, roles), refreshToken };
}

export async function register(input: {
  fullName: string;
  email: string;
  studentCode?: string;
  password: string;
  school?: string;
  major?: string;
  courseYear?: number;
}, context: { ipAddress?: string; userAgent?: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: 'student' } });
      if (!role) throw new Error('Student role is not configured');
      const created = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          studentCode: input.studentCode,
          passwordHash,
          school: input.school,
          major: input.major,
          courseYear: input.courseYear,
          roles: { create: { roleId: role.id } },
        },
        include: { roles: { include: { role: true } } },
      });
      await tx.activityLog.create({
        data: { action: 'auth.register', userId: created.id, ipAddress: context.ipAddress, userAgent: context.userAgent },
      });
      return created;
    });
    return toSafeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw Object.assign(new Error('Email or student code already exists'), { statusCode: 409 });
    }
    throw error;
  }
}

export async function login(email: string, password: string, context: { ipAddress?: string; userAgent?: string }) {
  const user = await getUserWithRoles(email);
  if (!user) throw Object.assign(new Error(getLoginLockMessage()), { statusCode: 401 });
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Object.assign(new Error('Account temporarily locked. Try again in 15 minutes.'), { statusCode: 423 });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    const nextFailures = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextFailures >= MAX_LOGIN_FAILURES ? 0 : nextFailures,
        lockedUntil: nextFailures >= MAX_LOGIN_FAILURES ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });
    await addActivityLog('auth.login_failed', user.id, context);
    throw Object.assign(new Error(getLoginLockMessage()), { statusCode: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  const roles = user.roles.map(({ role }) => role.name);
  const tokens = await issueTokens(user.id, roles);
  await addActivityLog('auth.login', user.id, context);
  return { user: toSafeUser(user), ...tokens };
}

export async function refresh(rawToken: string, context: { ipAddress?: string; userAgent?: string }) {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || stored.user.deletedAt) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }
  const roles = stored.user.roles.map(({ role }) => role.name);
  const nextToken = createRefreshToken();
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: hashToken(nextToken), expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
    }),
  ]);
  await addActivityLog('auth.refresh', stored.userId, context);
  return { user: toSafeUser(stored.user), accessToken: createAccessToken(stored.userId, roles), refreshToken: nextToken };
}

export async function logout(rawToken: string | undefined, context: { ipAddress?: string; userAgent?: string }) {
  if (!rawToken) return;
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!token) return;
  await prisma.refreshToken.updateMany({ where: { id: token.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await addActivityLog('auth.logout', token.userId, context);
}

function resetKey(email: string) {
  return `auth:password-reset:${email}`;
}

export async function forgotPassword(email: string) {
  const user = await getUserWithRoles(email);
  if (!user) return { email };
  const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await redis.set(resetKey(email), JSON.stringify({ userId: user.id, otpHash: await bcrypt.hash(otp, 10), verified: false }), 'EX', PASSWORD_RESET_TTL_SECONDS);
  await sendPasswordResetOtp(email, otp);
  return { email, ...(env.NODE_ENV !== 'production' ? { devOtp: otp } : {}) };
}

export async function verifyOtp(email: string, otp: string) {
  const raw = await redis.get(resetKey(email));
  if (!raw) throw Object.assign(new Error('OTP expired or invalid'), { statusCode: 400 });
  const record = JSON.parse(raw) as { userId: string; otpHash: string; verified: boolean };
  if (!(await bcrypt.compare(otp, record.otpHash))) throw Object.assign(new Error('OTP expired or invalid'), { statusCode: 400 });
  await redis.set(resetKey(email), JSON.stringify({ ...record, verified: true }), 'EX', PASSWORD_RESET_TTL_SECONDS);
}

export async function resetPassword(email: string, otp: string, newPassword: string, context: { ipAddress?: string; userAgent?: string }) {
  const raw = await redis.get(resetKey(email));
  if (!raw) throw Object.assign(new Error('OTP expired or invalid'), { statusCode: 400 });
  const record = JSON.parse(raw) as { userId: string; otpHash: string; verified: boolean };
  if (!record.verified || !(await bcrypt.compare(otp, record.otpHash))) throw Object.assign(new Error('OTP verification required'), { statusCode: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12), failedLoginCount: 0, lockedUntil: null } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.activityLog.create({ data: { action: 'auth.reset_password', userId: record.userId, ipAddress: context.ipAddress, userAgent: context.userAgent } }),
  ]);
  await redis.del(resetKey(email));
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { roles: { include: { role: true } } } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return toSafeUser(user);
}
