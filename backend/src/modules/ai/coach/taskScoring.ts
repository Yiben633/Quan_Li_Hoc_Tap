export type ScorableTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  estimatedMinutes?: number | null;
};

const FUTURE_START_PENALTY = 1_000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function utcDayDifference(left: Date, right: Date) {
  const leftDay = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate());
  const rightDay = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());
  return Math.round((leftDay - rightDay) / 86_400_000);
}

export function scoreTask(task: ScorableTask, now: Date): number | null {
  if (task.status === 'done') return null;

  let score = 0;
  const dueAt = toDate(task.dueDate);
  const startAt = toDate(task.startDate);

  if (dueAt && dueAt < now) score += 100;
  else if (dueAt) {
    const daysUntilDue = utcDayDifference(dueAt, now);
    if (daysUntilDue === 0) score += 80;
    else if (daysUntilDue === 1) score += 60;
    else if (daysUntilDue <= 3) score += 45;
  }

  if (task.priority === 'urgent') score += 40;
  else if (task.priority === 'high') score += 25;
  if (task.status === 'in_progress') score += 15;
  if (task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && task.estimatedMinutes > 0 && task.estimatedMinutes <= 30) score += 5;

  // Future-start tasks remain visible, but never outrank work that can start now.
  if (startAt && startAt > now) score -= FUTURE_START_PENALTY;
  return score;
}

function dueTimestamp(task: ScorableTask) {
  return toDate(task.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function sortTasksForPlanning<T extends ScorableTask>(tasks: T[], now: Date): T[] {
  return tasks
    .map((task) => ({ task, score: scoreTask(task, now) }))
    .filter((item): item is { task: T; score: number } => item.score !== null)
    .sort((left, right) => (
      right.score - left.score
      || dueTimestamp(left.task) - dueTimestamp(right.task)
      || left.task.id.localeCompare(right.task.id)
    ))
    .map((item) => item.task);
}
