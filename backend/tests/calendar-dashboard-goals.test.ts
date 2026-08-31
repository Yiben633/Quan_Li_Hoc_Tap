import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `calendar-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let accessToken = '';
let userId = '';
let subjectId = '';
let scheduleId = '';
let eventId = '';
let goalId = '';

function todayDate() { return new Date().toISOString().slice(0, 10); }

describe('calendar, dashboard and goals', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Calendar Test', email, password });
    const login = await request(app).post('/api/auth/login').send({ email, password });
    accessToken = login.body.data.accessToken;
    const user = await prisma.user.findUnique({ where: { email } });
    userId = user!.id;
    const semester = await request(app).post('/api/semesters').set('Authorization', `Bearer ${accessToken}`).send({ name: 'Calendar Semester', academicYear: '2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const subject = await request(app).post('/api/subjects').set('Authorization', `Bearer ${accessToken}`).send({ semesterId: semester.body.data.id, code: 'CAL101', name: 'Calendar Subject', credits: 3, colorHex: '#AA5500', status: 'in_progress' });
    subjectId = subject.body.data.id;
    const now = new Date();
    await prisma.studySession.create({ data: { userId, subjectId, startedAt: now, totalMinutes: 30 } });
    await prisma.gradeComponent.create({ data: { subjectId, name: 'Final exam', weightPercent: 40, examDate: now } });
    const task = await request(app).post('/api/tasks').set('Authorization', `Bearer ${accessToken}`).send({ subjectId, title: 'Calendar task', dueDate: now.toISOString(), status: 'done' });
    expect(task.status).toBe(201);
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.activityLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('creates recurring schedules and events', async () => {
    const schedule = await request(app).post('/api/schedules').set('Authorization', `Bearer ${accessToken}`).send({ subjectId, type: 'class', title: 'Daily class', startTime: '09:00', endTime: '11:00', startDate: todayDate(), recurrenceRule: 'daily', colorHex: '#112233' });
    expect(schedule.status).toBe(201);
    scheduleId = schedule.body.data.id;
    const event = await request(app).post('/api/events').set('Authorization', `Bearer ${accessToken}`).send({ title: 'Project review', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600000).toISOString(), colorHex: '#334455' });
    expect(event.status).toBe(201);
    eventId = event.body.data.id;
  });

  it('returns normalized calendar items from all sources', async () => {
    const calendar = await request(app).get(`/api/calendar?view=day&date=${todayDate()}`).set('Authorization', `Bearer ${accessToken}`);
    expect(calendar.status).toBe(200);
    const types = calendar.body.data.items.map((item: { type: string }) => item.type);
    expect(types).toEqual(expect.arrayContaining(['schedule', 'event', 'task_due', 'exam']));
    expect(calendar.body.data.items[0]).toEqual(expect.objectContaining({ title: expect.any(String), startAt: expect.any(String), endAt: expect.any(String), sourceEntity: expect.any(Object) }));
  });

  it('calculates goal progress and dashboard metrics', async () => {
    const goal = await request(app).post('/api/goals').set('Authorization', `Bearer ${accessToken}`).send({ subjectId, name: 'Study 60 minutes', type: 'study_time', targetValue: 60, deadline: todayDate() });
    expect(goal.status).toBe(201);
    goalId = goal.body.data.id;
    expect(goal.body.data.currentValue).toBe(30);
    expect(goal.body.data.progressPercent).toBe(50);

    const progress = await request(app).get(`/api/goals/${goalId}/progress`).set('Authorization', `Bearer ${accessToken}`);
    expect(progress.status).toBe(200);
    expect(progress.body.data.progressPercent).toBe(50);

    const summary = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${accessToken}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data.tasksToday.length).toBeGreaterThan(0);
    expect(summary.body.data.studyMinutesThisWeek).toBeGreaterThanOrEqual(30);
    expect(summary.body.data.activeSubjects.length).toBe(1);
    expect(summary.body.data.activeSubjects[0].taskProgress).toEqual({ taskTotal: 1, taskDone: 1, progressPercent: 100 });

    const chart = await request(app).get('/api/dashboard/progress-chart?range=week').set('Authorization', `Bearer ${accessToken}`);
    expect(chart.status).toBe(200);
    expect(chart.body.data.points).toHaveLength(7);
  });

  it('runs daily goal notification cron and supports CRUD cleanup', async () => {
    const cron = await request(app)
      .post('/api/goals/cron/daily')
      .set('x-cron-secret', process.env.CRON_SECRET!)
      .send({});
    expect(cron.status).toBe(200);
    expect(cron.body.data.processed).toBeGreaterThanOrEqual(1);

    const notifications = await prisma.notification.findMany({ where: { userId, type: 'goal_at_risk' } });
    expect(notifications.length).toBeGreaterThanOrEqual(1);

    const updated = await request(app).patch(`/api/goals/${goalId}`).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Study goal updated' });
    expect(updated.status).toBe(200);
    const removedGoal = await request(app).delete(`/api/goals/${goalId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(removedGoal.status).toBe(200);
    expect((await request(app).delete(`/api/schedules/${scheduleId}`).set('Authorization', `Bearer ${accessToken}`)).status).toBe(200);
    expect((await request(app).delete(`/api/events/${eventId}`).set('Authorization', `Bearer ${accessToken}`)).status).toBe(200);
  });
});
