import type { StudyPlanningPreference } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';
import type { UpdateStudyPlanningPreferenceInput } from './planning-preferences.schemas.js';

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

function validTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

async function userTimezone(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { timezone: true },
  });
  if (!user) throw serviceError('User not found', 404);
  return validTimezone(user.timezone);
}

async function logPreferenceUpdate(userId: string, preferenceId: string, context?: AuditContext) {
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'ai.coach_preferences_updated',
      entityType: 'study_planning_preference',
      entityId: preferenceId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
  });
}

export async function getStudyPlanningPreference(userId: string): Promise<StudyPlanningPreference> {
  const timezone = await userTimezone(userId);
  return prisma.studyPlanningPreference.upsert({
    where: { userId },
    create: { userId, timezone },
    update: {},
  });
}

export async function updateStudyPlanningPreference(
  userId: string,
  input: UpdateStudyPlanningPreferenceInput,
  context?: AuditContext,
): Promise<StudyPlanningPreference> {
  const current = await getStudyPlanningPreference(userId);
  const allowWeekend = input.allowWeekend ?? current.allowWeekend;
  const selectedDays = input.preferredDays ?? current.preferredDays;
  const preferredDays = allowWeekend ? selectedDays : selectedDays.filter((day) => day >= 1 && day <= 5);

  if (preferredDays.length === 0) {
    throw serviceError('Select at least one weekday when weekend study is disabled', 422);
  }

  const updated = await prisma.studyPlanningPreference.update({
    where: { userId },
    data: {
      ...input,
      preferredDays,
    },
  });
  await logPreferenceUpdate(userId, updated.id, context);
  return updated;
}
