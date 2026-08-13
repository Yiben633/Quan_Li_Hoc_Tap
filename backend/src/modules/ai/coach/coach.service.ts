import type { Prisma } from '@prisma/client';
import { aiProvider, aiProviderName } from '../ai.provider.js';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';
import { buildAvailableSlots, type ScheduleBusyInput } from './availabilityEngine.js';
import { buildStudyCoachContextBlock, coachSystemInstruction } from './coachPrompt.js';
import { buildStudyCoachContext } from './coachContext.service.js';
import { addMessage, createConversation, getConversation } from './conversation.service.js';
import { createScheduleDraft } from './draft.service.js';
import { parseCoachIntent } from './intentParser.js';
import { buildPlan } from './planningEngine.js';
import { sortTasksForPlanning } from './taskScoring.js';
import type { CoachIntent, ParsedCoachIntent, StudyCoachContext, StudyCoachContextOptions } from './coach.types.js';
import { resolveCoachClarification } from './clarification.js';
import { getStudyPlanningPreference } from './planning-preferences.service.js';

const PLANNING_INTENTS = new Set<CoachIntent>(['create_study_plan', 'create_schedule', 'reschedule', 'create_tasks']);
const DEFAULT_PLANNING_DAYS = 7;
const MAX_PLANNING_DAYS = 30;

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type CoachChatInput = {
  conversationId?: string;
  message: string;
  context?: StudyCoachContextOptions;
};

export type CoachChatSuggestion = {
  taskId: string;
  title: string;
  estimatedMinutes: number | null;
  dueDate: string | null;
};

export type CoachChatResponse = {
  conversationId: string;
  message: string;
  intent: CoachIntent;
  needsConfirmation: boolean;
  draft: {
    id: string;
    status: string;
    title: string;
    sessions: Array<{ id: string; taskId: string; subjectId: string | null; title: string; startAt: string; endAt: string; minutes: number; sequence: number }>;
    warnings: Array<{ code: string; taskId?: string; message: string }>;
    summary: { totalSessions: number; totalMinutes: number; taskCount: number };
  } | null;
  suggestions?: CoachChatSuggestion[];
  provider: typeof aiProviderName;
};

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function resolvePlanningRange(intent: ParsedCoachIntent, now: Date) {
  const requestedStart = intent.dateRange?.start ? new Date(intent.dateRange.start) : null;
  const requestedEnd = intent.dateRange?.end ? new Date(intent.dateRange.end) : null;
  const startAt = requestedStart && requestedStart > now ? requestedStart : now;
  const defaultEnd = addDays(startAt, DEFAULT_PLANNING_DAYS);
  const maxEnd = addDays(startAt, MAX_PLANNING_DAYS);
  const endAt = requestedEnd && requestedEnd > startAt ? (requestedEnd < maxEnd ? requestedEnd : maxEnd) : defaultEnd;
  return { startAt, endAt };
}

function selectPlanningTasks(context: StudyCoachContext, intent: ParsedCoachIntent) {
  const requestedTaskIds = new Set(intent.taskIds);
  const requestedSubjectIds = new Set(intent.subjectIds);
  return context.tasks.filter((task) => {
    if (requestedTaskIds.size > 0) return requestedTaskIds.has(task.id);
    if (requestedSubjectIds.size > 0) return task.subjectId !== null && requestedSubjectIds.has(task.subjectId);
    return true;
  });
}

function taskSuggestions(context: StudyCoachContext) {
  return sortTasksForPlanning(context.tasks, new Date(context.now)).slice(0, 3).map((task) => ({
    taskId: task.id,
    title: task.title,
    estimatedMinutes: task.estimatedMinutes,
    dueDate: task.dueDate,
  }));
}

function clarifyMessage(intent: ParsedCoachIntent) {
  return intent.missingInformation[0] ?? 'Bạn muốn mình hỗ trợ về công việc, lịch học hay kế hoạch nào?';
}

function buildAnswerPrompt(message: string, context: StudyCoachContext) {
  return [
    coachSystemInstruction,
    '',
    buildStudyCoachContextBlock(context),
    '',
    '<user_request type="untrusted_input">',
    message,
    '</user_request>',
    '',
    'Answer the question concisely using only the context. Do not claim any database change was made.',
  ].join('\n');
}

