import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';
import { runNotificationEngine } from '../src/modules/notifications/notifications.service.js';

const email = `notifications-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let userId = '';

describe('notification engine', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Notifications Test', email, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) { await prisma.activityLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('updates settings through the dedicated endpoint', async () => {
    const settings = await request(app).get('/api/notification-settings').set('Authorization', `Bearer ${token}`);
    expect(settings.status).toBe(200);
    expect(settings.body.data.inAppEnabled).toBe(true);
    const updated = await request(app).patch('/api/notification-settings').set('Authorization', `Bearer ${token}`).send({ reminderMinutesBefore: 120, emailEnabled: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ reminderMinutesBefore: 120, emailEnabled: true });
  });

  it('scans upcoming tasks, deduplicates, and supports read operations', async () => {
    const dueDate = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.task.create({ data: { userId, title: 'Upcoming notification task', dueDate } });
    const first = await runNotificationEngine();
    expect(first.created).toBeGreaterThanOrEqual(1);
    const second = await runNotificationEngine();
    expect(second.created).toBe(0);
    const list = await request(app).get('/api/notifications?isRead=false&page=1&limit=20').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((item: { type: string }) => item.type === 'deadline_soon')).toBe(true);
    const notificationId = list.body.data.items.find((item: { type: string }) => item.type === 'deadline_soon').id as string;
    const read = await request(app).patch(`/api/notifications/${notificationId}/read`).set('Authorization', `Bearer ${token}`).send({});
    expect(read.status).toBe(200);
    const all = await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${token}`).send({});
    expect(all.status).toBe(200);
    expect(all.body.data.updated).toBeGreaterThanOrEqual(0);
  });

  it('protects the Vercel cron endpoint with CRON_SECRET', async () => {
    const cron = await request(app).get('/api/cron/notifications');
    expect(cron.status).toBe(401);
  });
});
