import type { Priority, StudyPlanInput, TaskStatus } from './tasks.api'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  waiting: 'Chờ xử lý',
  done: 'Hoàn thành',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Vừa',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

export const PLAN_STATUS_LABELS: Record<NonNullable<StudyPlanInput['status']>, string> = {
  not_started: 'Chưa bắt đầu',
  in_progress: 'Đang thực hiện',
  paused: 'Tạm dừng',
  completed: 'Hoàn thành',
  overdue: 'Quá hạn',
}

export const DIFFICULTY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '1 · Rất dễ',
  2: '2 · Dễ',
  3: '3 · Trung bình',
  4: '4 · Khó',
  5: '5 · Rất khó',
}
