import { useEffect, useMemo, useState } from 'react'
import type { ActivePomodoro, StudySessionState } from './studySessions.api'

function elapsedSince(startedAt: string, tick: number) {
  return Math.max(0, Math.floor((tick - new Date(startedAt).getTime()) / 1000))
}

function sessionSeconds(state: StudySessionState, tick: number) {
  if (state.status !== 'running' || !state.lastStartedAt) return state.elapsedSeconds
  return Math.floor((state.accumulatedMs + Math.max(0, tick - new Date(state.lastStartedAt).getTime())) / 1000)
}

export function formatStudyClock(seconds: number, includeHours = true) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60
  if (!includeHours && hours === 0) return [minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
}

export function useStudySessionClock(state: StudySessionState, pomodoro: ActivePomodoro | null) {
  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    setTick(Date.now())
    if (state.status !== 'running') return
    const interval = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [state.status])

  return useMemo(() => {
    const elapsedSeconds = sessionSeconds(state, tick)
    const pomodoroElapsed = pomodoro ? elapsedSince(pomodoro.state.startedAt, tick) : 0
    return {
      elapsedSeconds,
      pomodoroRemainingSeconds: pomodoro ? Math.max(0, pomodoro.plannedMinutes * 60 - pomodoroElapsed) : 0,
    }
  }, [pomodoro, state, tick])
}
