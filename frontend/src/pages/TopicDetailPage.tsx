import { ArrowLeft, ArrowRight, Check, CheckSquare, Clock3, FileText, Gauge, NotebookPen, Plus, Sparkles } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { NatureEmptyState, NatureMascot } from '../components/nature'
import { Button, EmptyState, ErrorState, Skeleton, Tabs } from '../components/ui'
import { natureAssets } from '../config/natureAssets'
import { useTopicQuery } from '../features/learning/learning.hooks'
import { TaskList } from '../features/tasks/components/TaskList'
import { TaskQuickCreate } from '../features/tasks/components/TaskQuickCreate'
import { StartStudyButton } from '../features/study-sessions/StartStudyButton'
import type { Priority, StudyPlan, Task, TaskStatus } from '../features/tasks/tasks.api'
import { usePlansQuery, useTaskStatusMutation, useTasksQuery } from '../features/tasks/tasks.hooks'
import { formatTaskDeadline } from '../utils/taskDate'
import { useDocumentsQuery } from '../features/documents/documents.hooks'
import { useNotesQuery } from '../features/notes/notes.hooks'
import { sanitizeNoteHtml } from '../utils/sanitizeNoteHtml'

type DetailTab = 'overview' | 'tasks' | 'documents' | 'notes'
type SubjectTaskScope = 'open' | 'in_progress' | 'done' | 'all'

const priorityWeight: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const dayMilliseconds = 86_400_000

function localDay(value?: string | null) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function taskUrgency(task: Task, today: Date) {
  const dueDate = localDay(task.dueDate)
  if (dueDate) {
    const difference = Math.round((dueDate.getTime() - today.getTime()) / dayMilliseconds)
    if (difference < 0) return 0
    if (difference === 0) return 1
    if (difference <= 7) return 2
  }
  if (task.priority === 'urgent' || task.priority === 'high') return 3
  if (task.status === 'in_progress') return 4
  return 5
}

