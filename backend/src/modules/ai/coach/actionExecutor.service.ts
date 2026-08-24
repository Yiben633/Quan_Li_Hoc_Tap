import { GoalType, type Prisma, type Schedule } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';
import { parseGoalDraftPayload, parseRescheduleDraftPayload, parseScheduleDraftPayload, parseStudyPlanBundlePayload, type ScheduleDraftPayload } from './draft.service.js';

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

type CalendarInterval = {
  startAt: Date;
  endAt: Date;
};

type ApplyDraftResult = {
  draftId: string;
  status: 'applied';
  alreadyApplied: boolean;
  createdStudyPlanId: string | null;
  createdEventIds: string[];
  createdTaskIds: string[];
  updatedEventIds: string[];
  createdGoalId?: string;
};

function draftConflict(message: string) {
  return Object.assign(serviceError(message, 409), { code: 'DRAFT_CONFLICT' });
}

function dateOnly(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function atTime(date: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const result = dateOnly(date);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}

function scheduleIntervals(schedule: Pick<Schedule, 'dayOfWeek' | 'startTime' | 'endTime' | 'startDate' | 'endDate' | 'recurrenceRule'>, start: Date, end: Date): CalendarInterval[] {
  const first = dateOnly(schedule.startDate) > dateOnly(start) ? dateOnly(schedule.startDate) : dateOnly(start);
  const last = schedule.endDate && dateOnly(schedule.endDate) < dateOnly(end) ? dateOnly(schedule.endDate) : dateOnly(end);
  const intervals: CalendarInterval[] = [];

  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    const isFirstDate = cursor.getTime() === dateOnly(schedule.startDate).getTime();
    const scheduleDay = schedule.dayOfWeek ?? dateOnly(schedule.startDate).getUTCDay();
    if ((schedule.recurrenceRule === 'none' && !isFirstDate) || (schedule.recurrenceRule === 'weekly' && cursor.getUTCDay() !== scheduleDay)) continue;

    const startAt = atTime(cursor, schedule.startTime);
    let endAt = atTime(cursor, schedule.endTime);
    if (endAt <= startAt) endAt = addDays(endAt, 1);
    intervals.push({ startAt, endAt });
  }

  return intervals;
}

function overlaps(left: CalendarInterval, right: CalendarInterval) {
  return left.startAt < right.endAt && left.endAt > right.startAt;
}

function assertNoInternalOverlap(payload: ScheduleDraftPayload) {
  const sessions = payload.sessions
    .map((session) => ({ startAt: new Date(session.startAt), endAt: new Date(session.endAt) }))
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  for (let index = 1; index < sessions.length; index += 1) {
    if (overlaps(sessions[index - 1]!, sessions[index]!)) {
      throw draftConflict('Draft contains overlapping study sessions');
    }
  }
}

function validateDraftReferences(payload: ScheduleDraftPayload, tasks: Array<{ id: string; subjectId: string | null }>, subjects: Array<{ id: string }>, plans: Array<{ id: string; subjectId: string | null }>) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  for (const session of payload.sessions) {
    const task = taskById.get(session.taskId);
    if (!task) throw serviceError('Draft references an unavailable task', 422);
    if (session.subjectId !== undefined && session.subjectId !== task.subjectId) {
      throw serviceError('Draft session subject does not match its task', 422);
    }
  }

  for (const suggestedTask of payload.suggestedTasks) {
    if (suggestedTask.subjectId && !subjectIds.has(suggestedTask.subjectId)) {
      throw serviceError('Draft references an unavailable subject', 422);
    }
    if (suggestedTask.studyPlanId && !planById.has(suggestedTask.studyPlanId)) {
      throw serviceError('Draft references an unavailable study plan', 422);
    }
    const plan = suggestedTask.studyPlanId ? planById.get(suggestedTask.studyPlanId) : undefined;
    if (plan?.subjectId && suggestedTask.subjectId && plan.subjectId !== suggestedTask.subjectId) {
      throw serviceError('Draft task subject does not match its study plan', 422);
    }
  }
}

