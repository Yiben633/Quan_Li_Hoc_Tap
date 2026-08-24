import { prisma } from '../../lib/prisma.js';
import { aiProvider, aiProviderName, normalizeAIProviderError, type AIProviderCallResult } from './ai.provider.js';
import { buildPlan } from './coach/planningEngine.js';
import { assertAIInputLength, consumeAiDailyRequest } from './aiCostControl.service.js';

type Slot = { startAt: Date; endAt: Date };
type TaskInput = { id?: string; title: string; estimatedMinutes: number; dueDate?: Date | null };

async function log(userId: string, action: string, metadata: object) { await prisma.activityLog.create({ data: { userId, action, metadata } }); }

export async function suggestSchedule(userId: string, tasks: TaskInput[], slots: Slot[]) {
  const legacyTaskIds = new Map<string, string | undefined>();
  const plan = buildPlan({
    tasks: tasks.map((task, index) => {
      const id = task.id ?? `legacy-task-${index}`;
      legacyTaskIds.set(id, task.id);
      return {
        id,
        title: task.title,
        status: 'todo',
        priority: 'medium',
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
      };
    }),
    availableSlots: slots.map((slot) => ({
      ...slot,
      durationMinutes: Math.max(0, Math.floor((slot.endAt.getTime() - slot.startAt.getTime()) / 60_000)),
    })),
  });
  const incompleteTaskIds = new Set(plan.unallocatedTasks.map((task) => task.taskId));
  const assignments = plan.sessions
    // The legacy endpoint used all-or-nothing assignments. Keep that contract
    // while the Coach flow can show partial sessions and structured warnings.
    .filter((session) => !incompleteTaskIds.has(session.taskId))
    .map((session) => ({
      taskId: legacyTaskIds.get(session.taskId),
      title: session.title,
      startAt: session.startAt,
      endAt: session.endAt,
    }));
  const warnings = plan.warnings;
  const totalAssignedMinutes = assignments.reduce((sum, assignment) => sum + (assignment.endAt.getTime() - assignment.startAt.getTime()) / 60_000, 0);

  await log(userId, 'ai.schedule_suggested', {
    taskCount: tasks.length,
    assignedCount: assignments.length,
    sessionCount: plan.sessions.length,
    unallocatedTaskCount: plan.unallocatedTasks.length,
  });
  return {
    assignments,
    warnings,
    warningMessages: warnings.map((warning) => warning.message),
    totalRequestedMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    totalAssignedMinutes,
  };
}
export async function reschedule(userId: string, tasks: TaskInput[], slots: Slot[]) { return suggestSchedule(userId, tasks, slots); }
function isProviderCallResult<T>(value: T | AIProviderCallResult<T>): value is AIProviderCallResult<T> {
  return typeof value === 'object' && value !== null && 'value' in value;
}

async function runProviderCall<T>(userId: string, action: string, metadata: Record<string, unknown>, operation: () => Promise<T | AIProviderCallResult<T>>): Promise<T> {
  const startedAt = performance.now();
  try {
    const rawResult = await operation();
    const result = isProviderCallResult(rawResult) ? rawResult.value : rawResult;
    const usage = isProviderCallResult(rawResult) ? rawResult.usage : undefined;
    await log(userId, action, {
      ...metadata,
      provider: aiProviderName,
      ...(usage ? {
        model: usage.model,
        ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
        ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
      } : {}),
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    });
    return result;
  } catch (error) {
    await log(userId, action, { ...metadata, provider: aiProviderName, latencyMs: Math.round(performance.now() - startedAt), success: false });
    throw normalizeAIProviderError(error);
  }
}
export async function chat(userId: string, prompt: string) {
  assertAIInputLength(prompt);
  await consumeAiDailyRequest(userId);
  const response = await runProviderCall(userId, 'ai.chat', { promptLength: prompt.length }, () => aiProvider.chatWithUsage?.(prompt) ?? aiProvider.chat(prompt));
  return { response, provider: aiProviderName };
}
export async function summarize(userId: string, text: string) {
  assertAIInputLength(text);
  await consumeAiDailyRequest(userId);
  const summary = await runProviderCall(userId, 'ai.document_summarized', { inputLength: text.length }, () => aiProvider.summarizeWithUsage?.(text) ?? aiProvider.summarize(text));
  return { summary, provider: aiProviderName };
}
export async function generateFlashcards(userId: string, text: string, count: number) {
  assertAIInputLength(text);
  await consumeAiDailyRequest(userId);
  const cards = await runProviderCall(userId, 'ai.flashcards_generated', { inputLength: text.length }, () => aiProvider.generateFlashcardsWithUsage?.(text, count) ?? aiProvider.generateFlashcards(text, count));
  return { cards, provider: aiProviderName };
}
