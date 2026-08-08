import { Clock3, Pause, Play, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Select } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { useTaskQuery } from '../features/tasks/tasks.hooks'
import type { StartedStudySession, StudySessionState } from '../features/study-sessions/studySessions.api'
import { useEndStudySessionMutation, usePauseStudySessionMutation, useResumeStudySessionMutation, useStartStudySessionMutation } from '../features/study-sessions/studySessions.hooks'

type StudyLocationState = { activeSession?: StartedStudySession }

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
}

function currentSeconds(state: StudySessionState, tick: number) {
  if (state.status !== 'running' || !state.lastStartedAt) return state.elapsedSeconds
  return state.elapsedSeconds + Math.max(0, Math.floor((tick - new Date(state.lastStartedAt).getTime()) / 1000))
}

export function StudyPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as StudyLocationState | null
  const [activeSession, setActiveSession] = useState<StartedStudySession | null>(routeState?.activeSession ?? null)
  const [subjectId, setSubjectId] = useState(() => params.get('subjectId') ?? '')
  const [tick, setTick] = useState(Date.now())
  const taskId = params.get('taskId') ?? ''
  const taskQuery = useTaskQuery(taskId)
  const topics = useTopicsQuery()
  const start = useStartStudySessionMutation()
  const pause = usePauseStudySessionMutation()
  const resume = useResumeStudySessionMutation()
  const end = useEndStudySessionMutation()

  useEffect(() => {
    if (!activeSession || activeSession.state.status !== 'running') return
    const interval = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [activeSession])

  const elapsedSeconds = useMemo(() => activeSession ? currentSeconds(activeSession.state, tick) : 0, [activeSession, tick])
  const selectedTopic = topics.data?.items.find((topic) => topic.id === (activeSession?.session.subjectId ?? subjectId))
  const begin = () => start.mutate({ subjectId: subjectId || null }, { onSuccess: (session) => { setActiveSession(session); toast.success('Đã bắt đầu phiên học') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể bắt đầu phiên học')) })
  const updateState = (state: StudySessionState) => setActiveSession((current) => current ? { ...current, state } : current)
  const finish = () => {
    if (!activeSession) return
    end.mutate(activeSession.session.id, { onSuccess: () => { setActiveSession(null); navigate('/study', { replace: true }); toast.success('Đã kết thúc phiên học') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể kết thúc phiên học')) })
  }

  if (!activeSession) return <div className="study-page"><div className="page-heading"><div><p className="eyebrow">TẬP TRUNG</p><h1>Bắt đầu phiên học</h1><p className="subtle">Chọn môn học nếu bạn muốn ghi nhận thời gian theo môn, hoặc bắt đầu một phiên tự do.</p></div></div><section className="panel study-start-panel">{taskId && !taskQuery.isLoading && taskQuery.data && <p className="study-task-context">Đang chuẩn bị tập trung cho: <strong>{taskQuery.data.title}</strong></p>}<Select label="Môn học (tùy chọn)" customMenu value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Phiên học tự do</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select><Button onClick={begin} loading={start.isPending}><Play size={16} /> Bắt đầu học</Button></section></div>

  const sessionState = activeSession.state
  return <div className="study-page"><div className="page-heading"><div><p className="eyebrow">PHIÊN TẬP TRUNG</p><h1>{selectedTopic?.name ?? 'Phiên học tự do'}</h1><p className="subtle">{taskQuery.data ? `Đang tập trung cho: ${taskQuery.data.title}` : 'Theo dõi thời gian học của bạn.'}</p></div></div><section className="panel study-session-panel"><span className={`study-session-state ${sessionState.status}`}>{sessionState.status === 'running' ? 'Đang học' : 'Đang tạm dừng'}</span><strong className="study-timer"><Clock3 size={22} /> {formatElapsed(elapsedSeconds)}</strong><p className="subtle">Thời gian được đồng bộ khi bạn tạm dừng hoặc kết thúc phiên.</p><div className="study-session-actions">{sessionState.status === 'running' ? <Button variant="secondary" onClick={() => pause.mutate(activeSession.session.id, { onSuccess: updateState, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạm dừng phiên học')) })} loading={pause.isPending}><Pause size={16} /> Tạm dừng</Button> : <Button onClick={() => resume.mutate(activeSession.session.id, { onSuccess: updateState, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tiếp tục phiên học')) })} loading={resume.isPending}><Play size={16} /> Tiếp tục</Button>}<Button variant="danger" onClick={finish} loading={end.isPending}><Square size={15} /> Kết thúc</Button></div></section></div>
}
