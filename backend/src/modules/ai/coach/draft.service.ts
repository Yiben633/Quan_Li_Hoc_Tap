import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';

const warningCodeSchema = z.enum([
  'INSUFFICIENT_TIME',
  'NO_AVAILABLE_SLOT',
  'DEADLINE_AT_RISK',
  'DAILY_LIMIT_EXCEEDED',
  'MISSING_ESTIMATE',
]);

const isoDateTimeSchema = z.string().datetime({ offset: true });
const dateOnlySchema = z.string().date();
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const scheduleDraftSessionSchema = z.object({
  id: z.string().trim().min(1).max(200),
  taskId: z.string().uuid(),
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(500),
  startAt: isoDateTimeSchema,
  endAt: isoDateTimeSchema,
  minutes: z.number().int().positive().max(720),
  sequence: z.number().int().positive(),
});

export const scheduleDraftPayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal('study_schedule'),
  title: z.string().trim().min(1).max(200),
  range: z.object({
    startAt: isoDateTimeSchema.optional(),
    endAt: isoDateTimeSchema.optional(),
  }).default({}),
  sessions: z.array(scheduleDraftSessionSchema).max(200),
  suggestedTasks: z.array(z.object({
    title: z.string().trim().min(1).max(500),
    subjectId: z.string().uuid().nullable().optional(),
    studyPlanId: z.string().uuid().nullable().optional(),
    estimatedMinutes: z.number().int().positive().max(720).optional(),
    dueDate: isoDateTimeSchema.nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  })).max(100),
  warnings: z.array(z.object({
    code: warningCodeSchema,
    taskId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(500),
  })).max(100),
  metrics: z.object({
    taskCount: z.number().int().nonnegative().optional(),
    scheduledTaskCount: z.number().int().nonnegative().optional(),
    sessionCount: z.number().int().nonnegative().optional(),
    totalRequestedMinutes: z.number().int().nonnegative().optional(),
    totalScheduledMinutes: z.number().int().nonnegative().optional(),
    totalUnallocatedMinutes: z.number().int().nonnegative().optional(),
  }).default({}),
}).superRefine((payload, context) => {
  for (const [index, session] of payload.sessions.entries()) {
    if (new Date(session.endAt) <= new Date(session.startAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sessions', index, 'endAt'],
        message: 'Session endAt must be after startAt',
      });
    }
  }

  if (payload.range.startAt && payload.range.endAt && new Date(payload.range.endAt) < new Date(payload.range.startAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['range', 'endAt'],
      message: 'Range endAt must not be before startAt',
    });
  }
});

export type ScheduleDraftPayload = z.infer<typeof scheduleDraftPayloadSchema>;

const rescheduleMoveSchema = z.object({
  id: z.string().trim().min(1).max(200),
  eventId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(500),
  fromStartAt: isoDateTimeSchema,
  fromEndAt: isoDateTimeSchema,
  toStartAt: isoDateTimeSchema,
  toEndAt: isoDateTimeSchema,
  minutes: z.number().int().positive().max(720),
});

export const rescheduleDraftPayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal('reschedule'),
  title: z.string().trim().min(1).max(200),
  moves: z.array(rescheduleMoveSchema).min(1).max(100),
  warnings: z.array(z.object({
    code: warningCodeSchema,
    taskId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(500),
  })).max(100).default([]),
}).superRefine((payload, context) => {
  const eventIds = new Set<string>();
  const moveIds = new Set<string>();
  const destinations = [...payload.moves].sort((left, right) => new Date(left.toStartAt).getTime() - new Date(right.toStartAt).getTime());

  for (const [index, move] of payload.moves.entries()) {
    const fromStart = new Date(move.fromStartAt);
    const fromEnd = new Date(move.fromEndAt);
    const toStart = new Date(move.toStartAt);
    const toEnd = new Date(move.toEndAt);
    if (eventIds.has(move.eventId)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['moves', index, 'eventId'], message: 'Each event can only be moved once' });
    if (moveIds.has(move.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['moves', index, 'id'], message: 'Move ids must be unique' });
    eventIds.add(move.eventId);
    moveIds.add(move.id);
    if (fromEnd <= fromStart || toEnd <= toStart) context.addIssue({ code: z.ZodIssueCode.custom, path: ['moves', index], message: 'Move time ranges must be valid' });
    if ((fromEnd.getTime() - fromStart.getTime()) / 60_000 !== move.minutes || (toEnd.getTime() - toStart.getTime()) / 60_000 !== move.minutes) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['moves', index, 'minutes'], message: 'Move duration must stay unchanged' });
    }
  }

  for (let index = 1; index < destinations.length; index += 1) {
    const previous = destinations[index - 1]!;
    const current = destinations[index]!;
    if (new Date(current.toStartAt) < new Date(previous.toEndAt)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['moves'], message: 'Moved events must not overlap' });
      break;
    }
  }
});

