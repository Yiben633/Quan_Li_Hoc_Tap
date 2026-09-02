import { ArrowUpRight, Pause, Play, TimerReset } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Button, Skeleton } from '../../components/ui'
import { getApiErrorMessage } from '../auth/auth.api'
import { useActiveStudySessionQuery, usePauseStudySessionMutation, useResumeStudySessionMutation, useStartFocusPomodoroMutation, useStartPomodoroMutation } from '../study-sessions/studySessions.hooks'
import { formatStudyClock, useStudySessionClock } from '../study-sessions/useStudySessionClock'
import { useStudyTimerStore } from '../../stores/studyTimerStore'

const pomodoroModeLabels = {
  focus: 'Tập trung',
  short_break: 'Nghỉ ngắn',
  long_break: 'Nghỉ dài',
} as const

export function DashboardPomodoroCard() {
  const activeQuery = useActiveStudySessionQuery()
  const settings = useStudyTimerStore((state) => state.pomodoro)
  const startFocus = useStartFocusPomodoroMutation()
  const startPomodoro = useStartPomodoroMutation()
  const pause = usePauseStudySessionMutation()
  const resume = useResumeStudySessionMutation()
  const active = activeQuery.data ?? null
  const fallbackState = { sessionId: '', subjectId: null, status: 'paused' as const, lastStartedAt: null, accumulatedMs: 0, elapsedSeconds: 0, totalMinutes: 0 }
  const { elapsedSeconds, pomodoroRemainingSeconds } = useStudySessionClock(active?.state ?? fallbackState, active?.pomodoro ?? null)

  if (activeQuery.isLoading && !active) return <section className="panel dashboard-pomodoro-card dashboard-pomodoro-skeleton"><Skeleton width={96} height={12} /><Skeleton width={130} height={48} /><Skeleton width={112} height={36} /></section>
  if (activeQuery.isError && !active) return <section className="panel dashboard-pomodoro-card dashboard-pomodoro-unavailable"><div><p className="dashboard-pomodoro-kicker">POMODORO</p><h2>Không thể kiểm tra phiên tập trung</h2><p>Hãy mở chế độ tập trung để thử lại.</p></div><Link className="button secondary" to="/study">Mở tập trung <ArrowUpRight size={15} /></Link></section>

  const mode = active?.pomodoro ? pomodoroModeLabels[active.pomodoro.sessionType] : active ? 'Phiên học tự do' : 'Tập trung'
  const timerSeconds = active?.pomodoro ? pomodoroRemainingSeconds : active ? elapsedSeconds : settings.focusMinutes * 60
  const timerLabel = active?.pomodoro ? formatStudyClock(timerSeconds, false) : active ? formatStudyClock(timerSeconds) : formatStudyClock(timerSeconds, false)
  const onError = (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật phiên tập trung'))
  const beginFocus = () => startFocus.mutate({ plannedMinutes: settings.focusMinutes }, { onError })
  const beginPomodoro = () => active && startPomodoro.mutate({ sessionId: active.session.id, input: { sessionType: 'focus', plannedMinutes: settings.focusMinutes } }, { onError })

  return <section className="panel dashboard-pomodoro-card" aria-labelledby="dashboard-pomodoro-title">
    <div className="dashboard-pomodoro-heading"><div><p className="dashboard-pomodoro-kicker">POMODORO</p><h2 id="dashboard-pomodoro-title">{active?.state.status === 'paused' ? 'Đang tạm dừng' : mode}</h2></div><TimerReset size={18} aria-hidden="true" /></div>
    <div className="dashboard-pomodoro-timer" aria-live="off" aria-label={active?.pomodoro ? `Còn lại ${timerLabel}` : `Thời gian phiên học ${timerLabel}`}><strong>{timerLabel}</strong><span>{active?.pomodoro ? mode : active ? 'Phiên học đang chạy' : 'Sẵn sàng tập trung'}</span></div>
    {active
      ? active.state.status === 'running'
        ? <Button variant="secondary" onClick={() => pause.mutate(active.session.id, { onError })} loading={pause.isPending}><Pause size={16} /> Tạm dừng</Button>
        : <Button onClick={() => resume.mutate(active.session.id, { onError })} loading={resume.isPending}><Play size={16} /> Tiếp tục</Button>
      : <Button onClick={beginFocus} loading={startFocus.isPending}><Play size={16} /> Bắt đầu</Button>}
    {active && !active.pomodoro && <Button variant="secondary" className="dashboard-pomodoro-start" onClick={beginPomodoro} loading={startPomodoro.isPending}><TimerReset size={15} /> Bắt đầu Pomodoro</Button>}
    <p className="dashboard-pomodoro-mode">Chế độ: <strong>{mode}</strong></p>
    <Link className="dashboard-pomodoro-open" to="/study">Mở tập trung <ArrowUpRight size={14} /></Link>
    <div className="dashboard-pomodoro-fireflies" aria-hidden="true"><span className="nature-firefly nature-motion dashboard-pomodoro-firefly-one" /><span className="nature-firefly nature-motion dashboard-pomodoro-firefly-two" /><span className="nature-firefly nature-motion dashboard-pomodoro-firefly-three" /></div>
    <div className="dashboard-pomodoro-decoration" aria-hidden="true"><span className="dashboard-pomodoro-tree" /></div>
  </section>
}
