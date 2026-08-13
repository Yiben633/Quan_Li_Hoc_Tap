import { jest } from '@jest/globals';

const userFindFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const preferenceUpsert = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const preferenceUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const activityLogCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
  prisma: {
    user: { findFirst: userFindFirst },
    studyPlanningPreference: { upsert: preferenceUpsert, update: preferenceUpdate },
    activityLog: { create: activityLogCreate },
  },
}));

const service = await import('../src/modules/ai/coach/planning-preferences.service.js');

const preference = {
  id: 'preference-a',
  userId: 'user-a',
  timezone: 'Asia/Ho_Chi_Minh',
  preferredStudyStart: null,
  preferredStudyEnd: null,
  maxStudyMinutesPerDay: 180,
  defaultSessionMinutes: 45,
  minBreakMinutes: 10,
  allowWeekend: true,
  preferredDays: [0, 1, 2, 3, 4, 5, 6],
};

describe('study planning preferences', () => {
  beforeEach(() => {
    [userFindFirst, preferenceUpsert, preferenceUpdate, activityLogCreate].forEach((mock) => mock.mockReset());
    userFindFirst.mockResolvedValue({ timezone: 'Asia/Ho_Chi_Minh' });
    preferenceUpsert.mockResolvedValue(preference);
    preferenceUpdate.mockResolvedValue({ ...preference, allowWeekend: false, preferredDays: [1, 2, 3, 4, 5] });
    activityLogCreate.mockResolvedValue({});
  });

  it('creates a preference lazily with the user timezone', async () => {
    await expect(service.getStudyPlanningPreference('user-a')).resolves.toMatchObject({ id: preference.id });

    expect(preferenceUpsert).toHaveBeenCalledWith({
      where: { userId: 'user-a' },
      create: { userId: 'user-a', timezone: 'Asia/Ho_Chi_Minh' },
      update: {},
    });
  });

  it('removes weekend days when weekend study is disabled and writes an audit entry', async () => {
    await expect(service.updateStudyPlanningPreference('user-a', { allowWeekend: false })).resolves.toMatchObject({
      allowWeekend: false,
      preferredDays: [1, 2, 3, 4, 5],
    });

    expect(preferenceUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-a' },
      data: expect.objectContaining({ allowWeekend: false, preferredDays: [1, 2, 3, 4, 5] }),
    }));
    expect(activityLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'ai.coach_preferences_updated', entityId: preference.id }),
    }));
  });

  it('rejects a no-weekend setting when no weekday remains', async () => {
    preferenceUpsert.mockResolvedValue({ ...preference, allowWeekend: true, preferredDays: [0, 6] });

    await expect(service.updateStudyPlanningPreference('user-a', { allowWeekend: false })).rejects.toMatchObject({
      message: 'Select at least one weekday when weekend study is disabled',
      statusCode: 422,
    });
    expect(preferenceUpdate).not.toHaveBeenCalled();
  });
});
