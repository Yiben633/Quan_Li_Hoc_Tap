import type { Task } from '../features/tasks/tasks.api'

export type TaskSuggestion = { task: Task; score: number }

const dayMilliseconds = 86_400_000

function localDay(value: string | Date) {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dueScore(dueDate: string | null | undefined, now: Date) {
  if (!dueDate) return 0
  const due = localDay(dueDate)
  const today = localDay(now)
  if (!due || !today) return 0
  const difference = Math.round((due.getTime() - today.getTime()) / dayMilliseconds)
  if (difference < 0) return 100
  if (difference === 0) return 80
  if (difference === 1) return 60
  return 0
}

export function getNextTaskScore(task: Task, now = new Date()) {
  if (task.status === 'done') return Number.NEGATIVE_INFINITY

  let score = dueScore(task.dueDate, now)
  if (task.priority === 'urgent') score += 40
  if (task.priority === 'high') score += 25
  if (task.status === 'in_progress') score += 15
  if (task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && task.estimatedMinutes <= 30) score += 8
  return score
}

export function getNextTaskSuggestion(tasks: Task[], now = new Date()): TaskSuggestion | null {
  const candidates = tasks
    .filter((task) => task.status !== 'done')
    .map((task) => ({ task, score: getNextTaskScore(task, now) }))

  if (candidates.length === 0) return null

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    const leftDue = localDay(left.task.dueDate ?? '')?.getTime() ?? Number.MAX_SAFE_INTEGER
    const rightDue = localDay(right.task.dueDate ?? '')?.getTime() ?? Number.MAX_SAFE_INTEGER
    if (leftDue !== rightDue) return leftDue - rightDue
    const titleOrder = left.task.title.localeCompare(right.task.title, 'vi')
    return titleOrder || left.task.id.localeCompare(right.task.id)
  })

  return candidates[0]
}
