import { useMutation } from '@tanstack/react-query'
import * as api from './ai.api'

export function useSuggestScheduleMutation() {
  return useMutation({ mutationFn: api.suggestSchedule })
}

export function useRescheduleMutation() {
  return useMutation({ mutationFn: api.reschedule })
}

export function useAiChatMutation() {
  return useMutation({ mutationFn: api.chat })
}

export function useSummarizeMutation() {
  return useMutation({ mutationFn: api.summarize })
}

export function useGenerateFlashcardsMutation() {
  return useMutation({ mutationFn: ({ text, count }: { text: string; count: number }) => api.generateFlashcards(text, count) })
}
