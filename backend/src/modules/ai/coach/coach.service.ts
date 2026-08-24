import type { Prisma } from '@prisma/client';
import { AIProviderError, aiProvider, aiProviderName, AI_PROVIDER_UNAVAILABLE_MESSAGE, normalizeAIProviderError, type AIProviderCallResult } from '../ai.provider.js';
import { prisma } from '../../../lib/prisma.js';
import { serviceError } from '../../../utils/service-error.js';
import { buildAvailableSlots, type ScheduleBusyInput } from './availabilityEngine.js';
import { buildAnalyticsExplanationPrompt, buildConversationMemoryBlock, buildStudyCoachContextBlock, coachSystemInstruction } from './coachPrompt.js';
import { buildStudyCoachContext } from './coachContext.service.js';
import { buildWeeklyCoachAnalytics, weeklyAnalyticsFallback, type WeeklyCoachAnalytics } from './analytics.service.js';
import { addMessage, createConversation, getConversation } from './conversation.service.js';
import { getConversationMemory } from './conversationMemory.service.js';
import { createGoalDraft, createRescheduleDraft, createScheduleDraft, createStudyPlanBundleDraft } from './draft.service.js';
import { parseCoachIntent } from './intentParser.js';
import type { CoachIntentProviderTelemetry } from './intentParser.js';
import { buildPlan } from './planningEngine.js';
import { sortTasksForPlanning } from './taskScoring.js';
import type { CoachConversationMemory, CoachIntent, ParsedCoachIntent, StudyCoachContext, StudyCoachContextOptions } from './coach.types.js';
import { resolveCoachClarification } from './clarification.js';
import { getStudyPlanningPreference } from './planning-preferences.service.js';
import { reduceCoachContext } from './coachContext.reducer.js';
import { assertAIInputLength, consumeAiDailyRequest } from '../aiCostControl.service.js';

const PLANNING_INTENTS = new Set<CoachIntent>(['create_study_plan', 'create_schedule', 'create_tasks']);
const DEFAULT_PLANNING_DAYS = 7;
const MAX_PLANNING_DAYS = 30;

type AuditContext = {
  ipAddress?: string;
  userAgent?: string;
};

