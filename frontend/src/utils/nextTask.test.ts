import { describe, expect, it } from 'vitest'
import { getNextTaskScore, getNextTaskSuggestion } from './nextTask'
import type { Task } from '../features/tasks/tasks.api'

const now = new Date(2026, 7, 8)

function task(overrides: Partial<Task>): Task {
  return { id: overrides.id ?? 'task', title: overrides.title ?? 'Task', status: overrides.status ?? 'todo', priority: overrides.priority ?? 'medium', sortOrder: 0, ...overrides }
}

describe('next task suggestion', () => {
  it('scores deadline, priority, current status, and short duration deterministically', () => {
    expect(getNextTaskScore(task({ dueDate: '2026-08-07', priority: 'urgent', status: 'in_progress', estimatedMinutes: 30 }), now)).toBe(163)
    expect(getNextTaskScore(task({ dueDate: '2026-08-08', priority: 'high' }), now)).toBe(105)
    expect(getNextTaskScore(task({ dueDate: '2026-08-09' }), now)).toBe(60)
  })

  it('selects the highest scored unfinished task and excludes completed tasks', () => {
    const suggestion = getNextTaskSuggestion([
      task({ id: 'done', title: 'Đã xong', status: 'done', dueDate: '2026-08-07', priority: 'urgent' }),
      task({ id: 'today', title: 'Việc hôm nay', dueDate: '2026-08-08' }),
      task({ id: 'late', title: 'Việc quá hạn', dueDate: '2026-08-07', priority: 'medium' }),
    ], now)

    expect(suggestion).toMatchObject({ score: 100, task: { id: 'late' } })
  })

  it('uses deadline, title, then id as stable tie breakers', () => {
    const suggestion = getNextTaskSuggestion([
      task({ id: 'b', title: 'Zulu' }),
      task({ id: 'a', title: 'Alpha' }),
    ], now)

    expect(suggestion?.task.id).toBe('a')
  })
})
