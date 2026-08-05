import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `grades-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let semesterId = '';
let subjectId = '';
let firstComponentId = '';
const createdComponentIds: string[] = [];

describe('grades and GPA module', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Grades Test', email, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
    const semester = await request(app).post('/api/semesters').set('Authorization', `Bearer ${token}`).send({ name: 'Grades Semester', academicYear: '2026', startDate: '2026-01-01', endDate: '2026-06-30' });
    semesterId = semester.body.data.id;
    const subject = await request(app).post('/api/subjects').set('Authorization', `Bearer ${token}`).send({ semesterId, code: 'GRADE101', name: 'Grade Testing', credits: 3, colorHex: '#336699', targetGrade: 8 });
    subjectId = subject.body.data.id;
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

  async function component(name: string, weightPercent: number, maxScore = 10) {
    const response = await request(app).post(`/api/subjects/${subjectId}/grade-components`).set('Authorization', `Bearer ${token}`).send({ name, weightPercent, maxScore });
    expect(response.status).toBe(201);
    createdComponentIds.push(response.body.data.id);
    return response.body.data.id as string;
  }

  it('calculates missing components and required final score', async () => {
    firstComponentId = await component('Midterm', 30);
    await component('Assignment', 30);
    await component('Final', 40);
    const saved = await request(app).put(`/api/grade-components/${firstComponentId}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 7 });
    expect(saved.status).toBe(200);
    const summary = await request(app).get(`/api/subjects/${subjectId}/grade-summary`).set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data).toMatchObject({ currentAverage: 7, targetGrade: 8, requiredFinalScore: 8.43, remainingWeight: 70, isTargetPossible: true });
    expect(summary.body.data.missingComponents).toHaveLength(2);
  });

  it('uses actual total weight when it is different from 100', async () => {
    const secondSubject = await request(app).post('/api/subjects').set('Authorization', `Bearer ${token}`).send({ semesterId, code: 'GRADE102', name: 'Partial Weight', credits: 2, colorHex: '#336699', targetGrade: 8 });
    const id = secondSubject.body.data.id;
    const first = await request(app).post(`/api/subjects/${id}/grade-components`).set('Authorization', `Bearer ${token}`).send({ name: 'Quiz', weightPercent: 20 });
    const second = await request(app).post(`/api/subjects/${id}/grade-components`).set('Authorization', `Bearer ${token}`).send({ name: 'Exam', weightPercent: 30 });
    await request(app).put(`/api/grade-components/${first.body.data.id}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 7 });
    await request(app).put(`/api/grade-components/${second.body.data.id}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 10 });
    const summary = await request(app).get(`/api/subjects/${id}/grade-summary`).set('Authorization', `Bearer ${token}`);
    expect(summary.body.data).toMatchObject({ currentAverage: 8.8, totalWeight: 50, remainingWeight: 0, requiredFinalScore: null });
  });

  it('flags an impossible target and calculates semester GPA by credits', async () => {
    const impossibleSubject = await request(app).post('/api/subjects').set('Authorization', `Bearer ${token}`).send({ semesterId, code: 'GRADE103', name: 'Impossible Target', credits: 1, colorHex: '#336699', targetGrade: 9 });
    const impossibleId = impossibleSubject.body.data.id;
    const impossible = await request(app).post(`/api/subjects/${impossibleId}/grade-components`).set('Authorization', `Bearer ${token}`).send({ name: 'Midterm', weightPercent: 50, maxScore: 10 });
    await request(app).post(`/api/subjects/${impossibleId}/grade-components`).set('Authorization', `Bearer ${token}`).send({ name: 'Final', weightPercent: 50, maxScore: 10 });
    await request(app).put(`/api/grade-components/${impossible.body.data.id}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 5 });
    const summary = await request(app).get(`/api/subjects/${impossibleId}/grade-summary`).set('Authorization', `Bearer ${token}`);
    expect(summary.body.data.isTargetPossible).toBe(false);
    expect(summary.body.data.warnings).toContain('requiredFinalScore exceeds maxScore');
    const gpa = await request(app).get(`/api/gpa/${semesterId}`).set('Authorization', `Bearer ${token}`);
    expect(gpa.status).toBe(200);
    expect(gpa.body.data).toMatchObject({ semesterId, totalCredits: 6 });
    expect(gpa.body.data.gpa).toBe(7.27);
  });

  it('supports editing a grade and completing all components', async () => {
    await request(app).put(`/api/grade-components/${createdComponentIds[1]}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 8 });
    await request(app).put(`/api/grade-components/${createdComponentIds[2]}/grade`).set('Authorization', `Bearer ${token}`).send({ score: 9 });
    const summary = await request(app).get(`/api/subjects/${subjectId}/grade-summary`).set('Authorization', `Bearer ${token}`);
    expect(summary.body.data).toMatchObject({ currentAverage: 8.1, remainingWeight: 0, missingComponents: [], requiredFinalScore: null, isTargetPossible: true });
  });
});