function priorityTasks(tasks: Task[]) {
  const today = localDay(new Date().toISOString()) ?? new Date()
  return tasks
    .filter((task) => task.status !== 'done')
    .sort((left, right) => {
      const urgency = taskUrgency(left, today) - taskUrgency(right, today)
      if (urgency !== 0) return urgency
      const priority = priorityWeight[left.priority] - priorityWeight[right.priority]
      if (priority !== 0) return priority
      const leftDue = localDay(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightDue = localDay(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftDue - rightDue
    })
    .slice(0, 5)
}

export function TopicDetailPage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [taskScope, setTaskScope] = useState<SubjectTaskScope>('open')
  const [quickCreateFocusKey, setQuickCreateFocusKey] = useState(0)
  const statusTask = useTaskStatusMutation()
  const query = useTopicQuery(id)
  const tasks = useTasksQuery({ subjectId: id, page: 1, limit: 100, sort: 'sortOrder', order: 'asc' })
  const plans = usePlansQuery({ subjectId: id, status: 'in_progress', limit: '3', sort: 'endDate', order: 'asc' }, { enabled: Boolean(id) })
  const documents = useDocumentsQuery({ subjectId: id, page: 1, limit: 5 })
  const notes = useNotesQuery({ subjectId: id, page: 1, limit: 5 })

  useEffect(() => {
    if (tab === 'documents' && documents.data?.pagination.total === 0) setTab('overview')
    if (tab === 'notes' && notes.data?.pagination.total === 0) setTab('overview')
  }, [documents.data?.pagination.total, notes.data?.pagination.total, tab])

  if (query.isLoading) return <div className="topic-detail"><Skeleton height={260} /></div>
  if (query.isError || !query.data) return <ErrorState title="Không thể tải môn học." action={<Link className="button secondary" to="/topics">Quay lại môn học</Link>} />

  const topic = query.data
  const topicAccentStyle = { '--topic-accent': topic.colorHex } as CSSProperties
  const taskItems = tasks.data?.items ?? []
  const totalTasks = topic.statistics.taskTotal
  const completedTasks = topic.statistics.taskDone
  const remainingTasks = Math.max(totalTasks - completedTasks, 0)
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const topTasks = priorityTasks(taskItems)
  const visibleTasks = taskItems.filter((task) => taskScope === 'all' || (taskScope === 'open' && task.status !== 'done') || (taskScope === 'in_progress' && task.status === 'in_progress') || (taskScope === 'done' && task.status === 'done'))
  const openTaskCreate = () => { setTab('tasks'); setQuickCreateFocusKey((current) => current + 1) }
  const statusLabel = topic.status === 'completed' ? 'Hoàn thành' : topic.status === 'dropped' ? 'Tạm dừng' : topic.status === 'archived' ? 'Đã lưu trữ' : 'Đang học'
  const updateStatus = (taskId: string, status: TaskStatus) => statusTask.mutate({ id: taskId, status })
  const tabs: Array<{ value: DetailTab; label: React.ReactNode }> = [
    { value: 'overview', label: 'Tổng quan' },
    { value: 'tasks', label: <><CheckSquare size={14} /> Công việc</> },
    ...(documents.data?.pagination.total ? [{ value: 'documents' as const, label: <><FileText size={14} /> Tài liệu</> }] : []),
    ...(notes.data?.pagination.total ? [{ value: 'notes' as const, label: <><NotebookPen size={14} /> Ghi chú</> }] : []),
  ]
  const taskList = tasks.isLoading
    ? <Skeleton height={120} />
    : tasks.isError
      ? <ErrorState compact title="Không thể tải công việc." action={<Button variant="secondary" onClick={() => void tasks.refetch()}>Thử lại</Button>} />
      : visibleTasks.length
      ? <TaskList tasks={visibleTasks} mode="compact" onStatusChange={updateStatus} />
        : <SubjectTaskEmptyState onCreate={openTaskCreate} />

  return <div className="topic-detail">
    <Link className="back-link" to="/topics"><ArrowLeft size={15} /> Môn học</Link>

    <header className="topic-detail-head" style={topicAccentStyle}>
      <div className="topic-detail-copy">
        <p className="eyebrow">{topic.code}</p>
        <h1>{topic.name}</h1>
        <p className="subtle">{topic.credits > 0 && `${topic.credits} tín chỉ`}{topic.credits > 0 && statusLabel && ' · '}{statusLabel}</p>
        {topic.lecturer && <p className="topic-detail-field">Giảng viên: <strong>{topic.lecturer}</strong></p>}
        {topic.targetGrade !== null && topic.targetGrade !== undefined && <p className="topic-detail-field">Mục tiêu: <strong>{Number(topic.targetGrade).toFixed(1)}</strong></p>}
      </div>
      <div className="topic-detail-header-actions">
        <Button variant="secondary" onClick={openTaskCreate}><Plus size={16} /> Công việc</Button>
        <StartStudyButton subjectId={id} />
        <Link className="topic-detail-ai-link" to={`/ai-coach?subjectId=${encodeURIComponent(id)}`}><Sparkles size={15} /> Hỏi AI</Link>
      </div>
      <div className="topic-detail-scenic" aria-hidden="true">
        <span className="topic-scenic-pine topic-scenic-pine-left" />
        <span className="topic-scenic-pine topic-scenic-pine-right" />
        <img className="topic-scenic-grass" src={natureAssets.flora.bush} alt="" width="90" height="90" />
        <NatureMascot animal="fox" motion="none" size={112} className="topic-scenic-fox" />
      </div>
    </header>

    <Tabs value={tab} onChange={setTab} items={tabs} />

    {tab === 'overview'
      ? <>
        <section className="panel topic-overview-progress">
          <div><p className="eyebrow">TIẾN ĐỘ MÔN HỌC</p><h2>{progressPercent}% hoàn thành</h2><p className="subtle">Tiến độ được tính từ các công việc trong môn học.</p></div>
          <div className="topic-progress-value"><div className="topic-progress-track"><i style={{ width: `${progressPercent}%` }} /></div><strong>{completedTasks}/{totalTasks}</strong></div>
        </section>
        <section className="topic-stats">
          <Stat label="Việc còn lại" value={remainingTasks} icon={<CheckSquare size={18} />} />
          <Stat label="Hoàn thành" value={completedTasks} icon={<Gauge size={18} />} />
          <Stat label="Giờ học" value={`${topic.statistics.totalStudyMinutes} phút`} icon={<Clock3 size={18} />} />
          <Stat label="Điểm" value={topic.statistics.currentAverage ?? '—'} icon={<NotebookPen size={18} />} />
        </section>
        <section className="panel topic-priority-panel">
          <div className="topic-priority-heading"><div><p className="eyebrow">VIỆC CẦN ƯU TIÊN</p><h2>Bước tiếp theo</h2></div><span>{topTasks.length} việc</span></div>
          {tasks.isLoading
            ? <Skeleton height={120} />
            : tasks.isError
              ? <p className="subtle">Chưa thể tải các công việc ưu tiên.</p>
              : topTasks.length
                ? <div className="topic-priority-list">{topTasks.map((task) => <PriorityTask key={task.id} task={task} onComplete={() => updateStatus(task.id, 'done')} />)}</div>
                : <NatureEmptyState mascot="subject" size="sm" title="Môn học chưa có việc cần làm" description="Tạo một công việc để bắt đầu theo dõi tiến độ." action={<Button variant="secondary" onClick={openTaskCreate}><Plus size={15} /> Thêm công việc</Button>} />}
          {taskItems.length > 0 && <button type="button" className="topic-view-all-tasks" onClick={() => setTab('tasks')}>Xem tất cả công việc <ArrowRight size={15} /></button>}
        </section>
        <SubjectPlansPanel plans={plans.data?.items ?? []} loading={plans.isLoading} error={plans.isError} onRetry={() => void plans.refetch()} />
      </>
      : tab === 'tasks' ? <section className="panel topic-task-panel">
        <div className="panel-heading"><div><h2>Công việc</h2><p className="subtle">Theo dõi các việc trong môn học này.</p></div><Link className="topic-kanban-link" to={`/kanban?subjectId=${id}`}>Xem trong Kanban <ArrowRight size={15} /></Link></div>
        <div className="topic-task-scopes" role="group" aria-label="Lọc công việc môn học">
          <button type="button" className={taskScope === 'open' ? 'active' : ''} onClick={() => setTaskScope('open')}>Chưa hoàn thành</button>
          <button type="button" className={taskScope === 'in_progress' ? 'active' : ''} onClick={() => setTaskScope('in_progress')}>Đang làm</button>
          <button type="button" className={taskScope === 'done' ? 'active' : ''} onClick={() => setTaskScope('done')}>Hoàn thành</button>
          <button type="button" className={taskScope === 'all' ? 'active' : ''} onClick={() => setTaskScope('all')}>Tất cả</button>
        </div>
        <TaskQuickCreate subjectId={id} focusKey={quickCreateFocusKey} placeholder={`Thêm công việc cho ${topic.name}...`} />
        {taskList}
      </section>
      : tab === 'documents' ? <section className="panel topic-resource-panel"><div className="panel-heading"><div><h2>Tài liệu môn học</h2><p className="subtle">Các tệp đã được liên kết với môn học này.</p></div><Link className="topic-kanban-link" to={`/documents?subjectId=${id}`}>Mở thư viện <ArrowRight size={15} /></Link></div><div className="topic-resource-list">{documents.data?.items.map((item) => <Link key={item.id} to={`/documents?subjectId=${id}`}><FileText size={16} /><span><strong>{item.title}</strong><small>{item.fileType.toUpperCase()}{item.tags.length ? ` · ${item.tags.join(', ')}` : ''}</small></span></Link>)}</div></section>
      : <section className="panel topic-resource-panel"><div className="panel-heading"><div><h2>Ghi chú môn học</h2><p className="subtle">Những ghi chú có liên kết với môn học này.</p></div><Link className="topic-kanban-link" to={`/notes?subjectId=${id}`}>Mở ghi chú <ArrowRight size={15} /></Link></div><div className="topic-resource-list">{notes.data?.items.map((item) => <Link key={item.id} to={`/notes?subjectId=${id}`}><NotebookPen size={16} /><span><strong>{item.title}</strong><small dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(item.contentRichText) }} /></span></Link>)}</div></section>}
  </div>
}

