import { describe, expect, it } from 'vitest'
import { taskFormSchema } from './taskForm.schema'

const validTask = {
  title: 'Ôn React Hooks',
  description: '',
  subjectId: '',
  studyPlanId: '',
  startDate: '2026-08-10',
  dueDate: '2026-08-12',
  estimatedMinutes: '45',
  difficulty: '3',
  priority: 'high',
  status: 'todo',
}

describe('task form validation', () => {
  it('chuẩn hóa dữ liệu hợp lệ thành TaskInput', () => {
    expect(taskFormSchema.parse(validTask)).toMatchObject({ title: 'Ôn React Hooks', description: null, estimatedMinutes: 45, difficulty: 3, priority: 'high' })
  })

  it('không cho deadline đứng trước ngày bắt đầu', () => {
    const result = taskFormSchema.safeParse({ ...validTask, dueDate: '2026-08-09' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Hạn hoàn thành cần sau hoặc trùng ngày bắt đầu')
  })

  it('giới hạn thời gian và độ khó bằng thông báo tiếng Việt', () => {
    expect(taskFormSchema.safeParse({ ...validTask, estimatedMinutes: '-1' }).success).toBe(false)
    expect(taskFormSchema.safeParse({ ...validTask, difficulty: '6' }).success).toBe(false)
  })
})
