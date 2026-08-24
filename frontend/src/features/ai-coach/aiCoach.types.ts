export type CoachIntent =
  | 'question'
  | 'create_study_plan'
  | 'create_schedule'
  | 'reschedule'
  | 'prioritize_tasks'
  | 'create_tasks'
  | 'create_goal'
  | 'analytics'
  | 'start_focus'
  | 'clarify'

export type CoachDraft = {
  id: string
  status: 'draft' | 'applied' | 'discarded' | 'expired' | string
  type?: 'study_schedule' | 'study_plan_bundle' | 'reschedule' | 'goal'
  title: string
  range?: {
    startAt?: string
    endAt?: string
  }
  sessions: Array<{
    id: string
    taskId: string
    subjectId: string | null
    title: string
    startAt: string
    endAt: string
    minutes: number
    sequence: number
  }>
  moves?: Array<{
    id: string
    eventId: string
    taskId?: string
    title: string
    fromStartAt: string
    fromEndAt: string
    toStartAt: string
    toEndAt: string
    minutes: number
  }>
  warnings: Array<{ code: string; taskId?: string; message: string }>
  summary: {
    totalSessions: number
    totalMinutes: number
    taskCount: number
  }
  goal?: {
    name: string
    type: 'score' | 'study_time' | 'task_count' | 'course_completion' | 'gpa'
    targetValue: number
    subjectId: string | null
    deadline: string | null
  }
}

export type CoachChatResponse = {
  conversationId: string
  message: string
  intent: CoachIntent
  needsConfirmation: boolean
  draft: CoachDraft | null
  suggestions?: Array<{
    taskId: string
    title: string
    estimatedMinutes: number | null
    dueDate: string | null
  }>
  taskPriority?: {
    type: 'task_priority'
    taskIds: string[]
  }
  focusProposal?: {
    type: 'pomodoro'
    taskId: string
    subjectId: string | null
    title: string
    plannedMinutes: number
  }
  analytics?: {
    type: 'weekly'
    range: { startAt: string; endAt: string }
    timezone: string
    studyMinutes: number
    completedTasks: number
    totalTasks: number
    overdueTasks: number
    subjectBreakdown: Array<{
      subjectId: string | null
      name: string
      minutes: number
      percent: number
    }>
  }
  provider: string
}

export type CoachChatInput = {
  conversationId?: string
  message: string
  context?: {
    subjectId?: string
    studyPlanId?: string
    taskId?: string
    eventId?: string
  }
}

export type CoachConversation = {
  id: string
  title: string | null
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
  _count: {
    messages: number
    drafts: number
  }
}

export type CoachMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type CoachPage<T> = {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
