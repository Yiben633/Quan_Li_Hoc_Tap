import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type ScheduleTaskInput = {
  id?: string
  title: string
  estimatedMinutes: number
  dueDate?: string | null
}

export type FreeSlotInput = { startAt: string; endAt: string }
export type ScheduleInput = { tasks: ScheduleTaskInput[]; slots: FreeSlotInput[] }
export type ScheduleAssignment = { taskId?: string; title: string; startAt: string; endAt: string }
export type ScheduleSuggestion = {
  assignments: ScheduleAssignment[]
  warnings: string[]
  totalRequestedMinutes: number
  totalAssignedMinutes: number
}
export type AiResponse = { response: string; provider: string }
export type SummaryResponse = { summary: string; provider: string }
export type GeneratedCard = { question: string; answer: string }
export type GeneratedCardsResponse = { cards: GeneratedCard[]; provider: string }

export async function suggestSchedule(input: ScheduleInput) {
  return (await apiClient.post<ApiResponse<ScheduleSuggestion>>('/ai/suggest-schedule', input)).data.data
}

export async function reschedule(input: ScheduleInput) {
  return (await apiClient.post<ApiResponse<ScheduleSuggestion>>('/ai/reschedule', input)).data.data
}

export async function chat(prompt: string) {
  return (await apiClient.post<ApiResponse<AiResponse>>('/ai/chat', { prompt })).data.data
}

export async function summarize(text: string) {
  return (await apiClient.post<ApiResponse<SummaryResponse>>('/ai/summarize-document', { text })).data.data
}

export async function generateFlashcards(text: string, count: number) {
  return (await apiClient.post<ApiResponse<GeneratedCardsResponse>>('/ai/generate-flashcards', { text, count })).data.data
}
