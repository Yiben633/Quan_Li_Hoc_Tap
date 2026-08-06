import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './learning.api'

export const learningKeys = { spaces: (status?: string) => ['semesters', status] as const, topics: (params?: object) => ['subjects', params] as const, topic: (id: string) => ['subject', id] as const }
export function useLearningSpacesQuery(status?: string) { return useQuery({ queryKey: learningKeys.spaces(status), queryFn: () => api.listLearningSpaces(status ? { status } : undefined) }) }
export function useTopicsQuery(params?: { semesterId?: string; search?: string; status?: string }) { return useQuery({ queryKey: learningKeys.topics(params), queryFn: () => api.listTopics(params) }) }
export function useTopicQuery(id: string) { return useQuery({ queryKey: learningKeys.topic(id), queryFn: () => api.getTopic(id), enabled: Boolean(id) }) }
function useInvalidateLearning() { const client = useQueryClient(); return () => { client.invalidateQueries({ queryKey: ['semesters'] }); client.invalidateQueries({ queryKey: ['subjects'] }); } }
export function useCreateLearningSpaceMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: api.createLearningSpace, onSuccess: invalidate }) }
export function useUpdateLearningSpaceMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.LearningSpace> }) => api.updateLearningSpace(id, input), onSuccess: invalidate }) }
export function useDeleteLearningSpaceMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: api.deleteLearningSpace, onSuccess: invalidate }) }
export function useDuplicateLearningSpaceMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: api.duplicateLearningSpace, onSuccess: invalidate }) }
export function useCreateTopicMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: api.createTopic, onSuccess: invalidate }) }
export function useUpdateTopicMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.Topic> }) => api.updateTopic(id, input), onSuccess: invalidate }) }
export function useDeleteTopicMutation() { const invalidate = useInvalidateLearning(); return useMutation({ mutationFn: api.deleteTopic, onSuccess: invalidate }) }