async function assertNoCalendarConflicts(
  tx: Prisma.TransactionClient,
  userId: string,
  candidateIntervals: CalendarInterval[],
  options: { excludedEventIds?: string[] } = {},
) {
  if (!candidateIntervals.length) return;
  const rangeStart = new Date(Math.min(...candidateIntervals.map((interval) => interval.startAt.getTime())));
  const rangeEnd = new Date(Math.max(...candidateIntervals.map((interval) => interval.endAt.getTime())));
  const [events, schedules] = await Promise.all([
    tx.event.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(options.excludedEventIds?.length ? { id: { notIn: options.excludedEventIds } } : {}),
        startAt: { lt: rangeEnd },
        OR: [{ endAt: null }, { endAt: { gt: rangeStart } }],
      },
      select: { startAt: true, endAt: true },
    }),
    tx.schedule.findMany({
      where: { userId, deletedAt: null, startDate: { lte: rangeEnd }, OR: [{ endDate: null }, { endDate: { gte: rangeStart } }] },
      select: { dayOfWeek: true, startTime: true, endTime: true, startDate: true, endDate: true, recurrenceRule: true },
    }),
  ]);
  const eventConflict = candidateIntervals.some((candidate) => events.some((event) => event.endAt
    ? overlaps(candidate, { startAt: event.startAt, endAt: event.endAt })
    : event.startAt >= candidate.startAt && event.startAt < candidate.endAt));
  const scheduleIntervalsInRange = schedules.flatMap((schedule) => scheduleIntervals(schedule, rangeStart, rangeEnd));
  if (eventConflict || candidateIntervals.some((candidate) => scheduleIntervalsInRange.some((busy) => overlaps(candidate, busy)))) {
    throw draftConflict('Calendar changed and conflicts with this draft');
  }
}