function buildPlanningExplanationPrompt(message: string, context: StudyCoachContext, summary: { sessions: number; minutes: number; taskCount: number; warnings: string[] }) {
  return [
    coachSystemInstruction,
    '',
    buildStudyCoachContextBlock(context),
    '',
    '<user_request type="untrusted_input">',
    message,
    '</user_request>',
    '',
    `<plan_summary sessions="${summary.sessions}" minutes="${summary.minutes}" tasks="${summary.taskCount}">${JSON.stringify(summary.warnings)}</plan_summary>`,
    'Explain this proposed plan in Vietnamese in at most three sentences. Say it is a draft and requires confirmation. Never claim it has been applied.',
  ].join('\n');
}

async function scheduleSources(userId: string, startAt: Date, endAt: Date): Promise<{ events: Array<{ startAt: Date; endAt: Date | null }>; schedules: ScheduleBusyInput[] }> {
  const [events, schedules] = await Promise.all([
    prisma.event.findMany({
      where: { userId, deletedAt: null, startAt: { lt: endAt }, OR: [{ endAt: null }, { endAt: { gt: startAt } }] },
      select: { startAt: true, endAt: true },
    }),
    prisma.schedule.findMany({
      where: { userId, deletedAt: null, startDate: { lte: endAt }, OR: [{ endDate: null }, { endDate: { gte: startAt } }] },
      select: { startDate: true, endDate: true, startTime: true, endTime: true, dayOfWeek: true, recurrenceRule: true },
    }),
  ]);

  return {
    events,
    schedules: schedules.map((schedule) => ({
      ...schedule,
      recurrenceRule: schedule.recurrenceRule as ScheduleBusyInput['recurrenceRule'],
    })),
  };
}

async function logCoachChat(userId: string, conversationId: string, intent: CoachIntent, draftId: string | null, context: StudyCoachContext, audit?: AuditContext) {
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'ai.coach_chat',
      entityType: 'ai_conversation',
      entityId: conversationId,
      ipAddress: audit?.ipAddress,
      userAgent: audit?.userAgent,
      metadata: {
        intent,
        draftId,
        provider: aiProviderName,
        taskCount: context.tasks.length,
      },
    },
  });
}

