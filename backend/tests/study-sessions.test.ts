import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `study-session-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let sessionId = '';

describe('study sessions and pomodoro module', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Study Session Test', email, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await redis.del(`study:active:${user.id}`);
      await prisma.activityLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('starts one session and blocks a second active session', async () => {
    const started = await request(app).post('/api/study-sessions/start').set('Authorization', `Bearer ${token}`).send({ note: 'Focus block' });
    expect(started.status).toBe(201);
    sessionId = started.body.data.session.id;
    expect(started.body.data.state).toMatchObject({ sessionId, status: 'running', totalMinutes: 0 });
    const duplicate = await request(app).post('/api/study-sessions/start').set('Authorization', `Bearer ${token}`).send({});
    expect(duplicate.status).toBe(409);
  });

  it('pauses and resumes without losing accumulated state', async () => {
    const paused = await request(app).post(`/api/study-sessions/${sessionId}/pause`).set('Authorization', `Bearer ${token}`).send({});
    expect(paused.status).toBe(200);
    expect(paused.body.data).toMatchObject({ sessionId, status: 'paused', totalMinutes: 0 });
    const resumed = await request(app).post(`/api/study-sessions/${sessionId}/resume`).set('Authorization', `Bearer ${token}`).send({});
    expect(resumed.status).toBe(200);
    expect(resumed.body.data).toMatchObject({ sessionId, status: 'running' });
  });

  it('starts and ends one pomodoro at a time', async () => {
    const started = await request(app).post(`/api/study-sessions/${sessionId}/pomodoro/start`).set('Authorization', `Bearer ${token}`).send({ sessionType: 'focus', plannedMinutes: 25 });
    expect(started.status).toBe(201);
    const pomodoroId = started.body.data.id;
    const duplicate = await request(app).post(`/api/study-sessions/${sessionId}/pomodoro/start`).set('Authorization', `Bearer ${token}`).send({ sessionType: 'focus', plannedMinutes: 25 });
    expect(duplicate.status).toBe(409);
    const ended = await request(app).post(`/api/study-sessions/${sessionId}/pomodoro/${pomodoroId}/end`).set('Authorization', `Bearer ${token}`).send({});
    expect(ended.status).toBe(200);
    expect(ended.body.data).toMatchObject({ id: pomodoroId, isCompleted: true, actualMinutes: 0 });
  });

  it('ends and syncs total minutes to Postgres, then returns statistics', async () => {
    const ended = await request(app).post(`/api/study-sessions/${sessionId}/end`).set('Authorization', `Bearer ${token}`).send({});
    expect(ended.status).toBe(200);
    expect(ended.body.data.state).toMatchObject({ status: 'ended', totalMinutes: 0 });
    const stored = await prisma.studySession.findUnique({ where: { id: sessionId } });
    expect(stored).toMatchObject({ endedAt: expect.any(Date), totalMinutes: 0 });
    const statistics = await request(app).get('/api/statistics/study-time?range=day').set('Authorization', `Bearer ${token}`);
    expect(statistics.status).toBe(200);
    expect(statistics.body.data).toMatchObject({ range: 'day', totalMinutes: 0, sessionCount: 1 });
    const pauseEnded = await request(app).post(`/api/study-sessions/${sessionId}/pause`).set('Authorization', `Bearer ${token}`).send({});
    expect(pauseEnded.status).toBe(409);
  });
});
