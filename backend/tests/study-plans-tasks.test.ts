import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `tasks-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let accessToken = '';
let planId = '';
let subjectId = '';
let taskA = '';
let taskB = '';

describe('study plans, tasks and kanban', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Task Test', email, password });
    const login = await request(app).post('/api/auth/login').send({ email, password });
    accessToken = login.body.data.accessToken;
    const semester = await request(app).post('/api/semesters').set('Authorization', `Bearer ${accessToken}`).send({ name: 'Task Semester', academicYear: '2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const subject = await request(app).post('/api/subjects').set('Authorization', `Bearer ${accessToken}`).send({ semesterId: semester.body.data.id, code: 'TASK101', name: 'Task Subject', credits: 3, colorHex: '#123456' });
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

  it('creates and filters a study plan and tasks', async () => {
    const plan = await request(app).post('/api/study-plans').set('Authorization', `Bearer ${accessToken}`).send({ subjectId, title: 'Master backend', description: 'Practice integration coverage', targetGoal: 'Ship reliable API', priority: 'high', startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(plan.status).toBe(201);
    planId = plan.body.data.id;
    expect(plan.body.data).toMatchObject({ progressPercent: 0, taskTotal: 0, taskDone: 0 });

    for (const search of ['MASTER', 'INTEGRATION', 'RELIABLE']) {
      const searchedPlans = await request(app).get(`/api/study-plans?search=${search}`).set('Authorization', `Bearer ${accessToken}`);
      expect(searchedPlans.status).toBe(200);
      expect(searchedPlans.body.data.items.map((item: { id: string }) => item.id)).toContain(planId);
    }

    const first = await request(app).post('/api/tasks').set('Authorization', `Bearer ${accessToken}`).send({ studyPlanId: planId, subjectId, title: 'Build API', priority: 'high', dueDate: new Date().toISOString() });
    const second = await request(app).post('/api/tasks').set('Authorization', `Bearer ${accessToken}`).send({ studyPlanId: planId, subjectId, title: 'Write tests', priority: 'medium', dueDate: new Date(Date.now() - 86400000).toISOString() });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    taskA = first.body.data.id;
    taskB = second.body.data.id;

    const list = await request(app).get(`/api/tasks?studyPlanId=${planId}&status=todo&search=api`).set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);

    const todayDate = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const range = await request(app).get(`/api/tasks?studyPlanId=${planId}&dueFrom=${yesterdayDate}&dueTo=${todayDate}`).set('Authorization', `Bearer ${accessToken}`);
    expect(range.status).toBe(200);
    expect(range.body.data.items.map((task: { id: string }) => task.id)).toEqual(expect.arrayContaining([taskA, taskB]));

    const exactDate = await request(app).get(`/api/tasks?studyPlanId=${planId}&dueDate=${todayDate}&dueFrom=${yesterdayDate}&dueTo=${todayDate}`).set('Authorization', `Bearer ${accessToken}`);
    expect(exactDate.status).toBe(200);
    expect(exactDate.body.data.items.map((task: { id: string }) => task.id)).toEqual([taskA]);

    const plans = await request(app).get('/api/study-plans').set('Authorization', `Bearer ${accessToken}`);
    expect(plans.status).toBe(200);
    const listedPlan = plans.body.data.items.find((item: { id: string }) => item.id === planId);
    expect(listedPlan).toMatchObject({ id: planId, taskTotal: 2, taskDone: 0 });

    const overdue = await request(app).get('/api/tasks/overdue').set('Authorization', `Bearer ${accessToken}`);
    expect(overdue.status).toBe(200);
    expect(overdue.body.data.some((task: { id: string }) => task.id === taskB)).toBe(true);
  });

  it('keeps plan progress in sync and manages subtasks', async () => {
    const subtask = await request(app).post(`/api/tasks/${taskA}/subtasks`).set('Authorization', `Bearer ${accessToken}`).send({ title: 'Add validation' });
    expect(subtask.status).toBe(201);
    const updatedSubtask = await request(app).patch(`/api/tasks/${taskA}/subtasks/${subtask.body.data.id}`).set('Authorization', `Bearer ${accessToken}`).send({ isDone: true });
    expect(updatedSubtask.status).toBe(200);

    const completed = await request(app).patch(`/api/tasks/${taskA}/complete`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(completed.status).toBe(200);
    const plan = await request(app).get(`/api/study-plans/${planId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(plan.status).toBe(200);
    expect(plan.body.data).toMatchObject({ progressPercent: 50, taskTotal: 2, taskDone: 1 });

    const subtasks = await request(app).get(`/api/tasks/${taskA}/subtasks`).set('Authorization', `Bearer ${accessToken}`);
    expect(subtasks.body.data[0].isDone).toBe(true);
  });

  it('reorders tasks transactionally and duplicates a task', async () => {
    const reordered = await request(app).post('/api/tasks/reorder').set('Authorization', `Bearer ${accessToken}`).send([{ id: taskB, sortOrder: 0 }, { id: taskA, sortOrder: 1 }]);
    expect(reordered.status).toBe(200);
    expect(reordered.body.data[0].id).toBe(taskB);

    const duplicate = await request(app).post(`/api/tasks/${taskB}/duplicate`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.data.title).toBe('Write tests (Copy)');
  });

  it('moves a task across kanban columns in a transaction', async () => {
    const moved = await request(app).patch('/api/kanban/move').set('Authorization', `Bearer ${accessToken}`).send({ taskId: taskB, toStatus: 'in_progress', newIndex: 0 });
    expect(moved.status).toBe(200);
    expect(moved.body.data.columns.in_progress[0].id).toBe(taskB);
    expect(moved.body.data.columns.todo).toBeDefined();

    const board = await request(app).get(`/api/kanban/board?subjectId=${subjectId}&priority=medium`).set('Authorization', `Bearer ${accessToken}`);
    expect(board.status).toBe(200);
    expect(board.body.data.columns).toHaveProperty('todo');
    expect(board.body.data.columns).toHaveProperty('in_progress');
  });

  it('supports today and soft deletes the task and plan', async () => {
    const today = await request(app).get('/api/tasks/today').set('Authorization', `Bearer ${accessToken}`);
    expect(today.status).toBe(200);
    expect(today.body.data.some((task: { id: string }) => task.id === taskA)).toBe(true);

    const deletedTask = await request(app).delete(`/api/tasks/${taskA}`).set('Authorization', `Bearer ${accessToken}`);
    expect(deletedTask.status).toBe(200);
    const deletedPlan = await request(app).delete(`/api/study-plans/${planId}`).set('Authorization', `Bearer ${accessToken}`);
    expect(deletedPlan.status).toBe(200);
  });
});
