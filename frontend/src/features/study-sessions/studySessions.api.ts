import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type StudySessionState = {
  sessionId: string
  subjectId: string | null
  status: 'running' | 'paused'
  lastStartedAt: string | null
  accumulatedMs: number
  elapsedSeconds: number
  totalMinutes: number
}

export type StudySession = { id: string; subjectId: string | null; startedAt: string; endedAt?: string | null; totalMinutes: number }
export type StartedStudySession = { session: StudySession; state: StudySessionState }

export async function startStudySession(input: { subjectId?: string | null; note?: string | null }) {
  return (await apiClient.post<ApiResponse<StartedStudySession>>('/study-sessions/start', input)).data.data
}

export async function pauseStudySession(id: string) {
  return (await apiClient.post<ApiResponse<StudySessionState>>(`/study-sessions/${id}/pause`)).data.data
}

export async function resumeStudySession(id: string) {
  return (await apiClient.post<ApiResponse<StudySessionState>>(`/study-sessions/${id}/resume`)).data.data
}

export async function endStudySession(id: string) {
  return (await apiClient.post<ApiResponse<StudySession & { state: { status: 'ended'; totalMinutes: number } }>>(`/study-sessions/${id}/end`)).data.data
}