type CoachChatCallbacks = {
  onTextDelta?: (text: string) => void | Promise<void>;
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

export type CoachTaskPriority = {
  type: 'task_priority';
  taskIds: string[];
};

export type CoachFocusProposal = {
  type: 'pomodoro';
  taskId: string;
  subjectId: string | null;
  title: string;
  plannedMinutes: number;
};

export type CoachAnalytics = WeeklyCoachAnalytics & {
  type: 'weekly';
};

export type CoachChatResponse = {
  conversationId: string;
  message: string;
  intent: CoachIntent;
  needsConfirmation: boolean;
  draft: {
    id: string;
    status: string;
  type: 'study_schedule' | 'study_plan_bundle' | 'reschedule' | 'goal';
    title: string;
    range: { startAt?: string; endAt?: string };
    sessions: Array<{ id: string; taskId: string; subjectId: string | null; title: string; startAt: string; endAt: string; minutes: number; sequence: number }>;
    moves?: Array<{ id: string; eventId: string; taskId?: string; title: string; fromStartAt: string; fromEndAt: string; toStartAt: string; toEndAt: string; minutes: number }>;
  warnings: Array<{ code: string; taskId?: string; message: string }>;
  summary: { totalSessions: number; totalMinutes: number; taskCount: number };
  goal?: {
    name: string;
    type: 'score' | 'study_time' | 'task_count' | 'course_completion' | 'gpa';
    targetValue: number;
    subjectId: string | null;
    deadline: string | null;
  };
  } | null;
  suggestions?: CoachChatSuggestion[];
  taskPriority?: CoachTaskPriority;
  focusProposal?: CoachFocusProposal;
  analytics?: CoachAnalytics;
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

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function studyPlanBundleTasks(subject: StudyCoachContext['subjects'][number] | undefined, range: { startAt: Date; endAt: Date }, minutesPerDay: number) {
  const tasks: Array<{ clientDraftId: string; title: string; estimatedMinutes: number; dueDate: string; priority: 'medium' }> = [];
  const startAt = new Date(range.startAt);
  startAt.setUTCHours(0, 0, 0, 0);
  const endAt = new Date(range.endAt);
  endAt.setUTCHours(0, 0, 0, 0);
  const taskLabel = subject ? `Học ${subject.name}` : 'Học theo kế hoạch';

  for (let cursor = startAt, index = 1; cursor <= endAt && tasks.length < 30; cursor = addDays(cursor, 1), index += 1) {
    tasks.push({
      clientDraftId: crypto.randomUUID(),
      title: `${taskLabel} - buổi ${index}`,
      estimatedMinutes: minutesPerDay,
      dueDate: dateOnly(cursor),
      priority: 'medium',
    });
  }

  return tasks;
}

function taskSuggestions(context: StudyCoachContext) {
  return sortTasksForPlanning(context.tasks, new Date(context.now)).slice(0, 3).map((task) => ({
    taskId: task.id,
    title: task.title,
    estimatedMinutes: task.estimatedMinutes,
    dueDate: task.dueDate,
  }));
}

function focusMinutes(intent: ParsedCoachIntent, task: StudyCoachContext['tasks'][number]) {
  const requestedMinutes = intent.constraints?.sessionMinutes;
  const fallbackMinutes = task.estimatedMinutes && task.estimatedMinutes > 0
    ? Math.min(task.estimatedMinutes, 45)
    : 45;
  return Math.min(240, Math.max(5, requestedMinutes ?? fallbackMinutes));
}

function clarifyMessage(intent: ParsedCoachIntent) {
  return intent.missingInformation[0] ?? 'Bạn muốn mình hỗ trợ về công việc, lịch học hay kế hoạch nào?';
}

function buildAnswerPrompt(message: string, context: StudyCoachContext, memory: CoachConversationMemory) {
  return [
    coachSystemInstruction,
    '',
    buildStudyCoachContextBlock(context),
    buildConversationMemoryBlock(memory),
    '',
    '<user_request type="untrusted_input">',
    message,
    '</user_request>',
    '',
    'Answer the question concisely using only the context. Do not claim any database change was made.',
  ].join('\n');
}

function buildPlanningExplanationPrompt(message: string, context: StudyCoachContext, summary: { sessions: number; minutes: number; taskCount: number; warnings: string[] }, memory: CoachConversationMemory) {
  return [
    coachSystemInstruction,
    '',
    buildStudyCoachContextBlock(context),
    buildConversationMemoryBlock(memory),
    '',
    '<user_request type="untrusted_input">',
    message,
    '</user_request>',
    '',
    `<plan_summary sessions="${summary.sessions}" minutes="${summary.minutes}" tasks="${summary.taskCount}">${JSON.stringify(summary.warnings)}</plan_summary>`,
    'Explain this proposed plan in Vietnamese in at most three sentences. Say it is a draft and requires confirmation. Never claim it has been applied.',
  ].join('\n');
}

function isProviderCallResult(value: string | AIProviderCallResult<string>): value is AIProviderCallResult<string> {
  return typeof value === 'object' && value !== null && 'value' in value;
}

async function answerWithProvider(
  userId: string,
  conversationId: string,
  prompt: string,
  onTextDelta?: CoachChatCallbacks['onTextDelta'],
) {
  assertAIInputLength(prompt);
  const startedAt = performance.now();
  try {
    let response: string;
    let usage: AIProviderCallResult<string>['usage'];

    if (onTextDelta && aiProvider.chatStream) {
      let streamedText = '';
      for await (const text of aiProvider.chatStream(prompt)) {
        streamedText += text;
        await onTextDelta(text);
      }
      if (!streamedText.trim()) throw new AIProviderError();
      response = streamedText;
    } else {
      const rawResponse = await (aiProvider.chatWithUsage?.(prompt) ?? aiProvider.chat(prompt));
      response = isProviderCallResult(rawResponse) ? rawResponse.value : rawResponse;
      usage = isProviderCallResult(rawResponse) ? rawResponse.usage : undefined;
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ai.coach_provider_called',
        entityType: 'ai_conversation',
        entityId: conversationId,
        metadata: {
          provider: aiProviderName,
          ...(usage ? {
            model: usage.model,
            ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
            ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
          } : {}),
          latencyMs: Math.round(performance.now() - startedAt),
          success: true,
        },
      },
    });
    return response;
  } catch (error) {
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ai.coach_provider_called',
        entityType: 'ai_conversation',
        entityId: conversationId,
        metadata: { provider: aiProviderName, latencyMs: Math.round(performance.now() - startedAt), success: false },
      },
    });
    throw normalizeAIProviderError(error);
  }
}