export type RescheduleDraftPayload = z.infer<typeof rescheduleDraftPayloadSchema>;

const goalTypeSchema = z.enum(['score', 'study_time', 'task_count', 'course_completion', 'gpa']);

export const goalDraftPayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal('goal'),
  title: z.string().trim().min(1).max(200),
  goal: z.object({
    name: z.string().trim().min(1).max(200),
    type: goalTypeSchema,
    targetValue: z.number().positive().max(1_000_000_000),
    subjectId: z.string().uuid().nullable().optional(),
    deadline: dateOnlySchema.nullable().optional(),
  }).strict(),
}).strict();

export type GoalDraftPayload = z.infer<typeof goalDraftPayloadSchema>;

const studyPlanBundleTaskSchema = z.object({
  clientDraftId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  estimatedMinutes: z.number().int().positive().max(100_000),
  dueDate: dateOnlySchema.optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  priority: prioritySchema.default('medium'),
});

const studyPlanBundleSessionSchema = z.object({
  id: z.string().trim().min(1).max(200),
  taskClientDraftId: z.string().trim().min(1).max(200).optional(),
  existingTaskId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(500).optional(),
  startAt: isoDateTimeSchema,
  endAt: isoDateTimeSchema,
  minutes: z.number().int().positive().max(720),
}).superRefine((session, context) => {
  if (Boolean(session.taskClientDraftId) === Boolean(session.existingTaskId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['taskClientDraftId'],
      message: 'A session must reference exactly one draft or existing task',
    });
  }
});

export const studyPlanBundlePayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal('study_plan_bundle'),
  title: z.string().trim().min(1).max(200),
  plan: z.object({
    title: z.string().trim().min(1).max(200),
    subjectId: z.string().uuid().nullable().optional(),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    targetGoal: z.string().trim().min(1).max(500).nullable().optional(),
    estimatedHours: z.number().min(0).max(100_000).nullable().optional(),
    priority: prioritySchema.default('medium'),
  }),
  tasks: z.array(studyPlanBundleTaskSchema).min(1).max(100),
  sessions: z.array(studyPlanBundleSessionSchema).max(200),
}).superRefine((payload, context) => {
  if (payload.plan.endDate < payload.plan.startDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['plan', 'endDate'], message: 'Plan end date must not be before its start date' });
  }

  const taskIds = new Set<string>();
  for (const [index, task] of payload.tasks.entries()) {
    if (taskIds.has(task.clientDraftId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['tasks', index, 'clientDraftId'], message: 'clientDraftId must be unique' });
    }
    taskIds.add(task.clientDraftId);
  }

  const sessionIds = new Set<string>();
  const sessions = [...payload.sessions].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
  const planStart = new Date(`${payload.plan.startDate}T00:00:00.000Z`);
  const planEnd = new Date(`${payload.plan.endDate}T23:59:59.999Z`);
  for (const [index, session] of sessions.entries()) {
    const startAt = new Date(session.startAt);
    const endAt = new Date(session.endAt);
    if (sessionIds.has(session.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'id'], message: 'Session id must be unique' });
    sessionIds.add(session.id);
    if (session.taskClientDraftId && !taskIds.has(session.taskClientDraftId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'taskClientDraftId'], message: 'Session references an unknown draft task' });
    }
    if (endAt <= startAt) context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'endAt'], message: 'Session endAt must be after startAt' });
    if ((endAt.getTime() - startAt.getTime()) / 60_000 !== session.minutes) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'minutes'], message: 'Session duration must match its minutes' });
    }
    if (startAt < planStart || endAt > planEnd) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'startAt'], message: 'Session must be inside the plan date range' });
    }
    const previous = sessions[index - 1];
    if (previous && startAt < new Date(previous.endAt)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions', index, 'startAt'], message: 'Sessions must not overlap' });
    }
  }
});

export type StudyPlanBundlePayload = z.infer<typeof studyPlanBundlePayloadSchema>;