function PriorityTask({ task, onComplete }: { task: Task; onComplete: () => void }) {
  return <div className="topic-priority-task">
    <button type="button" className="topic-priority-complete" onClick={onComplete} aria-label={`Đánh dấu hoàn thành ${task.title}`}><Check size={13} /></button>
    <div><strong>{task.title}</strong>{task.subject?.name && <small>{task.subject.name}</small>}</div>
    <span>{formatTaskDeadline(task.dueDate)}</span>
  </div>
}

function SubjectPlansPanel({ plans, loading, error, onRetry }: { plans: StudyPlan[]; loading: boolean; error: boolean; onRetry: () => void }) {
  return <section className="panel topic-plans-panel">
    <div className="topic-priority-heading"><div><p className="eyebrow">KẾ HOẠCH CỦA MÔN</p><h2>Lộ trình đang thực hiện</h2></div><Link className="topic-kanban-link" to="/study-plans">Xem tất cả <ArrowRight size={15} /></Link></div>
    {loading
      ? <div className="topic-plan-list"><Skeleton height={76} /><Skeleton height={76} /></div>
      : error
        ? <ErrorState compact title="Không thể tải kế hoạch của môn học." action={<Button variant="secondary" onClick={onRetry}>Thử lại</Button>} />
        : plans.length
          ? <div className="topic-plan-list">{plans.map((plan) => <SubjectPlanPreview key={plan.id} plan={plan} />)}</div>
          : <NatureEmptyState size="sm" title="Chưa có kế hoạch đang thực hiện" description="Tạo một lộ trình cho môn học này khi bạn cần chia nhỏ mục tiêu." action={<Link className="button secondary" to="/study-plans"><Plus size={15} /> Tạo kế hoạch</Link>} />}
  </section>
}

