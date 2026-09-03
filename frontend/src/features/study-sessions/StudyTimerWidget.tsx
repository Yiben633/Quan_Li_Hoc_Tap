import { Bell, Clock3, Coffee, Minus, Pause, Play, Plus, Settings2, Square, TimerReset, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { NatureMascot } from '../../components/nature'
import { Button, Switch } from '../../components/ui'
import { getApiErrorMessage } from '../auth/auth.api'
import type { ActivePomodoro, ActiveStudySession, PomodoroType, StudySessionState } from './studySessions.api'
import { useEndPomodoroMutation, useEndStudySessionMutation, usePauseStudySessionMutation, useResumeStudySessionMutation, useStartPomodoroMutation } from './studySessions.hooks'
import { useStudyTimerStore } from '../../stores/studyTimerStore'
import { formatStudyClock, useStudySessionClock } from './useStudySessionClock'

const pomodoroLabels: Record<PomodoroType, string> = {
  focus: 'Tập trung',
  short_break: 'Nghỉ ngắn',
  long_break: 'Nghỉ dài',
}

function playChime(audio: AudioContext) {
  try {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.frequency.value = 740
    gain.gain.setValueAtTime(0.06, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.45)
    window.setTimeout(() => void audio.close(), 600)
  } catch {
    // Silent fallback when the browser cannot play the optional sound.
  }
}

function announceCompletion(type: PomodoroType, notifications: boolean, sound: boolean, audio: AudioContext | null) {
  if (sound && audio) playChime(audio)
  if (notifications && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('StudyFlow', { body: `${pomodoroLabels[type]} đã kết thúc.` })
  }
}

function DurationPicker({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  const changeHours = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta * 60)))
  const changeMinutes = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)))
  return <section className="duration-picker">
    <div className="duration-picker-head"><strong>{label}</strong><small>{min}–{max} phút</small></div>
    <div className="duration-units" aria-label={`Thời lượng ${label}`}>
      <div className="duration-unit"><button type="button" onClick={() => changeHours(-1)} disabled={value - 60 < min} aria-label={`Giảm một giờ ${label}`}><Minus size={14} /></button><div><strong>{String(hours).padStart(2, '0')}</strong><span>giờ</span></div><button type="button" onClick={() => changeHours(1)} disabled={value + 60 > max} aria-label={`Tăng một giờ ${label}`}><Plus size={14} /></button></div>
      <span className="duration-separator" aria-hidden="true">:</span>
      <div className="duration-unit"><button type="button" onClick={() => changeMinutes(-1)} disabled={value - 1 < min} aria-label={`Giảm một phút ${label}`}><Minus size={14} /></button><div><strong>{String(minutes).padStart(2, '0')}</strong><span>phút</span></div><button type="button" onClick={() => changeMinutes(1)} disabled={value + 1 > max} aria-label={`Tăng một phút ${label}`}><Plus size={14} /></button></div>
      <span className="duration-separator" aria-hidden="true">:</span>
      <div className="duration-unit is-static" aria-label="Giây, hiện là 00 do Pomodoro lưu theo phút"><div><strong>00</strong><span>giây</span></div></div>
    </div>
  </section>
}

type StudyTimerWidgetProps = {
  active: ActiveStudySession
  subjectName?: string
  onActiveChange: (session: ActiveStudySession) => void
  onEnded: () => void
}