export async function applyScheduleDraft(userId: string, draftId: string, context?: AuditContext): Promise<ApplyDraftResult> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw serviceError('Draft not found', 404);
    if (draft.status === 'applied') {
      return { draftId: draft.id, status: 'applied', alreadyApplied: true, createdStudyPlanId: null, createdEventIds: [], createdTaskIds: [], updatedEventIds: [] };
    }
    if (draft.status !== 'draft') throw serviceError('Draft is no longer available to apply', 409);
    if (draft.draftType !== 'study_schedule') throw serviceError('Unsupported draft type', 422);

    const payload = parseScheduleDraftPayload(draft.payload);
    assertNoInternalOverlap(payload);
    const taskIds = [...new Set(payload.sessions.map((session) => session.taskId))];
    const requestedSubjectIds = [...new Set([
      ...payload.sessions.map((session) => session.subjectId).filter((id): id is string => Boolean(id)),
      ...payload.suggestedTasks.map((task) => task.subjectId).filter((id): id is string => Boolean(id)),
    ])];
    const planIds = [...new Set(payload.suggestedTasks.map((task) => task.studyPlanId).filter((id): id is string => Boolean(id)))];
    const [tasks, subjects, plans] = await Promise.all([
      taskIds.length ? tx.task.findMany({ where: { id: { in: taskIds }, userId, deletedAt: null }, select: { id: true, subjectId: true } }) : [],
      requestedSubjectIds.length ? tx.subject.findMany({ where: { id: { in: requestedSubjectIds }, userId, deletedAt: null }, select: { id: true } }) : [],
      planIds.length ? tx.studyPlan.findMany({ where: { id: { in: planIds }, userId, deletedAt: null }, select: { id: true, subjectId: true } }) : [],
    ]);
    validateDraftReferences(payload, tasks, subjects, plans);

    const candidateIntervals = payload.sessions.map((session) => ({ startAt: new Date(session.startAt), endAt: new Date(session.endAt) }));
    if (candidateIntervals.length) {
      const rangeStart = new Date(Math.min(...candidateIntervals.map((interval) => interval.startAt.getTime())));
      const rangeEnd = new Date(Math.max(...candidateIntervals.map((interval) => interval.endAt.getTime())));
      const [events, schedules] = await Promise.all([
        tx.event.findMany({
          where: { userId, deletedAt: null, startAt: { lt: rangeEnd }, OR: [{ endAt: null }, { endAt: { gt: rangeStart } }] },
          select: { startAt: true, endAt: true },
        }),
        tx.schedule.findMany({
          where: { userId, deletedAt: null, startDate: { lte: rangeEnd }, OR: [{ endDate: null }, { endDate: { gte: rangeStart } }] },
          select: { dayOfWeek: true, startTime: true, endTime: true, startDate: true, endDate: true, recurrenceRule: true },
        }),
      ]);
      const eventConflict = candidateIntervals.some((candidate) => events.some((event) => event.endAt
        ? overlaps(candidate, { startAt: event.startAt, endAt: event.endAt })
        : event.startAt >= candidate.startAt && event.startAt < candidate.endAt));
      const scheduleIntervalsInRange = schedules.flatMap((schedule) => scheduleIntervals(schedule, rangeStart, rangeEnd));
      if (eventConflict || candidateIntervals.some((candidate) => scheduleIntervalsInRange.some((busy) => overlaps(candidate, busy)))) {
        throw draftConflict('Calendar changed and conflicts with this draft');
      }
    }

    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const createdTasks = await Promise.all(payload.suggestedTasks.map((task) => {
      const plan = task.studyPlanId ? planById.get(task.studyPlanId) : undefined;
      return tx.task.create({
        data: {
          userId,
          title: task.title,
          subjectId: task.subjectId ?? plan?.subjectId ?? null,
          studyPlanId: task.studyPlanId ?? null,
          estimatedMinutes: task.estimatedMinutes ?? null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          priority: task.priority ?? 'medium',
          status: 'todo',
        },
        select: { id: true },
      });
    }));
    const createdEvents = await Promise.all(payload.sessions.map((session) => tx.event.create({
      data: {
        userId,
        title: session.title,
        description: 'Phiên tập trung được áp dụng từ đề xuất AI.',
        startAt: new Date(session.startAt),
        endAt: new Date(session.endAt),
      },
      select: { id: true },
    })));
    await tx.aiPlanDraft.update({ where: { id: draft.id }, data: { status: 'applied', appliedAt: new Date() } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_applied',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { createdEventIds: createdEvents.map((event) => event.id), createdTaskIds: createdTasks.map((task) => task.id) },
      },
    });

    return {
      draftId: draft.id,
      status: 'applied',
      alreadyApplied: false,
      createdStudyPlanId: null,
      createdEventIds: createdEvents.map((event) => event.id),
      createdTaskIds: createdTasks.map((task) => task.id),
      updatedEventIds: [],
    };
  });
}