function SubjectTaskEmptyState({ onCreate }: { onCreate: () => void }) {
  return <NatureEmptyState
    mascot="subject"
    size="lg"
    title="Môn học này chưa có công việc."
    description="Thêm một việc để bắt đầu theo dõi tiến độ."
    action={<Button onClick={onCreate}><Plus size={16} /> Thêm công việc</Button>}
  />
}

function SubjectPlanPreview({ plan }: { plan: StudyPlan }) {
  const progress = Math.min(100, Math.max(0, plan.progressPercent))
  const taskLabel = plan.taskTotal > 0 ? `${plan.taskDone}/${plan.taskTotal} công việc` : null
  const deadline = plan.endDate ? formatTaskDeadline(plan.endDate) : null

  return <Link className="topic-plan-preview" to={`/study-plans/${plan.id}`}>
    <span className="topic-plan-accent" aria-hidden="true" />
    <span className="topic-plan-copy"><strong>{plan.title}</strong>{plan.targetGoal && <small>Mục tiêu {plan.targetGoal}</small>}</span>
    <span className="topic-plan-progress"><span aria-label={`${progress}% tiến độ`}><i style={{ width: `${progress}%` }} /></span><strong>{progress}%</strong></span>
    {(taskLabel || deadline) && <span className="topic-plan-meta">{taskLabel}{taskLabel && deadline && <i aria-hidden="true">·</i>}{deadline}</span>}
    <ArrowRight className="topic-plan-arrow" size={16} aria-hidden="true" />
  </Link>
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <div className="stat-card topic-stat"><span className="stat-icon blue">{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong></div>
}
