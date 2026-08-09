import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './flashcards.api'

export const flashcardKeys = {
  all: ['flashcards'] as const,
  sets: ['flashcards', 'sets'] as const,
  set: (id: string) => ['flashcards', 'set', id] as const,
  due: ['flashcards', 'due'] as const,
}

export function useFlashcardSetsQuery() {
  return useQuery({ queryKey: flashcardKeys.sets, queryFn: api.listSets })
}

export function useFlashcardSetQuery(id: string) {
  return useQuery({ queryKey: flashcardKeys.set(id), queryFn: () => api.getSet(id), enabled: Boolean(id) })
}

export function useDueFlashcardsQuery() {
  return useQuery({ queryKey: flashcardKeys.due, queryFn: api.listDueCards })
}

function useRefreshFlashcards() {
  const client = useQueryClient()
  return (setId?: string) => Promise.all([
    client.invalidateQueries({ queryKey: flashcardKeys.sets }),
    client.invalidateQueries({ queryKey: flashcardKeys.due }),
    ...(setId ? [client.invalidateQueries({ queryKey: flashcardKeys.set(setId) })] : []),
  ])
}

export function useFlashcardSetCreateMutation() {
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: api.createSet, onSuccess: () => refresh() })
}

export function useFlashcardSetUpdateMutation() {
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.FlashcardSetInput> }) => api.updateSet(id, input), onSuccess: (data) => refresh(data.id) })
}

export function useFlashcardSetDeleteMutation() {
  const client = useQueryClient()
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: api.deleteSet, onSuccess: (data) => { client.removeQueries({ queryKey: flashcardKeys.set(data.id) }); return refresh() } })
}

export function useFlashcardCreateMutation() {
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: ({ setId, input }: { setId: string; input: api.FlashcardInput }) => api.createCard(setId, input), onSuccess: (data) => refresh(data.flashcardSetId) })
}

export function useFlashcardUpdateMutation() {
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: ({ id, setId, input }: { id: string; setId: string; input: Partial<api.FlashcardInput> }) => api.updateCard(id, input), onSuccess: (_data, variables) => refresh(variables.setId) })
}

export function useFlashcardDeleteMutation() {
  const refresh = useRefreshFlashcards()
  return useMutation({ mutationFn: ({ id, setId }: { id: string; setId: string }) => api.deleteCard(id), onSuccess: (_data, variables) => refresh(variables.setId) })
}

export function useFlashcardReviewMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ card, correct }: { card: api.Flashcard; correct: boolean }) => api.reviewCard(card.id, correct),
    onMutate: async ({ card }) => {
      await client.cancelQueries({ queryKey: flashcardKeys.due })
      const previousDue = client.getQueryData<api.Flashcard[]>(flashcardKeys.due)
      client.setQueryData<api.Flashcard[]>(flashcardKeys.due, (current = []) => current.filter((item) => item.id !== card.id))
      return { previousDue }
    },
    onError: (_error, _variables, context) => client.setQueryData(flashcardKeys.due, context?.previousDue),
    onSettled: (data, _error, variables) => {
      client.invalidateQueries({ queryKey: flashcardKeys.due })
      client.invalidateQueries({ queryKey: flashcardKeys.set(data?.flashcardSetId ?? variables.card.flashcardSetId) })
      client.invalidateQueries({ queryKey: flashcardKeys.sets })
    },
  })
}
