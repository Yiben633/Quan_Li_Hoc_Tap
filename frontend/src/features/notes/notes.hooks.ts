import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './notes.api'

export const noteKeys = {
  all: ['notes'] as const,
  list: (filters: api.NoteFilters) => ['notes', filters] as const,
}

function useInvalidateNotes() {
  const client = useQueryClient()
  return (subjectId?: string | null, taskId?: string | null) => Promise.all([
    client.invalidateQueries({ queryKey: noteKeys.all }),
    ...(subjectId ? [client.invalidateQueries({ queryKey: ['subject', subjectId] })] : []),
    ...(taskId ? [client.invalidateQueries({ queryKey: ['task', taskId] })] : []),
  ])
}

export function useNotesQuery(filters: api.NoteFilters) {
  return useQuery({ queryKey: noteKeys.list(filters), queryFn: () => api.listNotes(filters) })
}

export function useNoteCreateMutation() {
  const invalidate = useInvalidateNotes()
  return useMutation({ mutationFn: api.createNote, onSuccess: (note) => invalidate(note.subjectId, note.taskId) })
}

export function useNoteUpdateMutation() {
  const invalidate = useInvalidateNotes()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.NoteInput> }) => api.updateNote(id, input), onSuccess: (note) => invalidate(note.subjectId, note.taskId) })
}

export function useNotePinMutation() {
  const invalidate = useInvalidateNotes()
  return useMutation({ mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => api.pinNote(id, isPinned), onSuccess: (note) => invalidate(note.subjectId, note.taskId) })
}

export function useNoteDeleteMutation() {
  const invalidate = useInvalidateNotes()
  return useMutation({ mutationFn: ({ id, subjectId, taskId }: { id: string; subjectId?: string | null; taskId?: string | null }) => api.deleteNote(id), onSuccess: (_item, variables) => invalidate(variables.subjectId, variables.taskId) })
}
