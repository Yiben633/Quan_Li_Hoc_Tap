import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `semester-test-${Date.now()}@example.com`;
const otherEmail = `semester-other-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let accessToken = '';
let semesterId = '';
let subjectId = '';

describe('semester and subject modules', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Semester Test', email, password });
    const login = await request(app).post('/api/auth/login').send({ email, password });
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    const otherUser = await prisma.user.findUnique({ where: { email: otherEmail } });
    for (const item of [user, otherUser]) {
      if (item) {
        await prisma.activityLog.deleteMany({ where: { userId: item.id } });
        await prisma.user.delete({ where: { id: item.id } });
      }
    }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('creates and lists a semester with pagination', async () => {
    const created = await request(app).post('/api/semesters').set('Authorization', `Bearer ${accessToken}`).send({
      name: 'Spring 2026', academicYear: '2025-2026', startDate: '2026-01-05', endDate: '2026-05-30', targetGpa: 8.5, expectedCredits: 20,
    });
    expect(created.status).toBe(201);
    semesterId = created.body.data.id;

    const list = await request(app).get('/api/semesters?page=1&limit=10&sort=name&order=asc').set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.pagination).toMatchObject({ page: 1, limit: 10, total: 1 });
    expect(list.body.data.items[0].targetGpa).toBe(8.5);
  });

  it('creates, searches and details a subject with statistics', async () => {
    const created = await request(app).post('/api/subjects').set('Authorization', `Bearer ${accessToken}`).send({
      semesterId, code: 'API101', name: 'Backend Engineering', credits: 3, colorHex: '#336699', targetGrade: 8,
    });
    expect(created.status).toBe(201);
    subjectId = created.body.data.id;

    const list = await request(app).get('/api/subjects?search=backend&semesterId=' + semesterId).set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);

    const detail = await request(app).get(`/api/subjects/${subjectId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.statistics).toEqual({ taskTotal: 0, taskDone: 0, totalStudyMinutes: 0, currentAverage: null });
  });

  it('updates and completes a subject, then soft deletes it', async () => {
    const updated = await request(app).patch(`/api/subjects/${subjectId}`).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Backend Engineering Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Backend Engineering Updated');

    const completed = await request(app).patch(`/api/subjects/${subjectId}/complete`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe('completed');

    const removed = await request(app).delete(`/api/subjects/${subjectId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(removed.status).toBe(200);
    const detail = await request(app).get(`/api/subjects/${subjectId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(detail.status).toBe(404);
  });

  it('enforces ownership and supports close, duplicate and soft delete', async () => {
    const otherRegistration = await request(app).post('/api/auth/register').send({ fullName: 'Other User', email: otherEmail, password });
    expect(otherRegistration.status).toBe(201);
    const otherLogin = await request(app).post('/api/auth/login').send({ email: otherEmail, password });
    const otherToken = otherLogin.body.data.accessToken;

    const forbidden = await request(app).get(`/api/semesters/${semesterId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(forbidden.status).toBe(404);

    const closed = await request(app).post(`/api/semesters/${semesterId}/close`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(closed.status).toBe(200);
    expect(closed.body.data.status).toBe('closed');

    const duplicate = await request(app).post(`/api/semesters/${semesterId}/duplicate`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.data.name).toBe('Spring 2026 (Copy)');

    const removed = await request(app).delete(`/api/semesters/${semesterId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(removed.status).toBe(200);
    const detail = await request(app).get(`/api/semesters/${semesterId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(detail.status).toBe(404);
  });
});
