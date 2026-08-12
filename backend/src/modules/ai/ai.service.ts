import { prisma } from '../../lib/prisma.js';
import { aiProvider, aiProviderName, normalizeAIProviderError } from './ai.provider.js';
import { buildPlan } from './coach/planningEngine.js';

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
async function runProviderCall<T>(userId: string, action: string, metadata: Record<string, unknown>, operation: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  try {
    const result = await operation();
    await log(userId, action, { ...metadata, provider: aiProviderName, latencyMs: Math.round(performance.now() - startedAt), success: true });
    return result;
  } catch (error) {
    await log(userId, action, { ...metadata, provider: aiProviderName, latencyMs: Math.round(performance.now() - startedAt), success: false });
    throw normalizeAIProviderError(error);
  }
}
export async function chat(userId: string, prompt: string) { const response = await runProviderCall(userId, 'ai.chat', { promptLength: prompt.length }, () => aiProvider.chat(prompt)); return { response, provider: aiProviderName }; }
export async function summarize(userId: string, text: string) { const summary = await runProviderCall(userId, 'ai.document_summarized', { inputLength: text.length }, () => aiProvider.summarize(text)); return { summary, provider: aiProviderName }; }
export async function generateFlashcards(userId: string, text: string, count: number) { const cards = await runProviderCall(userId, 'ai.flashcards_generated', { inputLength: text.length }, () => aiProvider.generateFlashcards(text, count)); return { cards, provider: aiProviderName }; }
