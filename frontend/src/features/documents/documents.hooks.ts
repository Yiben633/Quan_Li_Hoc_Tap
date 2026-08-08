import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './documents.api'

export const documentKeys = {
  all: ['documents'] as const,
  list: (filters: api.DocumentFilters) => ['documents', filters] as const,
}

function useInvalidateDocuments() {
  const client = useQueryClient()
  return (subjectId?: string | null, taskId?: string | null) => Promise.all([
    client.invalidateQueries({ queryKey: documentKeys.all }),
    ...(subjectId ? [client.invalidateQueries({ queryKey: ['subject', subjectId] })] : []),
    ...(taskId ? [client.invalidateQueries({ queryKey: ['task', taskId] })] : []),
  ])
}

export function useDocumentsQuery(filters: api.DocumentFilters) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => api.listDocuments(filters) })
}

export function useDocumentUploadMutation() {
  const invalidate = useInvalidateDocuments()
  return useMutation({ mutationFn: ({ input, options }: { input: api.DocumentUploadInput; options?: { signal?: AbortSignal; onProgress?: (loaded: number, total: number) => void } }) => api.uploadDocument(input, options), onSuccess: (item) => invalidate(item.subjectId, item.taskId) })
}

export function useDocumentUpdateMutation() {
  const invalidate = useInvalidateDocuments()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: api.DocumentInput }) => api.updateDocument(id, input), onSuccess: (item) => invalidate(item.subjectId, item.taskId) })
}

export function useDocumentDeleteMutation() {
  const invalidate = useInvalidateDocuments()
  return useMutation({ mutationFn: ({ id, subjectId, taskId }: { id: string; subjectId?: string | null; taskId?: string | null }) => api.deleteDocument(id), onSuccess: (_item, variables) => invalidate(variables.subjectId, variables.taskId) })
}