export function StudyTimerWidget({ active, subjectName, onActiveChange, onEnded }: StudyTimerWidgetProps) {
  const [pomodoro, setPomodoro] = useState<ActivePomodoro | null>(active.pomodoro)
  const [completedFocusCount, setCompletedFocusCount] = useState(active.completedFocusCount)
  const [lastCompletedType, setLastCompletedType] = useState<PomodoroType | null>(active.lastCompletedPomodoroType)
  const autoEndingPomodoro = useRef<string | null>(null)
  const soundContext = useRef<AudioContext | null>(null)
  const settings = useStudyTimerStore((state) => state.pomodoro)
  const updateSettings = useStudyTimerStore((state) => state.updatePomodoro)
  const pause = usePauseStudySessionMutation()
  const resume = useResumeStudySessionMutation()
  const end = useEndStudySessionMutation()
  const startPomodoro = useStartPomodoroMutation()
  const endPomodoro = useEndPomodoroMutation()

  useEffect(() => {
    setPomodoro(active.pomodoro)
  }, [active.pomodoro])

  useEffect(() => {
    setCompletedFocusCount(active.completedFocusCount)
    setLastCompletedType(active.lastCompletedPomodoroType)
  }, [active.session.id])

  const { elapsedSeconds: elapsed, pomodoroRemainingSeconds: pomodoroRemaining } = useStudySessionClock(active.state, pomodoro)
  const nextPomodoroType: PomodoroType = lastCompletedType === 'focus' ? (completedFocusCount % 4 === 0 ? 'long_break' : 'short_break') : 'focus'
  const nextPomodoroMinutes = nextPomodoroType === 'focus' ? settings.focusMinutes : nextPomodoroType === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes

  const updateSessionState = (state: StudySessionState) => onActiveChange({ ...active, state })
  const finishPomodoro = (current: ActivePomodoro) => {
    endPomodoro.mutate({ sessionId: active.session.id, pomodoroId: current.id }, {
      onSuccess: () => {
        setPomodoro(null)
        setLastCompletedType(current.sessionType)
        if (current.sessionType === 'focus') setCompletedFocusCount((count) => count + 1)
        announceCompletion(current.sessionType, settings.notificationEnabled, settings.soundEnabled, soundContext.current)
        toast.success(`${pomodoroLabels[current.sessionType]} đã kết thúc`)
      },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể kết thúc Pomodoro')),
    })
  }

  useEffect(() => {
    if (!pomodoro || pomodoroRemaining > 0 || autoEndingPomodoro.current === pomodoro.id || endPomodoro.isPending) return
    autoEndingPomodoro.current = pomodoro.id
    finishPomodoro(pomodoro)
  }, [endPomodoro.isPending, pomodoro, pomodoroRemaining])

  const changeNotification = async (checked: boolean) => {
    if (!checked) {
      updateSettings({ notificationEnabled: false })
      return
    }
    if (!('Notification' in window)) {
      toast.error('Trình duyệt này chưa hỗ trợ thông báo')
      return
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    if (permission !== 'granted') {
      toast.error('Bạn chưa cấp quyền thông báo trình duyệt')
      return
    }
    updateSettings({ notificationEnabled: true })
  }

  const prepareSound = async (preview = false) => {
    try {
      soundContext.current ??= new AudioContext()
      if (soundContext.current.state === 'suspended') await soundContext.current.resume()
      if (soundContext.current.state !== 'running') throw new Error('Audio is unavailable')
      if (preview) playChime(soundContext.current)
      return true
    } catch {
      toast.error('Trình duyệt chưa thể phát âm thanh. Hãy thử lại sau khi tương tác với trang.')
      return false
    }
  }

  const changeSound = async (checked: boolean) => {
    if (!checked) {
      updateSettings({ soundEnabled: false })
      return
    }
    if (await prepareSound(true)) {
      updateSettings({ soundEnabled: true })
      toast.success('Đã bật âm thanh Pomodoro')
    }
  }

  const isBreakPomodoro = pomodoro?.sessionType === 'short_break' || pomodoro?.sessionType === 'long_break'

  return <section className={`panel study-timer-widget${active.state.status === 'running' ? ' is-running' : ''}`}>
    <div className="study-widget-head">
      <div><p className="eyebrow">PHIÊN TẬP TRUNG</p><h2>{subjectName ?? 'Phiên học tự do'}</h2></div>
      <span className={`study-session-state ${active.state.status}`}>{active.state.status === 'running' ? 'Đang học' : 'Đang tạm dừng'}</span>
    </div>
    <strong className="study-timer"><Clock3 size={22} /> {formatStudyClock(elapsed)}</strong>
    <p className="subtle">Phiên đang chạy được xác nhận bởi máy chủ và sẽ tiếp tục đúng thời gian sau khi bạn tải lại trang.</p>
    <div className="study-session-actions">
      {active.state.status === 'running'
        ? <Button variant="secondary" onClick={() => pause.mutate(active.session.id, { onSuccess: updateSessionState, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạm dừng phiên học')) })} loading={pause.isPending}><Pause size={16} /> Tạm dừng</Button>
        : <Button onClick={() => resume.mutate(active.session.id, { onSuccess: updateSessionState, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tiếp tục phiên học')) })} loading={resume.isPending}><Play size={16} /> Tiếp tục</Button>}
      <Button variant="danger" onClick={() => end.mutate(active.session.id, { onSuccess: () => { toast.success('Đã kết thúc phiên học'); onEnded() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể kết thúc phiên học')) })} loading={end.isPending}><Square size={15} /> Kết thúc</Button>
    </div>

    <section className="pomodoro-panel" aria-label="Pomodoro">
      <div className="pomodoro-head"><div><span><TimerReset size={17} /> Pomodoro</span><p>{pomodoro ? pomodoroLabels[pomodoro.sessionType] : `Sẵn sàng ${pomodoroLabels[nextPomodoroType].toLowerCase()}`}</p></div>{pomodoro && <strong>{formatStudyClock(pomodoroRemaining)}</strong>}</div>
      {pomodoro ? <Button variant="secondary" onClick={() => finishPomodoro(pomodoro)} loading={endPomodoro.isPending}>Hoàn thành {pomodoroLabels[pomodoro.sessionType].toLowerCase()}</Button> : <Button variant="secondary" onClick={() => startPomodoro.mutate({ sessionId: active.session.id, input: { sessionType: nextPomodoroType, plannedMinutes: nextPomodoroMinutes } }, { onSuccess: (next) => { autoEndingPomodoro.current = null; setPomodoro(next); toast.success(`Bắt đầu ${pomodoroLabels[nextPomodoroType].toLowerCase()}`) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể bắt đầu Pomodoro')) })} loading={startPomodoro.isPending}><Coffee size={16} /> {pomodoroLabels[nextPomodoroType]} {nextPomodoroMinutes} phút</Button>}
      <small>{completedFocusCount} lượt tập trung đã hoàn thành trong phiên này. Nghỉ dài sau mỗi 4 lượt.</small>
    </section>

    <details className="pomodoro-settings">
      <summary><Settings2 size={16} /> Thiết lập Pomodoro</summary>
      <div className="pomodoro-settings-grid">
        <DurationPicker label="Tập trung" value={settings.focusMinutes} min={5} max={120} onChange={(value) => updateSettings({ focusMinutes: value })} />
        <DurationPicker label="Nghỉ ngắn" value={settings.shortBreakMinutes} min={1} max={60} onChange={(value) => updateSettings({ shortBreakMinutes: value })} />
        <DurationPicker label="Nghỉ dài" value={settings.longBreakMinutes} min={5} max={90} onChange={(value) => updateSettings({ longBreakMinutes: value })} />
      </div>
      <p className="pomodoro-precision-note">Pomodoro hiện đồng bộ theo phút với backend, nên phần giây được cố định là 00.</p>
      <div className="pomodoro-toggle-list"><Switch label={<><Bell size={16} /> Thông báo khi hết giờ</>} checked={settings.notificationEnabled} onChange={(event) => void changeNotification(event.target.checked)} /><div className="pomodoro-sound-setting"><Switch label={<><Volume2 size={16} /> Âm thanh khi hết giờ</>} checked={settings.soundEnabled} onChange={(event) => void changeSound(event.target.checked)} /><Button type="button" variant="ghost" className="pomodoro-preview-button" onClick={() => void prepareSound(true)}><Volume2 size={15} /> Nghe thử</Button></div></div>
    </details>
  </section>
}