async function scheduleSources(userId: string, startAt: Date, endAt: Date, excludedEventIds: string[] = []): Promise<{ events: Array<{ startAt: Date; endAt: Date | null }>; schedules: ScheduleBusyInput[] }> {
  const [events, schedules] = await Promise.all([
    prisma.event.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(excludedEventIds.length ? { id: { notIn: excludedEventIds } } : {}),
        startAt: { lt: endAt },
        OR: [{ endAt: null }, { endAt: { gt: startAt } }],
      },
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

async function buildRescheduleDraft(userId: string, conversationId: string, input: CoachChatInput, context: StudyCoachContext, intent: ParsedCoachIntent, audit?: AuditContext): Promise<{ draft: NonNullable<CoachChatResponse['draft']> | null; message: string }> {
  const eventId = input.context?.eventId;
  if (!eventId) {
    return {
      draft: null,
      message: 'Để dời một phiên đã có, hãy chọn phiên đó từ lịch trước. Mình sẽ chỉ tạo bản nháp thay đổi để bạn xem lại.',
    };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId, deletedAt: null },
    select: { id: true, title: true, startAt: true, endAt: true },
  });
  if (!event) throw serviceError('Event not found', 404);
  if (!event.endAt) return { draft: null, message: 'Phiên này chưa có thời điểm kết thúc nên mình chưa thể đề xuất dời lịch an toàn.' };
  if (event.startAt <= new Date(context.now)) {
    return { draft: null, message: 'Phiên này đã bắt đầu nên mình sẽ không tự động dời. Bạn có thể tạo một phiên mới khi đã sẵn sàng.' };
  }

  const task = input.context?.taskId
    ? await prisma.task.findFirst({ where: { id: input.context.taskId, userId, deletedAt: null }, select: { id: true, title: true, subjectId: true, dueDate: true, priority: true, status: true, startDate: true, difficulty: true } })
    : null;
  const durationMinutes = Math.round((event.endAt.getTime() - event.startAt.getTime()) / 60_000);
  if (durationMinutes <= 0 || durationMinutes > 720) return { draft: null, message: 'Thời lượng của phiên này không hợp lệ để dời lịch.' };

  const range = resolvePlanningRange(intent, new Date(context.now));
  const preferences = await getStudyPlanningPreference(userId);
  const sources = await scheduleSources(userId, range.startAt, range.endAt, [event.id]);
  const slots = buildAvailableSlots({
    range,
    timezone: context.timezone,
    events: sources.events,
    schedules: sources.schedules,
    preferences: {
      studyStartTime: intent.constraints?.preferredStartTime ?? preferences.preferredStudyStart ?? undefined,
      studyEndTime: intent.constraints?.preferredEndTime ?? preferences.preferredStudyEnd ?? undefined,
      studyDays: preferences.preferredDays,
      minimumSlotMinutes: Math.min(durationMinutes, 60),
    },
  });
  const plan = buildPlan({
    now: new Date(context.now),
    tasks: [{
      id: task?.id ?? event.id,
      title: task?.title ?? event.title,
      subjectId: task?.subjectId ?? null,
      startDate: task?.startDate?.toISOString() ?? null,
      dueDate: task?.dueDate?.toISOString() ?? null,
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'in_progress',
      estimatedMinutes: durationMinutes,
    }],
    availableSlots: slots,
    preferences: {
      timezone: preferences.timezone,
      maxSessionMinutes: durationMinutes,
      maxMinutesPerDay: intent.constraints?.maxMinutesPerDay ?? preferences.maxStudyMinutesPerDay,
      breakMinutes: preferences.minBreakMinutes,
    },
  });
  const replacement = plan.sessions.length === 1 && plan.sessions[0]?.minutes === durationMinutes
    ? plan.sessions[0]
    : undefined;
  if (!replacement) {
    return { draft: null, message: 'Mình chưa tìm được khung giờ trống phù hợp để dời phiên này. Hãy mở rộng thời gian học hoặc điều chỉnh lịch hiện có.' };
  }

  const warnings = [...plan.warnings];
  if (task?.dueDate && replacement.endAt > task.dueDate) {
    warnings.push({ code: 'DEADLINE_AT_RISK', taskId: task.id, message: `Phiên “${event.title}” được dời sang sau hạn của công việc liên quan.` });
  }
  const move = {
    id: crypto.randomUUID(),
    eventId: event.id,
    ...(task ? { taskId: task.id } : {}),
    title: event.title,
    fromStartAt: event.startAt.toISOString(),
    fromEndAt: event.endAt.toISOString(),
    toStartAt: replacement.startAt.toISOString(),
    toEndAt: replacement.endAt.toISOString(),
    minutes: durationMinutes,
  };
  const savedDraft = await createRescheduleDraft(userId, {
    conversationId,
    payload: { version: 1, type: 'reschedule', title: `Điều chỉnh lịch: ${event.title}`, moves: [move], warnings },
  }, audit);

  return {
    message: `Mình đã chuẩn bị bản nháp dời “${event.title}”. Phiên hiện tại vẫn chưa thay đổi cho tới khi bạn áp dụng bản nháp.`,
    draft: {
      id: savedDraft.id,
      status: savedDraft.status,
      type: 'reschedule',
      title: `Điều chỉnh lịch: ${event.title}`,
      range: { startAt: event.startAt.toISOString(), endAt: replacement.endAt.toISOString() },
      sessions: [],
      moves: [move],
      warnings,
      summary: { totalSessions: 1, totalMinutes: durationMinutes, taskCount: task ? 1 : 0 },
    },
  };
}

