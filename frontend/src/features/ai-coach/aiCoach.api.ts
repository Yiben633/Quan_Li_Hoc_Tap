import apiClient from '../../services/apiClient'
import type { CoachChatInput, CoachChatResponse, CoachConversation, CoachMessage, CoachPage } from './aiCoach.types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export async function sendCoachMessage(input: CoachChatInput) {
  return (await apiClient.post<ApiResponse<CoachChatResponse>>('/ai/coach/chat', input)).data.data
}

export async function getCoachConversations() {
  return (await apiClient.get<ApiResponse<CoachPage<CoachConversation>>>('/ai/coach/conversations', {
    params: { page: 1, limit: 30, status: 'active' },
  })).data.data
}

export async function getCoachMessages(conversationId: string) {
  return (await apiClient.get<ApiResponse<CoachPage<CoachMessage>>>(`/ai/coach/conversations/${conversationId}/messages`, {
    params: { page: 1, limit: 100 },
  })).data.data
}

export async function deleteCoachConversation(conversationId: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/ai/coach/conversations/${conversationId}`)).data.data
}
