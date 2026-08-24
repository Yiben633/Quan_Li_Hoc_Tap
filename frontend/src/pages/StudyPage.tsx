import { BarChart3, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, EmptyState, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { StudyTimerWidget } from '../features/study-sessions/StudyTimerWidget'
import type { ActiveStudySession, StartedStudySession } from '../features/study-sessions/studySessions.api'
import { useActiveStudySessionQuery, useStartStudySessionMutation } from '../features/study-sessions/studySessions.hooks'
import { useTaskQuery } from '../features/tasks/tasks.hooks'

type StudyLocationState = { activeSession?: StartedStudySession | ActiveStudySession }

function toActiveSession(session: StartedStudySession | ActiveStudySession): ActiveStudySession {
  if ('pomodoro' in session) return session
  return { ...session, pomodoro: null, completedFocusCount: 0, lastCompletedPomodoroType: null }
}

export function StudyPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as StudyLocationState | null
  const [activeSession, setActiveSession] = useState<ActiveStudySession | null>(() => routeState?.activeSession ? toActiveSession(routeState.activeSession) : null)
  const [subjectId, setSubjectId] = useState(() => params.get('subjectId') ?? '')
  const taskId = params.get('taskId') ?? ''
  const activeQuery = useActiveStudySessionQuery()
  const taskQuery = useTaskQuery(taskId)
  const topics = useTopicsQuery()
  const start = useStartStudySessionMutation()

  useEffect(() => {
    if (activeQuery.isSuccess) setActiveSession(activeQuery.data)
  }, [activeQuery.data, activeQuery.isSuccess])

  const selectedTopic = topics.data?.items.find((topic) => topic.id === (activeSession?.session.subjectId ?? subjectId))
  const begin = () => start.mutate({ subjectId: subjectId || null }, {
    onSuccess: (session) => {
      setActiveSession(toActiveSession(session))
      toast.success('Đã bắt đầu phiên học')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể bắt đầu phiên học')),
  })

  if (activeQuery.isLoading && !activeSession) return <div className="study-page"><Skeleton height={290} /></div>
  if (activeQuery.isError && !activeSession) return <div className="study-page"><EmptyState title="Không thể kiểm tra phiên tập trung" description="Kiểm tra kết nối rồi thử lại trước khi bắt đầu phiên mới." action={<Button onClick={() => activeQuery.refetch()}>Thử lại</Button>} /></div>

  if (activeSession) return <div className="study-page">
    <div className="page-heading study-page-heading"><div><p className="eyebrow">TẬP TRUNG</p><h1>Phiên học đang diễn ra</h1><p className="subtle">{taskQuery.data ? `Đang tập trung cho: ${taskQuery.data.title}` : 'Dành thời gian cho điều bạn muốn hoàn thành.'}</p></div><Link className="button secondary" to="/study/stats"><BarChart3 size={16} /> Thống kê thời gian</Link></div>
    <StudyTimerWidget active={activeSession} subjectName={selectedTopic?.name} onActiveChange={setActiveSession} onEnded={() => { setActiveSession(null); navigate('/study', { replace: true }); void activeQuery.refetch() }} />
  </div>

  return <div className="study-page">
    <div className="page-heading study-page-heading"><div><p className="eyebrow">TẬP TRUNG</p><h1>Bắt đầu phiên học</h1><p className="subtle">Chọn môn học nếu bạn muốn ghi nhận thời gian theo môn, hoặc bắt đầu một phiên tự do.</p></div><Link className="button secondary" to="/study/stats"><BarChart3 size={16} /> Thống kê thời gian</Link></div>
    <section className="panel study-start-panel">
      {taskId && !taskQuery.isLoading && taskQuery.data && <p className="study-task-context">Đang chuẩn bị tập trung cho: <strong>{taskQuery.data.title}</strong></p>}
      <Select label="Môn học (tùy chọn)" customMenu value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Phiên học tự do</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select>
      <Button onClick={begin} loading={start.isPending}><Play size={16} /> Bắt đầu học</Button>
    </section>
  </div>
}