async function logCoachChat(
  userId: string,
  conversationId: string,
  intent: CoachIntent,
  draftId: string | null,
  context: StudyCoachContext,
  intentTelemetry?: CoachIntentProviderTelemetry,
  audit?: AuditContext,
) {
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
        ...(intentTelemetry ? {
          ...(intentTelemetry.usage ? {
            model: intentTelemetry.usage.model,
            ...(intentTelemetry.usage.inputTokens === undefined ? {} : { inputTokens: intentTelemetry.usage.inputTokens }),
            ...(intentTelemetry.usage.outputTokens === undefined ? {} : { outputTokens: intentTelemetry.usage.outputTokens }),
          } : {}),
          providerLatencyMs: intentTelemetry.latencyMs,
        } : {}),
      },
    },
  });
}

export async function chatWithCoach(
  userId: string,
  input: CoachChatInput,
  audit?: AuditContext,
  callbacks?: CoachChatCallbacks,
): Promise<CoachChatResponse> {
  const message = input.message.trim();
  if (!message) throw serviceError('Message content is required', 422);
  assertAIInputLength(message);
  await consumeAiDailyRequest(userId);

  const conversation = input.conversationId
    ? await getConversation(userId, input.conversationId)
    : await createConversation(userId, { title: message.slice(0, 120) }, audit);
  const conversationId = conversation.id;
  await addMessage(userId, conversationId, { role: 'user', content: message }, audit);

  const context = reduceCoachContext(await buildStudyCoachContext(userId, input.context));
  const memory = await getConversationMemory(userId, conversationId);
  let intentTelemetry: CoachIntentProviderTelemetry | undefined;
  const intent = resolveCoachClarification(await parseCoachIntent(message, context, undefined, memory, (telemetry) => {
    intentTelemetry = telemetry;
  }), context);
  let responseMessage: string;
  let draft: CoachChatResponse['draft'] = null;
  let suggestions: CoachChatSuggestion[] | undefined;
  let taskPriority: CoachTaskPriority | undefined;
  let focusProposal: CoachFocusProposal | undefined;
  let analytics: CoachAnalytics | undefined;
  let streamedText = false;
  const emitTextDelta = callbacks?.onTextDelta
    ? async (text: string) => {
      streamedText = true;
      await callbacks.onTextDelta?.(text);
    }
    : undefined;

  if (intent.intent === 'clarify') {
    responseMessage = clarifyMessage(intent);
  } else if (intent.intent === 'reschedule') {
    const reschedule = await buildRescheduleDraft(userId, conversationId, input, context, intent, audit);
    responseMessage = reschedule.message;
    draft = reschedule.draft;
  } else if (intent.intent === 'create_study_plan') {
    const requestedSubjectId = intent.subjectIds[0] ?? (context.subjects.length === 1 ? context.subjects[0]?.id : undefined);
    const subject = requestedSubjectId ? context.subjects.find((item) => item.id === requestedSubjectId) : undefined;
    if (!subject && context.subjects.length > 1) {
      responseMessage = 'Bạn muốn tạo kế hoạch cho môn học nào?';
    } else {
      const planningPreferences = await getStudyPlanningPreference(userId);
      const range = resolvePlanningRange(intent, new Date(context.now));
      const maxMinutesPerDay = intent.constraints?.maxMinutesPerDay ?? planningPreferences.maxStudyMinutesPerDay;
      const draftTasks = studyPlanBundleTasks(subject, range, maxMinutesPerDay);
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
        tasks: draftTasks.map((task) => ({
          id: task.clientDraftId,
          title: task.title,
          subjectId: subject?.id ?? null,
          startDate: range.startAt.toISOString(),
          dueDate: `${task.dueDate}T23:59:59.999Z`,
          priority: task.priority,
          status: 'todo',
          estimatedMinutes: task.estimatedMinutes,
          difficulty: null,
        })),
        availableSlots: slots,
        preferences: {
          timezone: planningPreferences.timezone,
          maxSessionMinutes: intent.constraints?.sessionMinutes ?? planningPreferences.defaultSessionMinutes,
          maxMinutesPerDay,
          breakMinutes: planningPreferences.minBreakMinutes,
        },
      });
      const explanationFallback = plan.sessions.length
        ? `Mình đã chuẩn bị bản nháp kế hoạch gồm ${draftTasks.length} công việc và ${plan.metrics.sessionCount} phiên học. Bạn hãy xem lại trước khi áp dụng.`
        : 'Mình đã tạo bản nháp kế hoạch, nhưng chưa tìm thấy khung giờ trống phù hợp để xếp phiên học.';
      try {
        responseMessage = await answerWithProvider(userId, conversationId, buildPlanningExplanationPrompt(message, context, {
          sessions: plan.metrics.sessionCount,
          minutes: plan.metrics.totalScheduledMinutes,
          taskCount: draftTasks.length,
          warnings: plan.warnings.map((warning) => warning.message),
        }, memory), emitTextDelta);
      } catch {
        responseMessage = `${AI_PROVIDER_UNAVAILABLE_MESSAGE} ${explanationFallback}`;
      }
      const savedDraft = await createStudyPlanBundleDraft(userId, {
        conversationId,
        payload: {
          version: 1,
          type: 'study_plan_bundle',
          title: message.slice(0, 200),
          plan: {
            title: subject ? `Kế hoạch ${subject.name}` : 'Kế hoạch học tập',
            subjectId: subject?.id ?? null,
            startDate: dateOnly(range.startAt),
            endDate: dateOnly(range.endAt),
            estimatedHours: Math.round((draftTasks.length * maxMinutesPerDay / 60) * 100) / 100,
            priority: 'medium',
          },
          tasks: draftTasks,
          sessions: plan.sessions.map((session) => ({
            id: session.id,
            taskClientDraftId: session.taskId,
            title: session.title,
            startAt: session.startAt.toISOString(),
            endAt: session.endAt.toISOString(),
            minutes: session.minutes,
          })),
        },
      }, audit);
      draft = {
        id: savedDraft.id,
        status: savedDraft.status,
        type: 'study_plan_bundle',
        title: message.slice(0, 200),
        range: { startAt: range.startAt.toISOString(), endAt: range.endAt.toISOString() },
        sessions: plan.sessions.map((session) => ({ ...session, startAt: session.startAt.toISOString(), endAt: session.endAt.toISOString() })),
        warnings: plan.warnings,
        summary: {
          totalSessions: plan.metrics.sessionCount,
          totalMinutes: plan.metrics.totalScheduledMinutes,
          taskCount: draftTasks.length,
        },
      };
    }
  } else if (intent.intent === 'create_goal') {
    if (!intent.goal) {
      responseMessage = 'Bạn muốn theo dõi loại mục tiêu nào và giá trị cần đạt là bao nhiêu?';
    } else {
      const subjectId = intent.subjectIds[0] ?? input.context?.subjectId ?? null;
      const deadline = intent.goal.deadline ?? intent.dateRange?.end?.slice(0, 10) ?? null;
      const savedDraft = await createGoalDraft(userId, {
        conversationId,
        payload: {
          version: 1,
          type: 'goal',
          title: intent.goal.name,
          goal: {
            name: intent.goal.name,
            type: intent.goal.type,
            targetValue: intent.goal.targetValue,
            subjectId,
            deadline,
          },
        },
      }, audit);
      draft = {
        id: savedDraft.id,
        status: savedDraft.status,
        type: 'goal',
        title: intent.goal.name,
        range: deadline ? { endAt: `${deadline}T23:59:59.999Z` } : {},
        sessions: [],
        warnings: [],
        summary: { totalSessions: 0, totalMinutes: 0, taskCount: 0 },
        goal: {
          name: intent.goal.name,
          type: intent.goal.type,
          targetValue: intent.goal.targetValue,
          subjectId,
          deadline,
        },
      };
      responseMessage = `Mình đã chuẩn bị bản nháp mục tiêu “${intent.goal.name}”. Bạn hãy xem lại trước khi áp dụng.`;
    }
  } else if (intent.intent === 'analytics') {
    analytics = {
      type: 'weekly',
      ...(await buildWeeklyCoachAnalytics(userId, context, input.context)),
    };
    try {
      responseMessage = await answerWithProvider(userId, conversationId, buildAnalyticsExplanationPrompt(message, analytics, memory), emitTextDelta);
    } catch {
      responseMessage = `${AI_PROVIDER_UNAVAILABLE_MESSAGE} ${weeklyAnalyticsFallback(analytics)}`;
    }
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
        responseMessage = await answerWithProvider(userId, conversationId, buildPlanningExplanationPrompt(message, context, {
          sessions: plan.metrics.sessionCount,
          minutes: plan.metrics.totalScheduledMinutes,
          taskCount: plan.metrics.scheduledTaskCount,
          warnings: plan.warnings.map((warning) => warning.message),
        }, memory), emitTextDelta);
      } catch {
        responseMessage = `${AI_PROVIDER_UNAVAILABLE_MESSAGE} ${explanationFallback}`;
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
        type: 'study_schedule',
        title: message.slice(0, 200),
        range: { startAt: range.startAt.toISOString(), endAt: range.endAt.toISOString() },
        sessions: plan.sessions.map((session) => ({ ...session, startAt: session.startAt.toISOString(), endAt: session.endAt.toISOString() })),
        warnings: plan.warnings,
        summary: {
          totalSessions: plan.metrics.sessionCount,
          totalMinutes: plan.metrics.totalScheduledMinutes,
          taskCount: plan.metrics.scheduledTaskCount,
        },
      };
    }
  } else if (intent.intent === 'start_focus') {
    const task = sortTasksForPlanning(context.tasks, new Date(context.now))[0];
    if (!task) {
      responseMessage = 'Hiện chưa có công việc đang mở để bắt đầu phiên tập trung.';
    } else {
      const plannedMinutes = focusMinutes(intent, task);
      focusProposal = {
        type: 'pomodoro',
        taskId: task.id,
        subjectId: task.subjectId,
        title: task.title,
        plannedMinutes,
      };
      responseMessage = `Mình đề xuất một Pomodoro ${plannedMinutes} phút cho "${task.title}". Bạn có thể bắt đầu khi đã sẵn sàng.`;
    }
  } else if (intent.intent === 'prioritize_tasks') {
    suggestions = taskSuggestions(context);
    taskPriority = { type: 'task_priority', taskIds: suggestions.map((task) => task.taskId) };
    responseMessage = suggestions.length
      ? `Mình đề xuất bắt đầu với "${suggestions[0]!.title}" vì đây là công việc cần ưu tiên trong dữ liệu hiện có.`
      : 'Hiện chưa có công việc đang mở để đề xuất bước tiếp theo.';
  } else {
    try {
      responseMessage = await answerWithProvider(userId, conversationId, buildAnswerPrompt(message, context, memory), emitTextDelta);
    } catch {
      responseMessage = AI_PROVIDER_UNAVAILABLE_MESSAGE;
    }
  }

  if (emitTextDelta && !streamedText) await emitTextDelta(responseMessage);

  await addMessage(userId, conversationId, {
    role: 'assistant',
    content: responseMessage,
    metadata: {
      intent: intent.intent,
      ...(draft ? { draftId: draft.id } : {}),
      ...(taskPriority ? { taskPriority } : {}),
      ...(focusProposal ? { focusProposal } : {}),
      ...(analytics ? { analytics } : {}),
      provider: aiProviderName,
    } as Prisma.InputJsonValue,
  }, audit);
  await logCoachChat(userId, conversationId, intent.intent, draft?.id ?? null, context, intentTelemetry, audit);

  return {
    conversationId,
    message: responseMessage,
    intent: intent.intent,
    needsConfirmation: draft !== null,
    draft,
    ...(suggestions ? { suggestions } : {}),
    ...(taskPriority ? { taskPriority } : {}),
    ...(focusProposal ? { focusProposal } : {}),
    ...(analytics ? { analytics } : {}),
    provider: aiProviderName,
  };
}