export const updateScheduleDraftSchema = z.object({
  sessions: z.array(scheduleDraftSessionSchema).max(200),
}).strict();

export type CreateScheduleDraftInput = {
  payload: unknown;
  conversationId?: string | null;
};

export type CreateStudyPlanBundleDraftInput = CreateScheduleDraftInput;
export type CreateRescheduleDraftInput = CreateScheduleDraftInput;
export type CreateGoalDraftInput = CreateScheduleDraftInput;

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type ScheduleDraftView = {
  id: string;
  status: string;
  title: string;
  range: ScheduleDraftPayload['range'];
  sessions: ScheduleDraftPayload['sessions'];
  warnings: ScheduleDraftPayload['warnings'];
  summary: {
    totalSessions: number;
    totalMinutes: number;
    taskCount: number;
  };
};

function validateSessionTiming(payload: ScheduleDraftPayload) {
  const sessions = [...payload.sessions].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());

  for (const [index, session] of sessions.entries()) {
    const startAt = new Date(session.startAt);
    const endAt = new Date(session.endAt);
    const actualMinutes = (endAt.getTime() - startAt.getTime()) / 60_000;

    if (actualMinutes !== session.minutes) {
      throw serviceError(`Session ${index + 1} duration must match its minutes`, 422);
    }
    if (payload.range.startAt && startAt < new Date(payload.range.startAt)) {
      throw serviceError(`Session ${index + 1} starts outside the draft range`, 422);
    }
    if (payload.range.endAt && endAt > new Date(payload.range.endAt)) {
      throw serviceError(`Session ${index + 1} ends outside the draft range`, 422);
    }
    const previous = sessions[index - 1];
    if (previous && startAt < new Date(previous.endAt)) {
      throw serviceError('Draft contains overlapping study sessions', 422);
    }
  }
}

function toScheduleDraftView(draft: { id: string; status: string; payload: unknown }): ScheduleDraftView {
  const payload = parseScheduleDraftPayload(draft.payload);
  return {
    id: draft.id,
    status: draft.status,
    title: payload.title,
    range: payload.range,
    sessions: payload.sessions,
    warnings: payload.warnings,
    summary: {
      totalSessions: payload.sessions.length,
      totalMinutes: payload.sessions.reduce((total, session) => total + session.minutes, 0),
      taskCount: new Set(payload.sessions.map((session) => session.taskId)).size,
    },
  };
}

export function parseScheduleDraftPayload(payload: unknown): ScheduleDraftPayload {
  let jsonPayload: unknown;

  try {
    jsonPayload = JSON.parse(JSON.stringify(payload));
  } catch {
    throw serviceError('Draft payload must be JSON serializable', 422);
  }

  const parsed = scheduleDraftPayloadSchema.safeParse(jsonPayload);
  if (!parsed.success) throw serviceError('Invalid schedule draft payload', 422);
  validateSessionTiming(parsed.data);
  return parsed.data;
}

export function parseStudyPlanBundlePayload(payload: unknown): StudyPlanBundlePayload {
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(JSON.stringify(payload));
  } catch {
    throw serviceError('Draft payload must be JSON serializable', 422);
  }
  const parsed = studyPlanBundlePayloadSchema.safeParse(jsonPayload);
  if (!parsed.success) throw serviceError('Invalid study plan bundle payload', 422);
  return parsed.data;
}

export function parseRescheduleDraftPayload(payload: unknown): RescheduleDraftPayload {
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(JSON.stringify(payload));
  } catch {
    throw serviceError('Draft payload must be JSON serializable', 422);
  }
  const parsed = rescheduleDraftPayloadSchema.safeParse(jsonPayload);
  if (!parsed.success) throw serviceError('Invalid reschedule draft payload', 422);
  return parsed.data;
}

export function parseGoalDraftPayload(payload: unknown): GoalDraftPayload {
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(JSON.stringify(payload));
  } catch {
    throw serviceError('Draft payload must be JSON serializable', 422);
  }

  const parsed = goalDraftPayloadSchema.safeParse(jsonPayload);
  if (!parsed.success) throw serviceError('Invalid goal draft payload', 422);
  return parsed.data;
}

async function ensureOwnedConversation(userId: string, conversationId: string) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conversation) throw serviceError('Conversation not found', 404);
}

async function ownedDraft(userId: string, draftId: string) {
  const draft = await prisma.aiPlanDraft.findFirst({ where: { id: draftId, userId } });
  if (!draft) throw serviceError('Draft not found', 404);
  return draft;
}

