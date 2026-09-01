import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActiveStudySession } from '../study-sessions/studySessions.api'

const pomodoroState = vi.hoisted(() => ({
  active: null as ActiveStudySession | null,
  elapsedSeconds: 0,
  remainingSeconds: 0,
  pause: vi.fn(),
  resume: vi.fn(),
  startFocus: vi.fn(),
  startPomodoro: vi.fn(),
}))

vi.mock('../study-sessions/studySessions.hooks', () => ({
  useActiveStudySessionQuery: () => ({ data: pomodoroState.active, isLoading: false, isError: false }),
  usePauseStudySessionMutation: () => ({ mutate: pomodoroState.pause, isPending: false }),
  useResumeStudySessionMutation: () => ({ mutate: pomodoroState.resume, isPending: false }),
  useStartFocusPomodoroMutation: () => ({ mutate: pomodoroState.startFocus, isPending: false }),
  useStartPomodoroMutation: () => ({ mutate: pomodoroState.startPomodoro, isPending: false }),
}))
vi.mock('../study-sessions/useStudySessionClock', () => ({
  formatStudyClock: (seconds: number, includeHours = true) => {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return includeHours ? `00:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  },
  useStudySessionClock: () => ({ elapsedSeconds: pomodoroState.elapsedSeconds, pomodoroRemainingSeconds: pomodoroState.remainingSeconds }),
}))
vi.mock('../../stores/studyTimerStore', () => ({
  useStudyTimerStore: <T,>(selector: (state: { pomodoro: { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; notificationEnabled: boolean; soundEnabled: boolean } }) => T) => selector({
    pomodoro: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, notificationEnabled: false, soundEnabled: false },
  }),
}))

import { DashboardPomodoroCard } from './DashboardPomodoroCard'

function createRunningPomodoro(): ActiveStudySession {
  return {
    session: { id: 'session-1', subjectId: null, startedAt: '2030-01-01T09:00:00.000Z', totalMinutes: 0 },
    state: { sessionId: 'session-1', subjectId: null, status: 'running', lastStartedAt: '2030-01-01T09:00:00.000Z', accumulatedMs: 0, elapsedSeconds: 300, totalMinutes: 0 },
    pomodoro: {
      id: 'pomodoro-1',
      sessionType: 'focus',
      plannedMinutes: 25,
      startedAt: '2030-01-01T09:00:00.000Z',
      isCompleted: false,
      state: { pomodoroId: 'pomodoro-1', sessionId: 'session-1', startedAt: '2030-01-01T09:00:00.000Z', elapsedSeconds: 300 },
    },
    completedFocusCount: 0,
    lastCompletedPomodoroType: null,
  }
}

function renderPomodoro() {
  return render(<MemoryRouter><DashboardPomodoroCard /></MemoryRouter>)
}

describe('DashboardPomodoroCard', () => {
  beforeEach(() => {
    pomodoroState.active = null
    pomodoroState.elapsedSeconds = 0
    pomodoroState.remainingSeconds = 0
    pomodoroState.pause.mockReset()
    pomodoroState.resume.mockReset()
    pomodoroState.startFocus.mockReset()
    pomodoroState.startPomodoro.mockReset()
  })

  it('renders the idle timer from the shared Pomodoro setting', () => {
    renderPomodoro()

    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Sẵn sàng tập trung')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeInTheDocument()
  })

  it('renders a running Pomodoro and pauses the shared active session', async () => {
    pomodoroState.active = createRunningPomodoro()
    pomodoroState.remainingSeconds = 1200
    const user = userEvent.setup()
    renderPomodoro()

    expect(screen.getByText('20:00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tập trung' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tạm dừng' }))
    expect(pomodoroState.pause).toHaveBeenCalledWith('session-1', expect.any(Object))
  })
})
