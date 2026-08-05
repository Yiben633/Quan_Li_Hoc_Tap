import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `advanced-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let userId = '';

describe('advanced reports, AI, flashcards, groups and admin', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Advanced Test', email, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) { await prisma.activityLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('creates and reviews flashcards with ownership', async () => {
    const set = await request(app).post('/api/flashcard-sets').set('Authorization', `Bearer ${token}`).send({ name: 'Backend Set' });
    expect(set.status).toBe(201);
    const card = await request(app).post(`/api/flashcard-sets/${set.body.data.id}/flashcards`).set('Authorization', `Bearer ${token}`).send({ question: 'What is Prisma?', answer: 'An ORM' });
    expect(card.status).toBe(201);
    const reviewed = await request(app).post(`/api/flashcards/${card.body.data.id}/review`).set('Authorization', `Bearer ${token}`).send({ correct: true });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.correctCount).toBe(1);
    const due = await request(app).get('/api/flashcards/due').set('Authorization', `Bearer ${token}`);
    expect(due.status).toBe(200);
  });

  it('uses greedy schedule allocation and warns on insufficient free time', async () => {
    const response = await request(app).post('/api/ai/suggest-schedule').set('Authorization', `Bearer ${token}`).send({ tasks: [{ title: 'Long task', estimatedMinutes: 90 }], slots: [{ startAt: '2026-08-06T08:00:00.000Z', endAt: '2026-08-06T09:00:00.000Z' }] });
    expect(response.status).toBe(200);
    expect(response.body.data.assignments).toHaveLength(0);
    expect(response.body.data.warnings).toHaveLength(1);
    const chat = await request(app).post('/api/ai/chat').set('Authorization', `Bearer ${token}`).send({ prompt: 'hello' });
    expect(chat.body.data.provider).toBe('mock');
  });

  it('returns reports and real PDF/Excel exports', async () => {
    const overview = await request(app).get('/api/statistics/overview').set('Authorization', `Bearer ${token}`);
    expect(overview.status).toBe(200);
    const weekly = await request(app).get('/api/reports/weekly').set('Authorization', `Bearer ${token}`);
    expect(weekly.status).toBe(200);
    const pdf = await request(app).post('/api/reports/export?format=pdf').set('Authorization', `Bearer ${token}`).send({});
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    const excel = await request(app).post('/api/reports/export?format=excel').set('Authorization', `Bearer ${token}`).send({});
    expect(excel.status).toBe(200);
    expect(excel.headers['content-type']).toContain('spreadsheetml');
  });

  it('creates a study group and calculates progress', async () => {
    const group = await request(app).post('/api/study-groups').set('Authorization', `Bearer ${token}`).send({ name: 'Backend Group' });
    expect(group.status).toBe(201);
    const task = await request(app).post(`/api/study-groups/${group.body.data.id}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'Group task', status: 'done' });
    expect(task.status).toBe(201);
    const progress = await request(app).get(`/api/study-groups/${group.body.data.id}/progress`).set('Authorization', `Bearer ${token}`);
    expect(progress.body.data).toMatchObject({ totalTasks: 1, doneTasks: 1, progressPercent: 100 });
  });

  it('requires admin role for admin routes', async () => {
    const forbidden = await request(app).get('/api/admin/users?page=1&limit=5').set('Authorization', `Bearer ${token}`);
    expect(forbidden.status).toBe(403);
    const role = await prisma.role.upsert({ where: { name: 'admin' }, create: { name: 'admin' }, update: {} });
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
    const adminLogin = await request(app).post('/api/auth/login').send({ email, password });
    const allowed = await request(app).get('/api/admin/users?page=1&limit=5').set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.items.some((item: { id: string }) => item.id === userId)).toBe(true);
  });
});
