import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, ListPlus, ListTodo, MoreHorizontal, Pause, Play, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ConfirmDialog, Dropdown, ErrorState, Skeleton, Tabs, Tooltip } from '../components/ui'
import { NatureEmptyState, NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'
import { PLAN_STATUS_LABELS, PRIORITY_LABELS } from '../features/tasks/task.constants'
import { TaskDrawer } from '../features/tasks/components/TaskDrawer'
import { TaskList } from '../features/tasks/components/TaskList'
import { TaskQuickCreate } from '../features/tasks/components/TaskQuickCreate'
import { PlanBreakdownModal } from '../features/tasks/components/PlanBreakdownModal'
import type { Task } from '../features/tasks/tasks.api'
import { usePlanDeleteMutation, usePlanQuery, usePlanUpdateMutation, useTaskDeleteMutation, useTaskStatusMutation, useTasksQuery } from '../features/tasks/tasks.hooks'
import { formatTaskDate, formatTaskDeadline } from '../utils/taskDate'
import { getPlanHealth } from '../utils/planHealth'

type PlanTab = 'overview' | 'tasks'

function dateRange(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${formatTaskDate(startDate)} - ${formatTaskDate(endDate)}`
  if (startDate) return `Bắt đầu ${formatTaskDate(startDate)}`
  if (endDate) return `Hạn ${formatTaskDate(endDate)}`
  return 'Chưa đặt thời gian'
}

function taskSummary(taskDone: number, taskTotal: number) {
  return taskTotal > 0 ? `${taskDone}/${taskTotal} công việc` : 'Chưa có công việc'
}

export function StudyPlanDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<PlanTab>('overview')
  const [drawerId, setDrawerId] = useState('')
  const [taskToDelete, setTaskToDelete] = useState('')
  const [planDeleteOpen, setPlanDeleteOpen] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [quickCreateFocusKey, setQuickCreateFocusKey] = useState(0)
  const planQuery = usePlanQuery(id)
  const tasksQuery = useTasksQuery({ studyPlanId: id, sort: 'dueDate', order: 'asc', limit: 100 })
  const updatePlan = usePlanUpdateMutation()
  const deletePlan = usePlanDeleteMutation()
  const updateTaskStatus = useTaskStatusMutation()
  const deleteTask = useTaskDeleteMutation()
  const plan = planQuery.data
  const tasks = tasksQuery.data?.items ?? []
  const nextTasks = tasks.filter((task) => task.status !== 'done').slice(0, 3)

  const openQuickCreate = () => {
    setTab('tasks')
    setQuickCreateFocusKey((current) => current + 1)
  }

  if (planQuery.isLoading) return <div className="plan-detail-page"><Skeleton height={220} /><Skeleton height={250} /></div>
  if (planQuery.isError || !plan) return <ErrorState title="Không thể tải kế hoạch." description="Thử lại sau một chút." action={<Button onClick={() => void planQuery.refetch()}>Thử lại</Button>} />

  const taskTotal = plan.taskTotal ?? 0
  const taskDone = plan.taskDone ?? 0
  const progressPercent = Math.min(100, Math.max(0, plan.progressPercent))
  const statusLabel = PLAN_STATUS_LABELS[plan.status]
  const priorityLabel = PRIORITY_LABELS[plan.priority]
  const canPause = plan.status === 'in_progress'
  const canResume = plan.status === 'paused'
  const health = getPlanHealth(plan.startDate, plan.endDate, progressPercent)

  const changePlanStatus = (status: 'paused' | 'in_progress') => {
    updatePlan.mutate({ id: plan.id, input: { status } }, {
      onSuccess: () => toast.success(status === 'paused' ? 'Đã tạm dừng kế hoạch' : 'Đã tiếp tục kế hoạch'),
      onError: () => toast.error('Không thể cập nhật trạng thái kế hoạch'),
    })
  }

  const continuePlan = () => {
    setTab('tasks')
    if (canResume) changePlanStatus('in_progress')
  }

  return <div className="plan-detail-page">
    <Link className="back-link" to="/study-plans"><ArrowLeft size={16} /> Kế hoạch</Link>
    <section className="panel plan-detail-hero">
      <div className="plan-detail-hero-copy">
        <p className="eyebrow">KẾ HOẠCH CỦA BẠN</p>
        <h1>{plan.title}</h1>
        {plan.subject && <Link className="plan-detail-subject" to={`/topics/${plan.subject.id}`}>{plan.subject.code ? `${plan.subject.code} · ${plan.subject.name}` : plan.subject.name}</Link>}
        <p className="plan-detail-goal">{plan.targetGoal ? <>Mục tiêu: <strong>{plan.targetGoal}</strong></> : 'Chưa đặt mục tiêu cho kế hoạch này.'}</p>
        <div className="plan-detail-badges"><span className={`plan-status plan-${plan.status}`} aria-label={`Trạng thái: ${statusLabel}`}>{statusLabel}</span><span className={`priority priority-${plan.priority}`} aria-label={`Ưu tiên: ${priorityLabel}`}>{priorityLabel}</span>{health && <Tooltip label="Đánh giá dựa trên thời gian đã trôi qua và tiến độ công việc."><span className={`plan-health plan-health-${health.status}`}>{health.label}</span></Tooltip>}</div>
        <div className="plan-detail-progress"><div className="progress-line" aria-label={`${progressPercent}% hoàn thành`}><i style={{ width: `${progressPercent}%` }} /></div><strong>{progressPercent}%</strong></div>
        <div className="plan-detail-metrics"><span><CheckCircle2 size={15} /> {taskSummary(taskDone, taskTotal)}</span>{plan.endDate && <span><CalendarDays size={15} /> {formatTaskDeadline(plan.endDate)}</span>}{plan.estimatedHours !== null && plan.estimatedHours !== undefined && plan.estimatedHours > 0 && <span><Clock3 size={15} /> {plan.estimatedHours} giờ dự kiến</span>}</div>
      </div>
      <div className="plan-detail-hero-art" aria-hidden="true"><img className="plan-detail-forest" src={natureAssets.flora.bush} width={84} height={84} loading="lazy" decoding="async" alt="" /><NatureMascot animal="fox" motion="none" size={136} className="plan-detail-fox" /></div>
      <div className="plan-detail-actions">
        <Button onClick={continuePlan}><Play size={16} /> Tiếp tục</Button>
        <Button onClick={openQuickCreate}><Plus size={16} /> Thêm công việc</Button>
        <Dropdown ariaLabel={`Thao tác với ${plan.title}`} label={<><MoreHorizontal size={18} /><span className="sr-only">Thao tác với {plan.title}</span></>} showChevron={false}>
          <button type="button" className="menu-item" onClick={() => setBreakdownOpen(true)}><ListPlus size={15} /> Chia nhỏ kế hoạch</button>
          <Link className="menu-item" to={`/ai-coach?studyPlanId=${encodeURIComponent(plan.id)}`}><Sparkles size={15} /> Điều chỉnh bằng AI</Link>
          {canPause && <button type="button" className="menu-item" onClick={() => changePlanStatus('paused')}><Pause size={15} /> Tạm dừng</button>}
          {canResume && <button type="button" className="menu-item" onClick={() => changePlanStatus('in_progress')}><Play size={15} /> Tiếp tục</button>}
          <button type="button" className="menu-item danger-text" onClick={() => setPlanDeleteOpen(true)}><Trash2 size={15} /> Xóa</button>
        </Dropdown>
      </div>
    </section>

    <div className="plan-detail-tabs"><Tabs items={[{ value: 'overview', label: 'Tổng quan' }, { value: 'tasks', label: `Công việc${taskTotal ? ` (${taskTotal})` : ''}` }]} value={tab} onChange={setTab} /></div>

    {tab === 'overview' ? <section className="plan-overview-grid">
      <article className="panel plan-overview-card"><h2>Tổng quan</h2>{plan.description ? <p>{plan.description}</p> : <p className="subtle">Chưa có mô tả cho kế hoạch này.</p>}<dl className="plan-overview-details">{plan.targetGoal && <div><dt>Mục tiêu</dt><dd>{plan.targetGoal}</dd></div>}{plan.subject && <div><dt>Môn học</dt><dd><Link to={`/topics/${plan.subject.id}`}>{plan.subject.code ? `${plan.subject.code} · ${plan.subject.name}` : plan.subject.name}</Link></dd></div>}<div><dt>Thời gian</dt><dd>{dateRange(plan.startDate, plan.endDate)}</dd></div>{plan.estimatedHours !== null && plan.estimatedHours !== undefined && <div><dt>Thời gian dự kiến</dt><dd>{plan.estimatedHours} giờ</dd></div>}<div><dt>Tiến độ</dt><dd>{progressPercent}% · {taskSummary(taskDone, taskTotal)}</dd></div></dl></article>
      <article className="panel plan-next-tasks"><div className="plan-section-heading"><div><h2>Việc tiếp theo</h2><p className="subtle">Ba bước gần nhất của kế hoạch.</p></div><button type="button" onClick={() => setTab('tasks')}>Xem tất cả</button></div>{tasksQuery.isLoading ? <Skeleton height={150} /> : nextTasks.length ? <div>{nextTasks.map((task) => <NextTask key={task.id} task={task} onOpen={() => setDrawerId(task.id)} />)}</div> : <PlanTaskEmptyState onCreate={openQuickCreate} />}</article>
    </section> : <section className="plan-tasks-section"><TaskQuickCreate subjectId={plan.subjectId ?? undefined} studyPlanId={plan.id} focusKey={quickCreateFocusKey} onCreated={() => setTab('tasks')} />{tasksQuery.isLoading ? <div className="task-list-page">{[1, 2, 3].map((item) => <Skeleton key={item} height={116} />)}</div> : tasksQuery.isError ? <ErrorState title="Không thể tải công việc." action={<Button onClick={() => void tasksQuery.refetch()}>Thử lại</Button>} /> : tasks.length ? <TaskList tasks={tasks} onOpen={setDrawerId} onStatusChange={(taskId, status) => updateTaskStatus.mutate({ id: taskId, status })} onDelete={setTaskToDelete} /> : <PlanTaskEmptyState onCreate={openQuickCreate} />}</section>}

    <TaskDrawer id={drawerId} onClose={() => setDrawerId('')} onDelete={setTaskToDelete} />
    <PlanBreakdownModal open={breakdownOpen} plan={plan} onClose={() => setBreakdownOpen(false)} />
    <ConfirmDialog open={Boolean(taskToDelete)} title="Xóa công việc?" description="Công việc sẽ được ẩn khỏi kế hoạch này." onCancel={() => setTaskToDelete('')} onConfirm={() => deleteTask.mutate(taskToDelete, { onSuccess: () => { setTaskToDelete(''); toast.success('Đã xóa công việc') }, onError: () => toast.error('Không thể xóa công việc') })} loading={deleteTask.isPending} />
    <ConfirmDialog open={planDeleteOpen} title="Xóa kế hoạch?" description="Kế hoạch sẽ được ẩn khỏi danh sách, các công việc vẫn được giữ lại." onCancel={() => setPlanDeleteOpen(false)} onConfirm={() => deletePlan.mutate(plan.id, { onSuccess: () => { toast.success('Đã xóa kế hoạch'); navigate('/study-plans') }, onError: () => toast.error('Không thể xóa kế hoạch') })} loading={deletePlan.isPending} />
  </div>
}

function PlanTaskEmptyState({ onCreate }: { onCreate: () => void }) {
  return <NatureEmptyState
    mascot="plan"
    size="lg"
    title="Kế hoạch này chưa có công việc."
    description="Hãy chia hành trình thành những bước nhỏ."
    action={<Button onClick={onCreate}><Plus size={16} /> Thêm công việc đầu tiên</Button>}
  />
}

function NextTask({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return <button type="button" className="plan-next-task" onClick={onOpen}><span className={`plan-next-task-dot task-status-${task.status}`} /><span><strong>{task.title}</strong><small>{formatTaskDeadline(task.dueDate)}</small></span></button>
}