export async function applyStudyPlanBundleDraft(userId: string, draftId: string, context?: AuditContext): Promise<ApplyDraftResult> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw serviceError('Draft not found', 404);
    if (draft.status === 'applied') {
      return { draftId: draft.id, status: 'applied', alreadyApplied: true, createdStudyPlanId: null, createdEventIds: [], createdTaskIds: [], updatedEventIds: [] };
    }
    if (draft.status !== 'draft') throw serviceError('Draft is no longer available to apply', 409);
    if (draft.draftType !== 'study_plan_bundle') throw serviceError('Unsupported draft type', 422);

    const payload = parseStudyPlanBundlePayload(draft.payload);
    if (payload.plan.subjectId) {
      const subject = await tx.subject.findFirst({ where: { id: payload.plan.subjectId, userId, deletedAt: null } });
      if (!subject) throw serviceError('Draft references an unavailable subject', 422);
    }

    const existingTaskIds = [...new Set(payload.sessions.flatMap((session) => session.existingTaskId ? [session.existingTaskId] : []))];
    const existingTasks = existingTaskIds.length
      ? await tx.task.findMany({ where: { id: { in: existingTaskIds }, userId, deletedAt: null }, select: { id: true, title: true } })
      : [];
    if (existingTasks.length !== existingTaskIds.length) throw serviceError('Draft references an unavailable task', 422);

    const candidateIntervals = payload.sessions.map((session) => ({ startAt: new Date(session.startAt), endAt: new Date(session.endAt) }));
    await assertNoCalendarConflicts(tx, userId, candidateIntervals);

    const plan = await tx.studyPlan.create({
      data: {
        userId,
        subjectId: payload.plan.subjectId ?? null,
        title: payload.plan.title,
        startDate: new Date(`${payload.plan.startDate}T00:00:00.000Z`),
        endDate: new Date(`${payload.plan.endDate}T00:00:00.000Z`),
        targetGoal: payload.plan.targetGoal ?? null,
        estimatedHours: payload.plan.estimatedHours ?? null,
        priority: payload.plan.priority,
      },
      select: { id: true },
    });
    const createdTasks = await Promise.all(payload.tasks.map((task, index) => tx.task.create({
      data: {
        userId,
        studyPlanId: plan.id,
        subjectId: payload.plan.subjectId ?? null,
        title: task.title,
        startDate: new Date(`${payload.plan.startDate}T00:00:00.000Z`),
        dueDate: task.dueDate ? new Date(`${task.dueDate}T23:59:59.999Z`) : null,
        estimatedMinutes: task.estimatedMinutes,
        difficulty: task.difficulty ?? null,
        priority: task.priority,
        status: 'todo',
        sortOrder: index,
      },
      select: { id: true, title: true },
    })));
    const createdTaskByClientId = new Map(payload.tasks.map((task, index) => [task.clientDraftId, createdTasks[index]!]));
    const existingTaskById = new Map(existingTasks.map((task) => [task.id, task]));
    const createdEvents = await Promise.all(payload.sessions.map((session) => {
      const task = session.taskClientDraftId
        ? createdTaskByClientId.get(session.taskClientDraftId)
        : session.existingTaskId
          ? existingTaskById.get(session.existingTaskId)
          : undefined;
      if (!task) throw serviceError('Draft references an unavailable task', 422);
      return tx.event.create({
        data: {
          userId,
          title: session.title ?? task.title,
          description: `Phiên học từ kế hoạch “${payload.plan.title}”.`,
          startAt: new Date(session.startAt),
          endAt: new Date(session.endAt),
        },
        select: { id: true },
      });
    }));
    await tx.aiPlanDraft.update({ where: { id: draft.id }, data: { status: 'applied', appliedAt: new Date() } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_applied',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          createdStudyPlanId: plan.id,
          createdEventIds: createdEvents.map((event) => event.id),
          createdTaskIds: createdTasks.map((task) => task.id),
        },
      },
    });

    return {
      draftId: draft.id,
      status: 'applied',
      alreadyApplied: false,
      createdStudyPlanId: plan.id,
      createdEventIds: createdEvents.map((event) => event.id),
      createdTaskIds: createdTasks.map((task) => task.id),
      updatedEventIds: [],
    };
  });
}

