import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sendCoachMessage } from './aiCoach.api'
import * as api from './aiCoach.api'

const coachKeys = {
  conversations: ['ai-coach', 'conversations'] as const,
  messages: (conversationId: string) => ['ai-coach', 'messages', conversationId] as const,
}

export function useCoachConversationsQuery() {
  return useQuery({ queryKey: coachKeys.conversations, queryFn: api.getCoachConversations })
}

export function useCoachMessagesQuery(conversationId?: string) {
  return useQuery({
    queryKey: coachKeys.messages(conversationId ?? 'new'),
    queryFn: () => api.getCoachMessages(conversationId!),
    enabled: Boolean(conversationId),
  })
}

export function useCoachChatMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendCoachMessage,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.conversations })
      void queryClient.invalidateQueries({ queryKey: coachKeys.messages(data.conversationId) })
    },
  })
}

export function useDeleteCoachConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCoachConversation,
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.conversations })
      queryClient.removeQueries({ queryKey: coachKeys.messages(conversationId) })
    },
  })
}
