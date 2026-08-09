import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `advanced-test-${Date.now()}@example.com`;
const invitedEmail = `advanced-invited-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let invitedToken = '';
let userId = '';

describe('advanced reports, AI, flashcards, groups and admin', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Advanced Test', email, password });
    await request(app).post('/api/auth/register').send({ fullName: 'Invited Member', email: invitedEmail, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
    invitedToken = (await request(app).post('/api/auth/login').send({ email: invitedEmail, password })).body.data.accessToken;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
  }, 20_000);

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) { await prisma.activityLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    const invitedUser = await prisma.user.findUnique({ where: { email: invitedEmail } });
    if (invitedUser) { await prisma.activityLog.deleteMany({ where: { userId: invitedUser.id } }); await prisma.user.delete({ where: { id: invitedUser.id } }); }
    await redis.quit();
    await prisma.$disconnect();
  }, 20_000);

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
    const invitation = await request(app).post(`/api/study-groups/${group.body.data.id}/members`).set('Authorization', `Bearer ${token}`).send({ email: invitedEmail });
    expect(invitation.status).toBe(201);
    expect(invitation.body.data.user).not.toHaveProperty('email');
    const unreadNotifications = await request(app).get('/api/notifications?isRead=false&page=1&limit=20').set('Authorization', `Bearer ${invitedToken}`);
    expect(unreadNotifications.status).toBe(200);
    expect(unreadNotifications.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ relatedEntityType: 'study_group_invitation', relatedEntityId: invitation.body.data.id, isRead: false }),
    ]));
    const deniedBeforeAccept = await request(app).get(`/api/study-groups/${group.body.data.id}`).set('Authorization', `Bearer ${invitedToken}`);
    expect(deniedBeforeAccept.status).toBe(404);
    const pending = await request(app).get('/api/study-groups/invitations').set('Authorization', `Bearer ${invitedToken}`);
    expect(pending.body.data).toHaveLength(1);
    const accepted = await request(app).post(`/api/study-groups/${group.body.data.id}/members/${invitation.body.data.id}/accept`).set('Authorization', `Bearer ${invitedToken}`);
    expect(accepted.status).toBe(200);
    const notificationsAfterAccept = await request(app).get('/api/notifications?isRead=false&page=1&limit=20').set('Authorization', `Bearer ${invitedToken}`);
    expect(notificationsAfterAccept.body.data.items).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ relatedEntityType: 'study_group_invitation', relatedEntityId: invitation.body.data.id }),
    ]));
    const memberDetail = await request(app).get(`/api/study-groups/${group.body.data.id}`).set('Authorization', `Bearer ${invitedToken}`);
    expect(memberDetail.status).toBe(200);
    expect(memberDetail.body.data.members.every((member: { user: object }) => !('email' in member.user))).toBe(true);
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
