import { prisma } from '../../lib/prisma.js';
import { aiProvider, aiProviderName, normalizeAIProviderError } from './ai.provider.js';
type Slot = { startAt: Date; endAt: Date };
type TaskInput = { id?: string; title: string; estimatedMinutes: number; dueDate?: Date | null };
async function log(userId: string, action: string, metadata: object) { await prisma.activityLog.create({ data: { userId, action, metadata } }); }
export async function suggestSchedule(userId: string, tasks: TaskInput[], slots: Slot[]) { const remaining = [...tasks].sort((a, b) => (a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER)); const assignments: Array<{ taskId?: string; title: string; startAt: Date; endAt: Date }> = []; const warnings: string[] = []; for (const task of remaining) { let placed = false; for (const slot of slots) { const used = assignments.filter((item) => item.startAt >= slot.startAt && item.endAt <= slot.endAt).reduce((sum, item) => sum + (item.endAt.getTime() - item.startAt.getTime()) / 60000, 0); const start = new Date(slot.startAt.getTime() + used * 60000); const end = new Date(start.getTime() + task.estimatedMinutes * 60000); if (end <= slot.endAt) { assignments.push({ taskId: task.id, title: task.title, startAt: start, endAt: end }); placed = true; break; } } if (!placed) warnings.push(`Not enough free time for "${task.title}" (${task.estimatedMinutes} minutes).`); } await log(userId, 'ai.schedule_suggested', { taskCount: tasks.length, assignedCount: assignments.length }); return { assignments, warnings, totalRequestedMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0), totalAssignedMinutes: assignments.reduce((sum, item) => sum + (item.endAt.getTime() - item.startAt.getTime()) / 60000, 0) }; }
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
