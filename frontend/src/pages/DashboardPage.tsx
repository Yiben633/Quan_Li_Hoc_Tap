import { ArrowUpRight, BookOpen, CalendarDays, Check, CheckSquare, Clock3, Flame, ListTodo, Plus, Sparkles, Target, type LucideIcon } from 'lucide-react'
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { ChartLegend, EmptyState, ErrorState, Skeleton, Tabs } from '../components/ui'
import { useDashboardSummaryQuery, useProgressChartQuery } from '../features/dashboard/dashboard.hooks'
import { useAuthStore } from '../stores/authStore'
import type { DashboardSubject, DashboardSummary } from '../features/dashboard/dashboard.api'
import { useState } from 'react'
import { useOverdueTasksQuery, usePlansQuery, useTasksQuery, useTaskStatusMutation, useTodayTasksQuery } from '../features/tasks/tasks.hooks'
import { getVietnamTodayKey } from '../utils/vietnamTime'
import { formatTaskDeadline, isTaskDeadlineOverdue } from '../utils/taskDate'
import { NatureFlora, NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'
import type { StudyPlan, Task } from '../features/tasks/tasks.api'
import { TaskList } from '../features/tasks/components/TaskList'
import { useStudyTimeStatisticsQuery } from '../features/study-sessions/studySessions.hooks'
import { aiFeaturesEnabled } from '../config/features'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { DashboardPomodoroCard } from '../features/dashboard/DashboardPomodoroCard'
import { DashboardWeeklyCalendar } from '../features/dashboard/DashboardWeeklyCalendar'
import { DashboardNextTasksPanel } from '../features/dashboard/DashboardNextTasksPanel'
import { getNextTaskScore } from '../utils/nextTask'

type Range = 'week' | 'month'

type DashboardSummaryMetricTone = 'pine' | 'sage' | 'moss' | 'amber'

const dashboardSummaryMetricMetadata = {
  tasksRemaining: { icon: CalendarDays, tone: 'pine' },
  studyTime: { icon: Clock3, tone: 'sage' },
  weeklyProgress: { icon: CalendarDays, tone: 'moss' },
  streak: { icon: Flame, tone: 'amber' },
} as const satisfies Record<string, { icon: LucideIcon; tone: DashboardSummaryMetricTone }>

type DashboardSummaryMetricKind = keyof typeof dashboardSummaryMetricMetadata

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [range, setRange] = useState<Range>('week')
  const summary = useDashboardSummaryQuery()
  const chart = useProgressChartQuery(range)
  const weeklyProgress = useProgressChartQuery('week')
  const streakChart = useProgressChartQuery('month')
  const todayStudy = useStudyTimeStatisticsQuery({ range: 'day' })
  const plans = usePlansQuery({ status: 'in_progress', limit: '1' })
  const todayTasks = useTodayTasksQuery()
  const overdueTasks = useOverdueTasksQuery()
  const taskStatus = useTaskStatusMutation()

  if (summary.isLoading) return <DashboardSkeleton />
  if (summary.isError) return <DashboardError onRetry={() => summary.refetch()} />

  const data = summary.data
  if (!data) return <DashboardError onRetry={() => summary.refetch()} />
  const nameParts = user?.fullName?.trim().split(/\s+/) ?? []
  const firstName = nameParts[nameParts.length - 1] || 'bạn'
  const hasData = data.tasksToday.length > 0 || data.activeSubjects.length > 0 || data.upcomingSchedules.length > 0 || Boolean(plans.data?.items.length)
  const todayKey = getVietnamTodayKey()
  const chartData = chart.data?.points.map((point, index, points) => ({ ...point, label: range === 'month' && index % 2 !== 0 && index !== points.length - 1 && point.date !== todayKey ? '' : formatChartDate(point.date, range) })) ?? []
  const streak = streakChart.data ? currentStudyStreak(streakChart.data.points, todayKey) : null
  const todayTasksRemaining = data.tasksToday.filter((task) => task.status !== 'done').length
  const weeklyTasksDone = weeklyProgress.data?.points.reduce((total, point) => total + point.taskDone, 0)
  const todayTaskItems = mergeTodayTasks(overdueTasks.data ?? [], todayTasks.data ?? [])

  return (
    <div className="dashboard">
      <DashboardHero firstName={firstName} streak={streakChart.isLoading ? undefined : streakChart.isError ? null : streak ?? 0} />

      {!hasData && <section className="panel dashboard-welcome"><EmptyState icon={<Target size={24} />} title="Bắt đầu xây dựng nhịp của bạn" description="Tạo một việc hoặc một kế hoạch nhỏ. Bạn luôn có thể thêm môn học sau." action={<div className="quick-actions"><Link className="button primary" to="/tasks"><Plus size={16} /> Tạo việc đầu tiên</Link><Link className="button secondary" to="/study-plans"><Plus size={16} /> Tạo kế hoạch</Link></div>} /></section>}

      <div className="dashboard-architecture-grid dashboard-overview-grid">
        <DashboardTodaySummary
          tasksRemaining={todayTasksRemaining}
          studyMinutes={todayStudy.isLoading ? undefined : todayStudy.isError ? null : todayStudy.data?.totalMinutes ?? 0}
          weeklyTasksDone={weeklyProgress.isLoading ? undefined : weeklyProgress.isError ? null : weeklyTasksDone ?? 0}
          streak={streakChart.isLoading ? undefined : streakChart.isError ? null : streak ?? 0}
        />
        <ActiveSubjectsPanel subjects={data.activeSubjects} />
        <DashboardPomodoroCard />
      </div>

      <div className="dashboard-architecture-grid dashboard-schedule-grid">
        <TodayTaskList tasks={todayTaskItems} loading={todayTasks.isLoading || overdueTasks.isLoading} error={todayTasks.isError || overdueTasks.isError} onRetry={() => { void todayTasks.refetch(); void overdueTasks.refetch() }} onStatusChange={(id, status) => taskStatus.mutate({ id, status })} />
        <DashboardWeeklyCalendar />
      </div>

      <div className="dashboard-architecture-grid dashboard-progress-grid">
        <section className="panel progress-panel dashboard-weekly-activity">
          <div className="panel-heading"><div><h2>Hoạt động tuần</h2><p className="subtle">Thời gian tập trung và việc đã hoàn thành</p></div><Tabs value={range} onChange={setRange} items={[{ value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }]} /></div>
          {chart.isLoading ? <ChartSkeleton /> : chart.isError ? <InlineError onRetry={() => chart.refetch()} /> : chartData.length ? <><ChartLegend items={[{ label: 'Tập trung', tone: 'pine' }, { label: 'Hoàn thành', tone: 'moss' }]} /><div className="chart-wrap dashboard-activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}><defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--nature-pine)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--nature-pine)" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" interval={range === 'week' ? 0 : 1} minTickGap={range === 'week' ? 0 : 8} axisLine={false} tickLine={false} tick={{ fill: 'var(--nature-text-muted)', fontSize: range === 'week' ? 11 : 10 }} /><YAxis hide /><Tooltip content={<WeeklyActivityTooltip />} cursor={{ stroke: 'var(--nature-sage)', strokeDasharray: '3 3' }} /><Area name="Tập trung" type="monotone" dataKey="studyMinutes" stroke="var(--nature-pine)" strokeWidth={2.5} fill="url(#studyFill)" /><Line name="Hoàn thành" type="monotone" dataKey="taskDone" stroke="var(--nature-moss)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--nature-moss)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--nature-sand)', stroke: 'var(--nature-moss)', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div><ActivityHeatmap points={chart.data?.points ?? []} /></> : <EmptyState title="Chưa có dữ liệu tiến độ" description="Thời gian học và việc hoàn thành sẽ xuất hiện ở đây." />}
        </section>
        <DashboardNextTasksPanel />
        <ActivePlansPanel plan={plans.data?.items[0]} loading={plans.isLoading} error={plans.isError} onRetry={() => plans.refetch()} />
      </div>

      <AICoachPanel briefing={data.dailyBriefing} available={aiFeaturesEnabled} />
    </div>
  )
}

function DashboardHero({ firstName, streak }: { firstName: string; streak: number | null | undefined }) {
  const showScene = useMediaQuery('(min-width: 768px)')
  const useFullHeroScene = useMediaQuery('(min-width: 1025px)')

  return <section className="dashboard-hero">
    <div className="dashboard-hero-content">
      <p className="dashboard-hero-eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
      <h1>Xin chào, {firstName}!</h1>
      <p>Một ngày mới, một cơ hội để tiến thêm một bước.</p>
      {streak !== null && <div className="dashboard-hero-metrics" aria-label={streak === undefined ? 'Đang tải chuỗi học' : `Chuỗi học hiện tại: ${streak} ngày`}>
        <span className="dashboard-hero-streak-icon"><Flame size={17} aria-hidden="true" /></span>
        <span>Chuỗi học</span>
        {streak === undefined ? <Skeleton width={34} height={15} /> : <strong>{streak} ngày</strong>}
      </div>}
      <div className="dashboard-hero-actions">
        <Link className="button primary" to="/tasks"><CheckSquare size={17} /> Xem công việc</Link>
        <Link className="button secondary" to="/study"><Clock3 size={17} /> Bắt đầu tập trung</Link>
      </div>
    </div>
    {showScene && <div className="dashboard-hero-scene" aria-hidden="true">
      <img className="dashboard-hero-cloud nature-cloud--drift nature-motion" src={natureAssets.effects.cloud01} alt="" width={256} height={128} loading="eager" decoding="async" />
      <span className="dashboard-hero-mist" />
      <span className="dashboard-hero-mountains" />
      <span className="dashboard-hero-lake" />
      <NatureFlora name="bush" width={543} height={724} className="dashboard-hero-bush dashboard-hero-bush-back" />
      <NatureMascot animal="fox" motion={useFullHeroScene ? 'study' : 'none'} size={useFullHeroScene ? 188 : 132} priority={showScene} className="dashboard-hero-mascot" />
      <NatureFlora name="bush" width={543} height={724} className="dashboard-hero-bush dashboard-hero-bush-front" />
    </div>}
  </section>
}

function ActivePlansPanel({ plan, loading, error, onRetry }: { plan?: StudyPlan; loading: boolean; error: boolean; onRetry: () => void }) {
  return <section className="panel dashboard-plans-panel"><div className="panel-heading"><div><h2>Kế hoạch đang tiến hành</h2><p className="subtle">Lộ trình bạn đang theo đuổi</p></div><Link className="text-link" to="/study-plans">Xem tất cả <ArrowUpRight size={15} /></Link></div>{loading ? <div className="dashboard-preview-skeleton"><Skeleton height={154} /></div> : error ? <ErrorState compact title="Không thể tải kế hoạch." action={<button className="button secondary" onClick={onRetry}>Thử lại</button>} /> : plan ? <DashboardPlanCard plan={plan} /> : <EmptyState icon={<ListTodo size={22} />} title="Chưa có kế hoạch đang thực hiện" description="Tạo một lộ trình để chia mục tiêu thành các bước nhỏ." action={<Link className="button secondary" to="/study-plans"><Plus size={15} /> Tạo kế hoạch</Link>} />}</section>
}

function DashboardPlanCard({ plan }: { plan: StudyPlan }) {
  const planTasksQuery = useTasksQuery({ studyPlanId: plan.id, sort: 'dueDate', order: 'asc', limit: 100 })
  const progress = Math.min(100, Math.max(0, plan.progressPercent))
  const planTasks = planTasksQuery.data?.items ?? []
  const taskTotal = planTasksQuery.data ? planTasks.length : plan.taskTotal ?? 0
  const taskDone = planTasksQuery.data ? planTasks.filter((task) => task.status === 'done').length : plan.taskDone ?? 0
  const taskLabel = taskTotal > 0 ? `${taskDone}/${taskTotal} công việc` : 'Chưa có công việc'
  const deadline = plan.endDate ? formatTaskDeadline(plan.endDate) : 'Chưa đặt hạn'
  const checklistTasks = [...planTasks].sort((left, right) => {
    const leftDone = left.status === 'done'
    const rightDone = right.status === 'done'
    if (leftDone !== rightDone) return Number(leftDone) - Number(rightDone)
    if (!leftDone) {
      const scoreDifference = getNextTaskScore(right) - getNextTaskScore(left)
      if (scoreDifference !== 0) return scoreDifference
    }
    return left.title.localeCompare(right.title, 'vi') || left.id.localeCompare(right.id)
  }).slice(0, 4)

  return <article className="dashboard-trail-card">
    <div className="dashboard-trail-card-heading"><div><span>{plan.subject?.name ?? 'Kế hoạch cá nhân'}</span><h3><Link to={`/study-plans/${plan.id}`}>{plan.title}</Link></h3></div><strong>{progress}%</strong></div>
    <div className="dashboard-trail-progress" style={{ '--trail-progress': `${progress}%` } as React.CSSProperties} aria-label={`${progress}% tiến độ`}><span><i /></span></div>
    <div className="dashboard-trail-meta"><span className="dashboard-trail-task-count">{taskLabel}</span><span>{deadline}</span></div>
    {planTasksQuery.isLoading ? <div className="dashboard-plan-checklist-skeleton"><Skeleton height={34} /><Skeleton height={34} /><Skeleton height={34} /></div> : planTasksQuery.isError ? <div className="dashboard-plan-checklist-error"><span>Không thể tải checklist.</span><button type="button" onClick={() => planTasksQuery.refetch()}>Thử lại</button></div> : checklistTasks.length ? <ol className="dashboard-plan-checklist">{checklistTasks.map((task) => {
      const taskMeta = [task.estimatedMinutes !== null && task.estimatedMinutes !== undefined ? `${task.estimatedMinutes} phút` : null, formatTaskDeadline(task.dueDate)].filter(Boolean).join(' · ')
      const isDone = task.status === 'done'
      return <li key={task.id}><Link to={`/tasks?scope=all&taskId=${task.id}`}><span className={`dashboard-plan-checklist-mark${isDone ? ' is-done' : ''}`} aria-label={isDone ? 'Đã hoàn thành' : 'Chưa hoàn thành'}>{isDone && <Check size={12} aria-hidden="true" />}</span><span><strong>{task.title}</strong><small>{taskMeta}</small></span></Link></li>
    })}</ol> : <p className="dashboard-plan-checklist-empty">Kế hoạch này chưa có công việc.</p>}
    <Link className="dashboard-trail-open" to={`/study-plans/${plan.id}`}>Mở kế hoạch <ArrowUpRight size={14} /></Link>
  </article>
}

function getReliableTaskProgress(progress: DashboardSubject['taskProgress']) {
  if (!progress || !Number.isFinite(progress.taskTotal) || !Number.isFinite(progress.taskDone) || progress.taskTotal <= 0 || progress.taskDone < 0 || progress.taskDone > progress.taskTotal) return null

  return {
    taskDone: progress.taskDone,
    taskTotal: progress.taskTotal,
    progressPercent: Math.round((progress.taskDone / progress.taskTotal) * 100),
  }
}

function ActiveSubjectsPanel({ subjects }: { subjects: DashboardSubject[] }) {
  return <section className="panel dashboard-subjects-panel"><div className="panel-heading"><div><h2>Môn học đang học</h2><p className="subtle">Các không gian bạn đang duy trì</p></div><Link className="text-link" to="/subjects">Xem tất cả <ArrowUpRight size={15} /></Link></div>{subjects.length ? <div className="dashboard-subject-list">{subjects.slice(0, 4).map((subject) => {
    const progress = getReliableTaskProgress(subject.taskProgress)
    const accent = { '--subject-accent': subject.colorHex ?? 'var(--nature-sage)' } as React.CSSProperties
    return <Link className="dashboard-subject-row" key={subject.id} to={`/subjects/${subject.id}`} style={accent}>
      <span className="dashboard-subject-icon" aria-hidden="true"><BookOpen size={15} /></span>
      <span className="dashboard-subject-copy"><strong>{subject.name}</strong><small>{subject.code ?? 'Đang học'}</small>{progress && <small className="dashboard-subject-progress-label">Tiến độ công việc</small>}{progress && <span className="dashboard-subject-progress" aria-label={`Tiến độ công việc: ${progress.taskDone}/${progress.taskTotal} công việc hoàn thành, ${progress.progressPercent}%`}><span><i style={{ width: `${progress.progressPercent}%` }} /></span><b>{progress.progressPercent}%</b></span>}</span>
    </Link>
  })}</div> : <EmptyState icon={<BookOpen size={22} />} title="Chưa có môn học đang theo dõi" description="Thêm môn học để theo dõi tiến độ tại đây." action={<Link className="button secondary" to="/subjects"><Plus size={15} /> Thêm môn học</Link>} />}</section>
}

function AICoachPanel({ briefing, available }: { briefing?: DashboardSummary['dailyBriefing']; available: boolean }) {
  const briefingFacts = briefing ? [
    briefing.dueTodayCount > 0 ? `Hôm nay có ${briefing.dueTodayCount} công việc đến hạn.` : briefing.openTaskCount > 0 ? `Có ${briefing.openTaskCount} công việc chưa hoàn thành.` : 'Chưa có công việc đang mở.',
    briefing.availableSlot ? `Khoảng trống kế tiếp: ${briefing.availableSlot.startTime} - ${briefing.availableSlot.endTime}.` : null,
  ].filter((fact): fact is string => Boolean(fact)) : []
  const action = available
    ? { icon: Sparkles, label: 'Lập kế hoạch cùng AI', to: '/ai-coach' }
    : { icon: CalendarDays, label: 'Mở kế hoạch', to: '/study-plans' }
  const ActionIcon = action.icon

  return (
    <section className="panel dashboard-ai-panel">
      <div className="panel-heading">
        <div><p className="dashboard-ai-kicker">AI COACH</p><h2>Lập kế hoạch cùng AI</h2></div>
        <Sparkles size={20} className="panel-icon" />
      </div>
      <div className="dashboard-ai-content">
        <div className="dashboard-ai-copy">
          {available && briefingFacts.length > 0
            ? <div className="dashboard-ai-briefing">{briefingFacts.map((fact) => <p key={fact}>{fact}</p>)}</div>
            : <p>{available ? 'Mở AI Coach để lập kế hoạch từ công việc và lịch học của bạn.' : 'AI Coach chưa khả dụng trong môi trường này.'}</p>}
          <Link className="button secondary dashboard-ai-action" to={action.to}><ActionIcon size={15} /> {action.label}</Link>
        </div>
      </div>
    </section>
  )
}

function DashboardTodaySummary({ tasksRemaining, studyMinutes, weeklyTasksDone, streak }: { tasksRemaining: number; studyMinutes: number | null | undefined; weeklyTasksDone: number | null | undefined; streak: number | null | undefined }) {
  return <section className="panel dashboard-today-summary" aria-labelledby="dashboard-today-summary-title">
    <header><p className="eyebrow">HÔM NAY - TÓM TẮT</p><h2 id="dashboard-today-summary-title">Nhịp học của bạn</h2></header>
    <div className="dashboard-today-summary-grid">
      <DashboardSummaryMetric metric="tasksRemaining" label="Công việc còn lại" value={tasksRemaining} detail="Đến hạn hôm nay" />
      <DashboardSummaryMetric metric="studyTime" label="Thời gian học" value={studyMinutes} format={formatStudyMinutes} detail="Đã ghi nhận hôm nay" />
      <DashboardSummaryMetric metric="weeklyProgress" label="Tiến độ tuần" value={weeklyTasksDone} format={(value) => `${value} việc`} detail="Đã hoàn thành" />
      <DashboardSummaryMetric metric="streak" label="Chuỗi học" value={streak} format={(value) => `${value} ngày`} detail="Ngày liên tiếp" />
    </div>
  </section>
}

function DashboardSummaryMetric({ metric, label, value, format = String, detail }: { metric: DashboardSummaryMetricKind; label: string; value: number | null | undefined; format?: (value: number) => string; detail: string }) {
  const unavailable = value === null
  const { icon: Icon, tone } = dashboardSummaryMetricMetadata[metric]
  return <article className={`dashboard-summary-metric tone-${tone}`}>
    <span className="dashboard-summary-icon" aria-hidden="true"><Icon size={17} /></span>
    <span className="dashboard-summary-label">{label}</span>
    {value === undefined ? <Skeleton width={54} height={22} /> : <strong aria-label={unavailable ? `${label} chưa thể tải` : undefined}>{unavailable ? '—' : format(value)}</strong>}
    <small>{unavailable ? 'Chưa thể tải dữ liệu' : detail}</small>
  </article>
}

function formatStudyMinutes(minutes: number) { if (minutes < 60) return `${minutes} phút`; const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return remainder ? `${hours} giờ ${remainder} phút` : `${hours} giờ` }
function TodayTaskList({ tasks, loading, error, onRetry, onStatusChange }: { tasks: Task[]; loading: boolean; error: boolean; onRetry: () => void; onStatusChange: (id: string, status: Task['status']) => void }) {
  return <section className="panel task-panel dashboard-today-tasks"><div className="panel-heading"><div><p className="eyebrow">CÔNG VIỆC HÔM NAY</p><h2>Việc cần giữ nhịp</h2></div><Link className="text-link" to="/tasks">Xem tất cả <ArrowUpRight size={15} /></Link></div>{loading ? <div className="dashboard-today-tasks-skeleton"><Skeleton height={54} /><Skeleton height={54} /><Skeleton height={54} /></div> : error ? <ErrorState compact title="Không thể tải công việc hôm nay." action={<button className="button secondary" onClick={onRetry}>Thử lại</button>} /> : tasks.length ? <TaskList tasks={tasks} mode="compact" onStatusChange={onStatusChange} /> : <EmptyState icon={<Check size={22} />} title="Hôm nay chưa có việc" description="Bạn có thể tạo một việc nhỏ để bắt đầu." /> }<Link className="dashboard-today-tasks-add" to="/tasks"><Plus size={15} /> Thêm công việc</Link></section>
}

const priorityOrder: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function taskDueTimestamp(task: Task) {
  const timestamp = task.dueDate ? new Date(task.dueDate).getTime() : Number.MAX_SAFE_INTEGER
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

function mergeTodayTasks(overdue: Task[], today: Task[]) {
  const uniqueTasks = new Map<string, Task>()
  for (const task of [...overdue, ...today]) uniqueTasks.set(task.id, task)
  return [...uniqueTasks.values()]
    .sort((left, right) => {
      const overdueDifference = Number(isTaskDeadlineOverdue(right.dueDate)) - Number(isTaskDeadlineOverdue(left.dueDate))
      if (overdueDifference !== 0) return overdueDifference
      const dueDifference = taskDueTimestamp(left) - taskDueTimestamp(right)
      if (dueDifference !== 0) return dueDifference
      return priorityOrder[left.priority] - priorityOrder[right.priority]
    })
    .slice(0, 5)
}
function WeeklyActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; studyMinutes: number; taskDone: number } }> }) { const point = payload?.[0]?.payload; if (!active || !point) return null; return <div className="dashboard-chart-tooltip"><strong>{formatActivityDate(point.date)}</strong><span><i className="dashboard-chart-tooltip-pine" /> Tập trung <b>{point.studyMinutes} phút</b></span><span><i className="dashboard-chart-tooltip-moss" /> Hoàn thành <b>{point.taskDone} việc</b></span></div> }
function ActivityHeatmap({ points }: { points: Array<{ date: string; studyMinutes: number }> }) { const highest = Math.max(...points.map((point) => point.studyMinutes), 0); return <section className="dashboard-activity-heatmap" aria-label="Mức độ tập trung mỗi ngày"><div className="dashboard-activity-heatmap-head"><span>Nhịp tập trung</span><div aria-hidden="true"><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /></div></div><div className="dashboard-activity-heatmap-grid">{points.map((point) => { const level = activityLevel(point.studyMinutes, highest); const label = `${formatActivityDate(point.date)}: ${point.studyMinutes} phút tập trung`; return <span key={point.date} className={`dashboard-activity-heatmap-cell level-${level}`} aria-label={label} title={label} /> })}</div></section> }
function currentStudyStreak(points: Array<{ date: string; studyMinutes: number }>, todayKey: string) { let streak = 0; for (const point of [...points].filter((item) => item.date <= todayKey).reverse()) { if (point.studyMinutes <= 0) break; streak += 1 } return streak }
function activityLevel(minutes: number, highest: number) { if (minutes <= 0 || highest <= 0) return 0; const ratio = minutes / highest; return ratio <= .33 ? 1 : ratio <= .66 ? 2 : 3 }
function formatActivityDate(date: string) { const [year, month, day] = date.split('-').map(Number); return new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(year, month - 1, day, 12))) }
function formatChartDate(date: string, range: Range) { const [year, month, day] = date.split('-').map(Number); const value = new Date(Date.UTC(year, month - 1, day, 12)); const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).formatToParts(value); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); if (range === 'month') return `${values.day}/${values.month}`; const weekdays: Record<string, string> = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' }; return `${weekdays[values.weekday] ?? values.weekday} ${values.day}/${values.month}` }
function ChartSkeleton() { return <div className="chart-wrap chart-skeleton"><Skeleton height="100%" /></div> }
function InlineError({ onRetry }: { onRetry: () => void }) { return <ErrorState compact title="Không thể tải biểu đồ tiến độ." action={<button className="button secondary" onClick={onRetry}>Thử lại</button>} /> }
function DashboardError({ onRetry }: { onRetry: () => void }) { return <div className="empty-page"><ErrorState title="Không thể tải dashboard." action={<button className="button primary" onClick={onRetry}>Thử lại</button>} /></div> }
function DashboardSkeleton() {
  return (
    <div className="dashboard">
      <section className="dashboard-hero dashboard-hero-skeleton"><div className="dashboard-hero-content"><Skeleton width={180} height={12} /><Skeleton width={300} height={36} className="skeleton-heading" /><Skeleton width={250} height={16} /><div className="dashboard-hero-actions"><Skeleton width={142} height={40} /><Skeleton width={174} height={40} /></div></div></section>
      <div className="dashboard-architecture-grid dashboard-overview-grid">
        <section className="panel dashboard-today-summary dashboard-today-summary-skeleton"><Skeleton width={160} height={13} /><div>{[1, 2, 3, 4].map((item) => <Skeleton key={item} height={78} />)}</div></section>
        <section className="panel dashboard-subjects-panel"><Skeleton height={238} /></section>
        <section className="panel dashboard-pomodoro-card"><Skeleton height={238} /></section>
      </div>
      <div className="dashboard-architecture-grid dashboard-schedule-grid"><section className="panel dashboard-today-tasks"><Skeleton height={310} /></section><section className="panel dashboard-weekly-calendar"><Skeleton height={310} /></section></div>
      <div className="dashboard-architecture-grid dashboard-progress-grid"><section className="panel dashboard-weekly-activity"><Skeleton height={300} /></section><section className="panel dashboard-next-tasks-panel"><Skeleton height={300} /></section><section className="panel dashboard-plans-panel"><Skeleton height={300} /></section></div>
      <section className="panel dashboard-ai-panel"><Skeleton height={238} /></section>
    </div>
  )
}
