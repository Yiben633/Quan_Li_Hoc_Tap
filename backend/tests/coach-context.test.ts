import { jest } from '@jest/globals';

const subjectFindFirst = jest.fn<() => Promise<{ id: string } | null>>();
const studyPlanFindFirst = jest.fn<() => Promise<{ id: string } | null>>();
const taskFindFirst = jest.fn<() => Promise<{ id: string } | null>>();

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    subject: { findFirst: subjectFindFirst },
    studyPlan: { findFirst: studyPlanFindFirst },
    task: { findFirst: taskFindFirst },
  },
}));

const { buildStudyCoachContext } = await import('../src/modules/ai/coach/coachContext.service.js');

describe('buildStudyCoachContext ownership', () => {
  beforeEach(() => {
    subjectFindFirst.mockReset();
    studyPlanFindFirst.mockReset();
    taskFindFirst.mockReset();
  });

  it('rejects a subject that is not owned by the current user', async () => {
    subjectFindFirst.mockResolvedValue(null);

    await expect(buildStudyCoachContext('user-a', { subjectId: 'subject-owned-by-user-b' })).rejects.toMatchObject({
      message: 'Subject not found',
      statusCode: 404,
    });
    expect(studyPlanFindFirst).not.toHaveBeenCalled();
    expect(taskFindFirst).not.toHaveBeenCalled();
  });

  it('rejects a study plan that is not owned by the current user', async () => {
    studyPlanFindFirst.mockResolvedValue(null);

    await expect(buildStudyCoachContext('user-a', { studyPlanId: 'plan-owned-by-user-b' })).rejects.toMatchObject({
      message: 'Study plan not found',
      statusCode: 404,
    });
  });

  it('rejects a task that is not owned by the current user', async () => {
    taskFindFirst.mockResolvedValue(null);

    await expect(buildStudyCoachContext('user-a', { taskId: 'task-owned-by-user-b' })).rejects.toMatchObject({
      message: 'Task not found',
      statusCode: 404,
    });
  });
});
