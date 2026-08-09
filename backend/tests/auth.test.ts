import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `auth-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';

function refreshCookie(response: request.Response) {
  const setCookie = response.headers['set-cookie'];
  const cookie = Array.isArray(setCookie)
    ? setCookie.find((value: string) => value.startsWith('refreshToken='))
    : setCookie?.startsWith('refreshToken=')
      ? setCookie
      : undefined;
  if (!cookie) throw new Error('Refresh cookie was not returned');
  return cookie.split(';')[0];
}

function csrfCookie(response: request.Response) {
  const setCookie = response.headers['set-cookie'];
  const cookie = Array.isArray(setCookie) ? [...setCookie].reverse().find((value: string) => value.startsWith('csrfToken=') && !value.startsWith('csrfToken=;')) : undefined;
  if (!cookie) throw new Error('CSRF cookie was not returned');
  return cookie.split(';')[0];
}

function csrfValue(cookie: string) { return cookie.replace(/^csrfToken=/, ''); }

describe('auth module', () => {
  beforeAll(async () => {
    if (redis.status === 'wait') await redis.connect();
    await redis.ping();
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.activityLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await redis.del(`auth:password-reset:${email}`);
    await prisma.$disconnect();
    await redis.quit();
  });

  it('registers a student without exposing passwordHash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      fullName: 'Auth Test Student',
      email,
      studentCode: `TEST-${Date.now()}`,
      password,
      major: 'Computer Science',
      courseYear: 2026,
    });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data.roles).toContain('student');
  });

  it('rejects a wrong password and logs in with a refresh cookie', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email, password: 'wrong-pass' });
    expect(wrong.status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(login)).toMatch(/^refreshToken=/);
  });

  it('returns the current user and rotates refresh tokens on refresh', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const oldCookie = refreshCookie(login);
    const oldCsrfCookie = csrfCookie(login);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', `${oldCookie}; ${oldCsrfCookie}`).set('x-csrf-token', csrfValue(oldCsrfCookie)).send({});
    expect(refreshed.status).toBe(200);
    const nextCookie = refreshCookie(refreshed);
    expect(nextCookie).not.toBe(oldCookie);

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', `${oldCookie}; ${oldCsrfCookie}`).set('x-csrf-token', csrfValue(oldCsrfCookie)).send({});
    expect(reused.status).toBe(401);
  });

  it('revokes the current refresh token on logout', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const cookie = refreshCookie(login);
    const csrf = csrfCookie(login);
    const logout = await request(app).post('/api/auth/logout').set('Cookie', `${cookie}; ${csrf}`).set('x-csrf-token', csrfValue(csrf)).send({});
    expect(logout.status).toBe(200);

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', `${cookie}; ${csrf}`).set('x-csrf-token', csrfValue(csrf)).send({});
    expect(refreshed.status).toBe(401);
  });

  it('verifies an OTP and resets the password', async () => {
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);
    const otp = forgot.body.data.devOtp as string;
    expect(otp).toMatch(/^\d{6}$/);

    const verify = await request(app).post('/api/auth/verify-otp').send({ email, otp });
    expect(verify.status).toBe(200);
    const reset = await request(app).post('/api/auth/reset-password').send({ email, otp, newPassword: 'NewSecurePass123!' });
    expect(reset.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'NewSecurePass123!' });
    expect(login.status).toBe(200);
  });
});