export async function chatWithCoach(userId: string, input: CoachChatInput, audit?: AuditContext): Promise<CoachChatResponse> {
  const message = input.message.trim();
  if (!message) throw serviceError('Message content is required', 422);

  const conversation = input.conversationId
    ? await getConversation(userId, input.conversationId)
    : await createConversation(userId, { title: message.slice(0, 120) }, audit);
  const conversationId = conversation.id;
  await addMessage(userId, conversationId, { role: 'user', content: message }, audit);

  const context = await buildStudyCoachContext(userId, input.context);
  const intent = resolveCoachClarification(await parseCoachIntent(message, context), context);
  let responseMessage: string;
  let draft: CoachChatResponse['draft'] = null;
  let suggestions: CoachChatSuggestion[] | undefined;

  if (intent.intent === 'clarify') {
    responseMessage = clarifyMessage(intent);
  } else if (PLANNING_INTENTS.has(intent.intent)) {
    const tasks = selectPlanningTasks(context, intent);
    if (tasks.length === 0) {
      responseMessage = 'Mình chưa tìm thấy công việc phù hợp để lập lịch. Bạn hãy chọn môn học hoặc tạo công việc trước nhé.';
    } else {
      const planningPreferences = await getStudyPlanningPreference(userId);
      const range = resolvePlanningRange(intent, new Date(context.now));
      const sources = await scheduleSources(userId, range.startAt, range.endAt);
      const slots = buildAvailableSlots({
        range,
        timezone: context.timezone,
        events: sources.events,
        schedules: sources.schedules,
        preferences: {
          studyStartTime: intent.constraints?.preferredStartTime ?? planningPreferences.preferredStudyStart ?? undefined,
          studyEndTime: intent.constraints?.preferredEndTime ?? planningPreferences.preferredStudyEnd ?? undefined,
          studyDays: intent.constraints?.excludeDays
            ? planningPreferences.preferredDays.filter((day) => !intent.constraints?.excludeDays?.includes(day))
            : planningPreferences.preferredDays,
          minimumSlotMinutes: Math.min(intent.constraints?.sessionMinutes ?? planningPreferences.defaultSessionMinutes, 60),
        },
      });
      const plan = buildPlan({
        now: new Date(context.now),
        tasks,
        availableSlots: slots,
        preferences: {
          timezone: planningPreferences.timezone,
          maxSessionMinutes: intent.constraints?.sessionMinutes ?? planningPreferences.defaultSessionMinutes,
          maxMinutesPerDay: intent.constraints?.maxMinutesPerDay ?? planningPreferences.maxStudyMinutesPerDay,
          breakMinutes: planningPreferences.minBreakMinutes,
        },
      });
      const explanationFallback = plan.sessions.length
        ? `Mình đã chuẩn bị một bản nháp gồm ${plan.metrics.sessionCount} phiên trong ${plan.metrics.totalScheduledMinutes} phút. Bạn hãy xem lại và xác nhận trước khi áp dụng.`
        : 'Mình chưa thể xếp phiên học từ các khung giờ hiện có. Hãy thêm thời gian rảnh hoặc điều chỉnh giới hạn mỗi ngày.';
      try {
        responseMessage = await aiProvider.chat(buildPlanningExplanationPrompt(message, context, {
          sessions: plan.metrics.sessionCount,
          minutes: plan.metrics.totalScheduledMinutes,
          taskCount: plan.metrics.scheduledTaskCount,
          warnings: plan.warnings.map((warning) => warning.message),
        }));
      } catch {
        responseMessage = explanationFallback;
      }
      const savedDraft = await createScheduleDraft(userId, {
        conversationId,
        payload: {
          version: 1,
          type: 'study_schedule',
          title: message.slice(0, 200),
          range: { startAt: range.startAt.toISOString(), endAt: range.endAt.toISOString() },
          sessions: plan.sessions.map((session) => ({ ...session, startAt: session.startAt.toISOString(), endAt: session.endAt.toISOString() })),
          suggestedTasks: [],
          warnings: plan.warnings,
          metrics: plan.metrics,
        },
      }, audit);
      draft = {
        id: savedDraft.id,
        status: savedDraft.status,
        title: message.slice(0, 200),
        sessions: plan.sessions.map((session) => ({ ...session, startAt: session.startAt.toISOString(), endAt: session.endAt.toISOString() })),
        warnings: plan.warnings,
        summary: {
          totalSessions: plan.metrics.sessionCount,
          totalMinutes: plan.metrics.totalScheduledMinutes,
          taskCount: plan.metrics.scheduledTaskCount,
        },
      };
    }
  } else if (intent.intent === 'prioritize_tasks' || intent.intent === 'start_focus') {
    suggestions = taskSuggestions(context);
    responseMessage = suggestions.length
      ? `Mình đề xuất bắt đầu với "${suggestions[0]!.title}" vì đây là công việc cần ưu tiên trong dữ liệu hiện có.`
      : 'Hiện chưa có công việc đang mở để đề xuất bước tiếp theo.';
  } else {
    try {
      responseMessage = await aiProvider.chat(buildAnswerPrompt(message, context));
    } catch {
      responseMessage = 'Mình chưa thể tạo câu trả lời ngay lúc này. Bạn hãy thử lại sau ít phút nhé.';
    }
  }

  await addMessage(userId, conversationId, {
    role: 'assistant',
    content: responseMessage,
    metadata: {
      intent: intent.intent,
      ...(draft ? { draftId: draft.id } : {}),
      provider: aiProviderName,
    } as Prisma.InputJsonValue,
  }, audit);
  await logCoachChat(userId, conversationId, intent.intent, draft?.id ?? null, context, audit);

  return {
    conversationId,
    message: responseMessage,
    intent: intent.intent,
    needsConfirmation: draft !== null,
    draft,
    ...(suggestions ? { suggestions } : {}),
    provider: aiProviderName,
  };
}
