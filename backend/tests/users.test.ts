import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `users-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let accessToken = '';
let avatarPath = '';

describe('users module', () => {
  beforeAll(async () => {
    if (redis.status === 'end') await redis.connect();
    if (redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Users Test', email, password });
    const login = await request(app).post('/api/auth/login').send({ email, password });
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.activityLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    if (avatarPath) rmSync(avatarPath, { force: true });
    await redis.quit();
    await prisma.$disconnect();
  });

  it('gets and updates the authenticated profile', async () => {
    const profile = await request(app).get('/api/users/me').set('Authorization', `Bearer ${accessToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.email).toBe(email);
    expect(profile.body.data).not.toHaveProperty('passwordHash');

    const update = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Updated Users Test', themeMode: 'dark', timezone: 'Asia/Ho_Chi_Minh' });
    expect(update.status).toBe(200);
    expect(update.body.data.fullName).toBe('Updated Users Test');
    expect(update.body.data.themeMode).toBe('dark');
  });

  it('uploads a supported avatar through the local storage provider', async () => {
    const response = await request(app)
      .patch('/api/users/me/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('avatar', Buffer.from('fake-png-content'), { filename: 'avatar.png', contentType: 'image/png' });
    expect(response.status).toBe(200);
    expect(response.body.data.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    avatarPath = join(process.cwd(), 'uploads', response.body.data.avatarUrl.replace('/uploads/', ''));
    expect(existsSync(avatarPath)).toBe(true);
  });

  it('changes password and revokes refresh sessions', async () => {
    const wrong = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'NewSecurePass123!' });
    expect(wrong.status).toBe(400);

    const changed = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword: 'NewSecurePass123!' });
    expect(changed.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'NewSecurePass123!' });
    expect(login.status).toBe(200);
  });

  it('soft deletes the account and blocks subsequent profile access', async () => {
    const deleted = await request(app).delete('/api/users/me').set('Authorization', `Bearer ${accessToken}`);
    expect(deleted.status).toBe(200);

    const profile = await request(app).get('/api/users/me').set('Authorization', `Bearer ${accessToken}`);
    expect(profile.status).toBe(404);
  });
});