export async function createScheduleDraft(userId: string, input: CreateScheduleDraftInput, context?: AuditContext) {
  const payload = parseScheduleDraftPayload(input.payload);
  const conversationId = input.conversationId ?? null;
  if (conversationId) await ensureOwnedConversation(userId, conversationId);

  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.create({
      data: {
        userId,
        conversationId,
        draftType: payload.type,
        status: 'draft',
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_created',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          version: payload.version,
          draftType: payload.type,
          sessionCount: payload.sessions.length,
          suggestedTaskCount: payload.suggestedTasks.length,
        },
      },
    });
    return draft;
  });
}

export async function createStudyPlanBundleDraft(userId: string, input: CreateStudyPlanBundleDraftInput, context?: AuditContext) {
  const payload = parseStudyPlanBundlePayload(input.payload);
  const conversationId = input.conversationId ?? null;
  if (conversationId) await ensureOwnedConversation(userId, conversationId);

  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.create({
      data: {
        userId,
        conversationId,
        draftType: payload.type,
        status: 'draft',
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_created',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          version: payload.version,
          draftType: payload.type,
          taskCount: payload.tasks.length,
          sessionCount: payload.sessions.length,
        },
      },
    });
    return draft;
  });
}

export async function createRescheduleDraft(userId: string, input: CreateRescheduleDraftInput, context?: AuditContext) {
  const payload = parseRescheduleDraftPayload(input.payload);
  const conversationId = input.conversationId ?? null;
  if (conversationId) await ensureOwnedConversation(userId, conversationId);

  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.create({
      data: {
        userId,
        conversationId,
        draftType: payload.type,
        status: 'draft',
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_created',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: { version: payload.version, draftType: payload.type, moveCount: payload.moves.length },
      },
    });
    return draft;
  });
}

export async function createGoalDraft(userId: string, input: CreateGoalDraftInput, context?: AuditContext) {
  const payload = parseGoalDraftPayload(input.payload);
  const conversationId = input.conversationId ?? null;
  if (conversationId) await ensureOwnedConversation(userId, conversationId);

  return prisma.$transaction(async (tx) => {
    const draft = await tx.aiPlanDraft.create({
      data: {
        userId,
        conversationId,
        draftType: payload.type,
        status: 'draft',
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_created',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          version: payload.version,
          draftType: payload.type,
          goalType: payload.goal.type,
          subjectId: payload.goal.subjectId ?? null,
        },
      },
    });
    return draft;
  });
}

export async function getDraft(userId: string, draftId: string) {
  return ownedDraft(userId, draftId);
}

export async function discardDraft(userId: string, draftId: string, context?: AuditContext) {
  const draft = await ownedDraft(userId, draftId);
  if (draft.status === 'applied') throw serviceError('Applied drafts are immutable', 409);
  if (draft.status === 'expired') throw serviceError('Expired draft cannot be discarded', 409);
  if (draft.status === 'discarded') return draft;

  return prisma.$transaction(async (tx) => {
    const discardedDraft = await tx.aiPlanDraft.update({
      where: { id: draft.id },
      data: { status: 'discarded' },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_discarded',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });
    return discardedDraft;
  });
}

export async function updateScheduleDraft(userId: string, draftId: string, input: unknown, context?: AuditContext): Promise<ScheduleDraftView> {
  const updates = updateScheduleDraftSchema.safeParse(input);
  if (!updates.success) throw serviceError('Invalid draft session updates', 422);

  const draft = await ownedDraft(userId, draftId);
  if (draft.status !== 'draft') throw serviceError('Only active drafts can be adjusted', 409);
  if (draft.draftType !== 'study_schedule') throw serviceError('Unsupported draft type', 422);

  const currentPayload = parseScheduleDraftPayload(draft.payload);
  const payload = parseScheduleDraftPayload({ ...currentPayload, sessions: updates.data.sessions });

  return prisma.$transaction(async (tx) => {
    const updatedDraft = await tx.aiPlanDraft.update({
      where: { id: draft.id },
      data: { payload: payload as unknown as Prisma.InputJsonValue },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'ai.draft_updated',
        entityType: 'ai_plan_draft',
        entityId: draft.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          sessionCount: payload.sessions.length,
          totalMinutes: payload.sessions.reduce((total, session) => total + session.minutes, 0),
        },
      },
    });
    return toScheduleDraftView(updatedDraft);
  });
}
