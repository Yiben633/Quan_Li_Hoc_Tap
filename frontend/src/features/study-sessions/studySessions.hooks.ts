import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './studySessions.api'

function useInvalidateStudyData() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['dashboard'] })
    client.invalidateQueries({ queryKey: ['study-sessions'] })
    client.invalidateQueries({ queryKey: ['statistics', 'study-time'] })
  }
}

export const studySessionKeys = {
  active: ['study-sessions', 'active'] as const,
  statistics: (filters: { range: 'day' | 'week' | 'month'; subjectId?: string }) => ['statistics', 'study-time', filters] as const,
}

export function useActiveStudySessionQuery() {
  return useQuery({ queryKey: studySessionKeys.active, queryFn: api.getActiveStudySession, refetchInterval: 30_000 })
}

export function useStudyTimeStatisticsQuery(filters: { range: 'day' | 'week' | 'month'; subjectId?: string }) {
  return useQuery({ queryKey: studySessionKeys.statistics(filters), queryFn: () => api.getStudyTimeStatistics(filters) })
}

export function useStartStudySessionMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: api.startStudySession, onSuccess: invalidate })
}

export function usePauseStudySessionMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: api.pauseStudySession, onSuccess: invalidate })
}

export function useResumeStudySessionMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: api.resumeStudySession, onSuccess: invalidate })
}

export function useEndStudySessionMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: api.endStudySession, onSuccess: invalidate })
}

export function useStartPomodoroMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: ({ sessionId, input }: { sessionId: string; input: { sessionType: api.PomodoroType; plannedMinutes: number } }) => api.startPomodoro(sessionId, input), onSuccess: invalidate })
}

export function useEndPomodoroMutation() {
  const invalidate = useInvalidateStudyData()
  return useMutation({ mutationFn: ({ sessionId, pomodoroId }: { sessionId: string; pomodoroId: string }) => api.endPomodoro(sessionId, pomodoroId), onSuccess: invalidate })
}
