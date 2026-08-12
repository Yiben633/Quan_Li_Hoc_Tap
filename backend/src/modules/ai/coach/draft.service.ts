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

export const scheduleDraftPayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal('study_schedule'),
  title: z.string().trim().min(1).max(200),
  range: z.object({
    startAt: isoDateTimeSchema.optional(),
    endAt: isoDateTimeSchema.optional(),
  }).default({}),
  sessions: z.array(z.object({
    id: z.string().trim().min(1).max(200),
    taskId: z.string().uuid(),
    subjectId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(500),
    startAt: isoDateTimeSchema,
    endAt: isoDateTimeSchema,
    minutes: z.number().int().positive().max(720),
    sequence: z.number().int().positive(),
  })).max(200),
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

export type CreateScheduleDraftInput = {
  payload: unknown;
  conversationId?: string | null;
};

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

export function parseScheduleDraftPayload(payload: unknown): ScheduleDraftPayload {
  let jsonPayload: unknown;

  try {
    jsonPayload = JSON.parse(JSON.stringify(payload));
  } catch {
    throw serviceError('Draft payload must be JSON serializable', 422);
  }

  const parsed = scheduleDraftPayloadSchema.safeParse(jsonPayload);
  if (!parsed.success) throw serviceError('Invalid schedule draft payload', 422);
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
