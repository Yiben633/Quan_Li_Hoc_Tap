export type CoachIntent =
  | 'question'
  | 'create_study_plan'
  | 'create_schedule'
  | 'reschedule'
  | 'prioritize_tasks'
  | 'create_tasks'
  | 'start_focus'
  | 'clarify'

export type CoachDraft = {
  id: string
  status: 'draft' | 'applied' | 'discarded' | 'expired' | string
  title: string
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
  warnings: Array<{ code: string; taskId?: string; message: string }>
  summary: {
    totalSessions: number
    totalMinutes: number
    taskCount: number
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
  provider: string
}

export type CoachChatInput = {
  conversationId?: string
  message: string
  context?: {
    subjectId?: string
    studyPlanId?: string
    taskId?: string
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