export async function applyRescheduleDraft(userId: string, draftId: string, context?: AuditContext): Promise<ApplyDraftResult> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw serviceError('Draft not found', 404);
    if (draft.status === 'applied') {
      return { draftId: draft.id, status: 'applied', alreadyApplied: true, createdStudyPlanId: null, createdEventIds: [], createdTaskIds: [], updatedEventIds: [] };
    }
    if (draft.status !== 'draft') throw serviceError('Draft is no longer available to apply', 409);
    if (draft.draftType !== 'reschedule') throw serviceError('Unsupported draft type', 422);

    const payload = parseRescheduleDraftPayload(draft.payload);
    const eventIds = payload.moves.map((move) => move.eventId);
    const taskIds = [...new Set(payload.moves.flatMap((move) => move.taskId ? [move.taskId] : []))];
    const [events, tasks] = await Promise.all([
      tx.event.findMany({ where: { id: { in: eventIds }, userId, deletedAt: null }, select: { id: true, startAt: true, endAt: true } }),
      taskIds.length ? tx.task.findMany({ where: { id: { in: taskIds }, userId, deletedAt: null }, select: { id: true } }) : [],
    ]);
    if (events.length !== eventIds.length) throw draftConflict('A calendar event in this draft is no longer available');
    if (tasks.length !== taskIds.length) throw serviceError('Draft references an unavailable task', 422);

    const now = new Date();
    const eventById = new Map(events.map((event) => [event.id, event]));
    for (const move of payload.moves) {
      const event = eventById.get(move.eventId)!;
      if (!event.endAt || event.startAt.getTime() !== new Date(move.fromStartAt).getTime() || event.endAt.getTime() !== new Date(move.fromEndAt).getTime()) {
        throw draftConflict('A calendar event changed after this reschedule draft was created');
      }
      if (event.startAt <= now) {
        throw draftConflict('A session that has already started cannot be moved automatically');
      }
    }

    const candidateIntervals = payload.moves.map((move) => ({ startAt: new Date(move.toStartAt), endAt: new Date(move.toEndAt) }));
    await assertNoCalendarConflicts(tx, userId, candidateIntervals, { excludedEventIds: eventIds });

    const updatedEvents = await Promise.all(payload.moves.map((move) => tx.event.update({
      where: { id: move.eventId },
      data: { startAt: new Date(move.toStartAt), endAt: new Date(move.toEndAt) },
      select: { id: true },
    })));
    await tx.aiPlanDraft.update({ where: { id: draft.id }, data: { status: 'applied', appliedAt: now } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_applied',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { draftType: 'reschedule', updatedEventIds: updatedEvents.map((event) => event.id) },
      },
    });

    return {
      draftId: draft.id,
      status: 'applied',
      alreadyApplied: false,
      createdStudyPlanId: null,
      createdEventIds: [],
      createdTaskIds: [],
      updatedEventIds: updatedEvents.map((event) => event.id),
    };
  });
}

export async function applyGoalDraft(userId: string, draftId: string, context?: AuditContext): Promise<ApplyDraftResult> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.findFirst({ where: { id: draftId, userId } });
    if (!draft) throw serviceError('Draft not found', 404);
    if (draft.status === 'applied') {
      return { draftId: draft.id, status: 'applied', alreadyApplied: true, createdStudyPlanId: null, createdEventIds: [], createdTaskIds: [], updatedEventIds: [] };
    }
    if (draft.status !== 'draft') throw serviceError('Draft is no longer available to apply', 409);
    if (draft.draftType !== 'goal') throw serviceError('Unsupported draft type', 422);

    const payload = parseGoalDraftPayload(draft.payload);
    if (payload.goal.subjectId) {
      const subject = await tx.subject.findFirst({
        where: { id: payload.goal.subjectId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!subject) throw serviceError('Draft references an unavailable subject', 422);
    }

    const goal = await tx.goal.create({
      data: {
        userId,
        subjectId: payload.goal.subjectId ?? null,
        name: payload.goal.name,
        type: payload.goal.type as GoalType,
        targetValue: payload.goal.targetValue,
        deadline: payload.goal.deadline ? new Date(`${payload.goal.deadline}T00:00:00.000Z`) : null,
        status: 'in_progress',
      },
      select: { id: true },
    });
    await tx.aiPlanDraft.update({ where: { id: draft.id }, data: { status: 'applied', appliedAt: new Date() } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_applied',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { draftType: 'goal', createdGoalId: goal.id },
      },
    });

    return {
      draftId: draft.id,
      status: 'applied',
      alreadyApplied: false,
      createdStudyPlanId: null,
      createdEventIds: [],
      createdTaskIds: [],
      updatedEventIds: [],
      createdGoalId: goal.id,
    };
  });
}

export async function applyAiDraft(userId: string, draftId: string, context?: AuditContext): Promise<ApplyDraftResult> {
  const draft = await prisma.aiPlanDraft.findFirst({ where: { id: draftId, userId }, select: { draftType: true } });
  if (!draft) throw serviceError('Draft not found', 404);
  if (draft.draftType === 'study_schedule') return applyScheduleDraft(userId, draftId, context);
  if (draft.draftType === 'study_plan_bundle') return applyStudyPlanBundleDraft(userId, draftId, context);
  if (draft.draftType === 'reschedule') return applyRescheduleDraft(userId, draftId, context);
  if (draft.draftType === 'goal') return applyGoalDraft(userId, draftId, context);
  throw serviceError('Unsupported draft type', 422);
}
