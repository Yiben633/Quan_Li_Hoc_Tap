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
export type PomodoroType = 'focus' | 'short_break' | 'long_break'
export type ActivePomodoro = { id: string; sessionType: PomodoroType; plannedMinutes: number; actualMinutes?: number | null; startedAt: string; endedAt?: string | null; isCompleted: boolean; state: { pomodoroId: string; sessionId: string; startedAt: string; elapsedSeconds: number } }
export type ActiveStudySession = StartedStudySession & { pomodoro: ActivePomodoro | null; completedFocusCount: number; lastCompletedPomodoroType: PomodoroType | null }
export type StudyTimeStatistics = { range: 'day' | 'week' | 'month'; subjectId: string | null; start: string; end: string; totalMinutes: number; totalHours: number; sessionCount: number; sessions: StudySession[] }

export async function startStudySession(input: { subjectId?: string | null; note?: string | null }) {
  return (await apiClient.post<ApiResponse<StartedStudySession>>('/study-sessions/start', input)).data.data
}

export async function getActiveStudySession() {
  return (await apiClient.get<ApiResponse<ActiveStudySession | null>>('/study-sessions/active')).data.data
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

export async function startPomodoro(sessionId: string, input: { sessionType: PomodoroType; plannedMinutes: number }) {
  return (await apiClient.post<ApiResponse<ActivePomodoro>>(`/study-sessions/${sessionId}/pomodoro/start`, input)).data.data
}

export async function endPomodoro(sessionId: string, pomodoroId: string) {
  return (await apiClient.post<ApiResponse<ActivePomodoro>>(`/study-sessions/${sessionId}/pomodoro/${pomodoroId}/end`)).data.data
}

export async function getStudyTimeStatistics(params: { range: 'day' | 'week' | 'month'; subjectId?: string }) {
  return (await apiClient.get<ApiResponse<StudyTimeStatistics>>('/statistics/study-time', { params })).data.data
}
