import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './studySessions.api'

function useInvalidateStudyData() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['dashboard'] })
    client.invalidateQueries({ queryKey: ['study-sessions'] })
  }
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
