import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sendCoachMessage, streamCoachMessage } from './aiCoach.api'
import * as api from './aiCoach.api'
import type { CoachChatInput } from './aiCoach.types'

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

export function useCoachChatStreamMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, onTextDelta }: { input: CoachChatInput; onTextDelta: (text: string) => void }) => streamCoachMessage(input, onTextDelta),
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

export function useApplyCoachDraftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.applyCoachDraft,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['study-plans'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: coachKeys.conversations }),
    ]),
  })
}

export function useDiscardCoachDraftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.discardCoachDraft,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachKeys.conversations }),
  })
}

export function useUpdateCoachDraftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateCoachDraft,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachKeys.conversations }),
  })
}
