import { ArrowUpRight, BookOpen, CalendarDays, Check, CheckSquare, Clock3, Flame, Leaf, ListTodo, Plus, Sparkles, Sprout, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { ChartLegend, EmptyState, ErrorState, Skeleton, Tabs } from '../components/ui'
import { useDashboardSummaryQuery, useProgressChartQuery } from '../features/dashboard/dashboard.hooks'
import { useAuthStore } from '../stores/authStore'
import type { DashboardSchedule, DashboardSubject, DashboardSummary, DashboardTask } from '../features/dashboard/dashboard.api'
import { useState } from 'react'
import { usePlansQuery } from '../features/tasks/tasks.hooks'
import { getVietnamGreeting, getVietnamTodayKey } from '../utils/vietnamTime'
import { formatTaskDeadline } from '../utils/taskDate'
import { NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'
import type { StudyPlan } from '../features/tasks/tasks.api'
import { PRIORITY_LABELS } from '../features/tasks/task.constants'
import { StartStudyButton } from '../features/study-sessions/StartStudyButton'
import { aiFeaturesEnabled } from '../config/features'
import { useMediaQuery } from '../hooks/useMediaQuery'

type Range = 'week' | 'month'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [range, setRange] = useState<Range>('week')
  const summary = useDashboardSummaryQuery()
  const chart = useProgressChartQuery(range)
  const streakChart = useProgressChartQuery('month')
  const plans = usePlansQuery({ status: 'in_progress', limit: '1' })

  if (summary.isLoading) return <DashboardSkeleton />
  if (summary.isError) return <DashboardError onRetry={() => summary.refetch()} />

  const data = summary.data
  if (!data) return <DashboardError onRetry={() => summary.refetch()} />
  const nameParts = user?.fullName?.trim().split(/\s+/) ?? []
  const firstName = nameParts[nameParts.length - 1] || 'bạn'
  const greeting = getVietnamGreeting()
  const hasData = data.tasksToday.length > 0 || data.activeSubjects.length > 0 || data.upcomingSchedules.length > 0 || Boolean(plans.data?.items.length)
  const todayKey = getVietnamTodayKey()
  const chartData = chart.data?.points.map((point, index, points) => ({ ...point, label: range === 'month' && index % 2 !== 0 && index !== points.length - 1 && point.date !== todayKey ? '' : formatChartDate(point.date, range) })) ?? []
  const todaySchedules = data.upcomingSchedules.filter((event) => event.startDate?.slice(0, 10) === todayKey)
  const streak = streakChart.data ? currentStudyStreak(streakChart.data.points, todayKey) : null
  const nextTask = data.tasksToday.find((task) => task.status !== 'done') ?? data.tasksToday[0]

  return (
    <div className="dashboard">
      <DashboardHero greeting={greeting} firstName={firstName} />

      {!hasData && <section className="panel dashboard-welcome"><EmptyState icon={<Target size={24} />} title="Bắt đầu xây dựng nhịp của bạn" description="Tạo một việc hoặc một kế hoạch nhỏ. Bạn luôn có thể thêm môn học sau." action={<div className="quick-actions"><Link className="button primary" to="/tasks"><Plus size={16} /> Tạo việc đầu tiên</Link><Link className="button secondary" to="/study-plans"><Plus size={16} /> Tạo kế hoạch</Link></div>} /></section>}

      <section className="stat-grid dashboard-stats">
        <Stat icon={<Check />} label="Việc hôm nay" value={String(data.tasksToday.length)} change="Đến hạn hôm nay" tone="green" />
        <Stat icon={<Check />} label="Đã hoàn thành" value={String(data.taskDone)} change="Hoàn thành hôm nay" tone="green" />
        <Stat icon={<Clock3 />} label="Phút tập trung" value={String(data.studyMinutesThisWeek)} change="Trong tuần này" tone="blue" />
        <Stat icon={<Flame />} label="Chuỗi học" value={streakChart.isLoading ? '...' : streakChart.isError ? '—' : String(streak ?? 0)} change="Ngày liên tiếp" tone="orange" />
      </section>

      <div className="dashboard-architecture-grid dashboard-priority-grid">
        <section className="panel task-panel dashboard-next-tasks"><div className="panel-heading"><div><h2>Việc nên làm tiếp theo</h2><p className="subtle">Một bước nhỏ để giữ nhịp học</p></div><Link className="text-link" to="/tasks">Xem tất cả <ArrowUpRight size={15} /></Link></div>{nextTask ? <NextTaskCard task={nextTask} subjectName={data.activeSubjects.find((subject) => subject.id === nextTask.subjectId)?.name} /> : <EmptyState icon={<Check size={22} />} title="Hôm nay chưa có việc" description="Bạn có thể nghỉ ngơi hoặc tạo một việc mới." action={<Link className="button secondary" to="/tasks"><Plus size={15} /> Tạo việc</Link>} />}</section>
        <section className="panel calendar-panel dashboard-today-schedule"><div className="panel-heading"><div><h2>Lịch hôm nay</h2><p className="subtle">Lịch học, sự kiện và hạn công việc</p></div><CalendarDays size={20} className="panel-icon" /></div>{todaySchedules.length ? <div className="event-list">{todaySchedules.slice(0, 5).map((event) => <EventRow key={event.id} event={event} />)}</div> : <EmptyState icon={<CalendarDays size={22} />} title="Hôm nay chưa có lịch" description="Thêm lịch học hoặc deadline để chủ động hơn." action={<Link className="button secondary" to="/calendar"><Plus size={15} /> Thêm vào lịch</Link>} />}</section>
      </div>

      <div className="dashboard-architecture-grid dashboard-progress-grid">
        <ActivePlansPanel plan={plans.data?.items[0]} loading={plans.isLoading} error={plans.isError} onRetry={() => plans.refetch()} />
        <section className="panel progress-panel dashboard-weekly-activity">
          <div className="panel-heading"><div><h2>Hoạt động tuần</h2><p className="subtle">Thời gian tập trung và việc đã hoàn thành</p></div><Tabs value={range} onChange={setRange} items={[{ value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }]} /></div>
          {chart.isLoading ? <ChartSkeleton /> : chart.isError ? <InlineError onRetry={() => chart.refetch()} /> : chartData.length ? <><ChartLegend items={[{ label: 'Tập trung', tone: 'pine' }, { label: 'Hoàn thành', tone: 'moss' }]} /><div className="chart-wrap dashboard-activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}><defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--nature-pine)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--nature-pine)" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" interval={range === 'week' ? 0 : 1} minTickGap={range === 'week' ? 0 : 8} axisLine={false} tickLine={false} tick={{ fill: 'var(--nature-text-muted)', fontSize: range === 'week' ? 11 : 10 }} /><YAxis hide /><Tooltip content={<WeeklyActivityTooltip />} cursor={{ stroke: 'var(--nature-sage)', strokeDasharray: '3 3' }} /><Area name="Tập trung" type="monotone" dataKey="studyMinutes" stroke="var(--nature-pine)" strokeWidth={2.5} fill="url(#studyFill)" /><Line name="Hoàn thành" type="monotone" dataKey="taskDone" stroke="var(--nature-moss)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--nature-moss)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--nature-sand)', stroke: 'var(--nature-moss)', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div><ActivityHeatmap points={chart.data?.points ?? []} /></> : <EmptyState title="Chưa có dữ liệu tiến độ" description="Thời gian học và việc hoàn thành sẽ xuất hiện ở đây." />}
        </section>
      </div>

      <div className="dashboard-architecture-grid dashboard-bottom-grid">
        <ActiveSubjectsPanel subjects={data.activeSubjects} />
        <AICoachPanel briefing={data.dailyBriefing} available={aiFeaturesEnabled} />
      </div>
    </div>
  )
}

function DashboardHero({ greeting, firstName }: { greeting: string; firstName: string }) {
  const showScene = useMediaQuery('(min-width: 640px)')

  return <section className="dashboard-hero">
    <div className="dashboard-hero-content">
      <p className="dashboard-hero-eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
      <h1>{greeting}, {firstName}<Leaf size={23} aria-hidden="true" /></h1>
      <p>Hôm nay bạn muốn tiến thêm một bước nào?</p>
      <div className="dashboard-hero-actions">
        <Link className="button primary" to="/tasks"><CheckSquare size={17} /> Xem công việc</Link>
        <Link className="button secondary" to="/study"><Clock3 size={17} /> Bắt đầu tập trung</Link>
      </div>
    </div>
    {showScene && <div className="dashboard-hero-scene" aria-hidden="true">
      <span className="dashboard-hero-hills" />
      <img className="dashboard-hero-bush dashboard-hero-bush-back" src={natureAssets.flora.bush[2]} alt="" width={543} height={724} />
      <NatureMascot animal="bunny" size={196} priority className="dashboard-hero-mascot" />
      <img className="dashboard-hero-bush dashboard-hero-bush-front" src={natureAssets.flora.bush[0]} alt="" width={543} height={724} />
    </div>}
  </section>
}

function ActivePlansPanel({ plan, loading, error, onRetry }: { plan?: StudyPlan; loading: boolean; error: boolean; onRetry: () => void }) {
  return <section className="panel dashboard-plans-panel"><div className="panel-heading"><div><h2>Kế hoạch đang tiến hành</h2><p className="subtle">Lộ trình bạn đang theo đuổi</p></div><Link className="text-link" to="/study-plans">Xem tất cả <ArrowUpRight size={15} /></Link></div>{loading ? <div className="dashboard-preview-skeleton"><Skeleton height={154} /></div> : error ? <ErrorState compact title="Không thể tải kế hoạch." action={<button className="button secondary" onClick={onRetry}>Thử lại</button>} /> : plan ? <DashboardPlanCard plan={plan} /> : <EmptyState icon={<ListTodo size={22} />} title="Chưa có kế hoạch đang thực hiện" description="Tạo một lộ trình để chia mục tiêu thành các bước nhỏ." action={<Link className="button secondary" to="/study-plans"><Plus size={15} /> Tạo kế hoạch</Link>} />}</section>
}

function DashboardPlanCard({ plan }: { plan: StudyPlan }) {
  const progress = Math.min(100, Math.max(0, plan.progressPercent))
  const taskTotal = plan.taskTotal ?? 0
  const taskDone = plan.taskDone ?? 0
  const taskLabel = taskTotal > 0 ? `${taskDone}/${taskTotal} công việc` : 'Chưa có công việc'
  const deadline = plan.endDate ? formatTaskDeadline(plan.endDate) : 'Chưa đặt hạn'

  return <Link className="dashboard-trail-card" to={`/study-plans/${plan.id}`}>
    <div className="dashboard-trail-card-heading"><div><span>{plan.subject?.name ?? 'Kế hoạch cá nhân'}</span><h3>{plan.title}</h3></div><strong>{progress}%</strong></div>
    <div className="dashboard-trail-progress" style={{ '--trail-progress': `${progress}%` } as React.CSSProperties} aria-label={`${progress}% tiến độ`}><span><i /></span><Sprout size={16} aria-hidden="true" /></div>
    <div className="dashboard-trail-meta"><span>{taskLabel}</span><span>{deadline}</span></div>
  </Link>
}

function ActiveSubjectsPanel({ subjects }: { subjects: DashboardSubject[] }) {
  return <section className="panel dashboard-subjects-panel"><div className="panel-heading"><div><h2>Môn học đang học</h2><p className="subtle">Các không gian bạn đang duy trì</p></div><Link className="text-link" to="/subjects">Xem tất cả <ArrowUpRight size={15} /></Link></div>{subjects.length ? <div className="dashboard-subject-list">{subjects.slice(0, 4).map((subject) => <Link className="dashboard-subject-row" key={subject.id} to={`/subjects/${subject.id}`}><span className="dashboard-subject-dot" style={{ background: subject.colorHex ?? 'var(--nature-sage)' }} /><span><strong>{subject.name}</strong><small>{subject.code ?? 'Đang học'}</small></span><BookOpen size={16} aria-hidden="true" /></Link>)}</div> : <EmptyState icon={<BookOpen size={22} />} title="Chưa có môn học đang theo dõi" description="Thêm môn học để theo dõi tiến độ tại đây." action={<Link className="button secondary" to="/subjects"><Plus size={15} /> Thêm môn học</Link>} />}</section>
}

function AICoachPanel({ briefing, available }: { briefing?: DashboardSummary['dailyBriefing']; available: boolean }) {
  const briefingLine = briefing ? briefing.dueTodayCount > 0 ? `Hôm nay bạn có ${briefing.dueTodayCount} công việc đến hạn.` : `Bạn có ${briefing.openTaskCount} công việc đang mở.` : null
  const supportLine = briefing?.availableSlot ? `Khoảng trống tiếp theo: ${briefing.availableSlot.startTime} - ${briefing.availableSlot.endTime}. Mình có thể giúp bạn chia lịch.` : 'Mình có thể giúp bạn chia lịch.'
  const coachLink = '/ai-coach?prompt=Gợi%20%C3%BD%20l%E1%BB%8Bch%20h%E1%BB%8Dc%20h%C3%B4m%20nay%20d%E1%BB%B1a%20tr%C3%AAn%20c%C3%B4ng%20vi%E1%BB%87c%20v%C3%A0%20l%E1%BB%8Bch%20tr%E1%BB%91ng%20c%E1%BB%A7a%20t%C3%B4i.'

  return <section className="panel dashboard-ai-panel"><div className="panel-heading"><div><p className="dashboard-ai-kicker">AI COACH</p><h2>Lập kế hoạch cùng AI</h2></div><Sparkles size={20} className="panel-icon" /></div><div className="dashboard-ai-content"><div className="dashboard-ai-copy">{available ? <>{briefingLine && <p>{briefingLine}</p>}<p>{supportLine}</p><Link className="button secondary dashboard-ai-action" to={coachLink}><Sparkles size={15} /> Hỏi AI</Link></> : <><p>AI Coach chưa khả dụng trong môi trường này.</p><Link className="button secondary dashboard-ai-action" to="/study-plans"><ListTodo size={15} /> Lập kế hoạch cùng AI</Link></>}</div><NatureMascot animal="owl" size={88} className="dashboard-ai-owl" /></div></section>
}

function Stat({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className={`stat-change ${tone}`}><TrendingUp size={13} /> {change}</span></div> }
function NextTaskCard({ task, subjectName }: { task: DashboardTask; subjectName?: string }) { const metadata = ['Hôm nay', task.estimatedMinutes ? `${task.estimatedMinutes} phút` : 'Chưa ước tính', task.priority ? PRIORITY_LABELS[task.priority] : 'Chưa đặt ưu tiên']; return <article className="next-task-card"><span className="next-task-card-accent"><Leaf size={14} aria-hidden="true" /> Việc hôm nay</span><div className="next-task-card-copy"><h3>{task.title}</h3><p>{subjectName ?? 'Không gian học tập'}</p></div><div className="next-task-card-meta">{metadata.map((item) => <span key={item}>{item}</span>)}</div><div className="next-task-card-actions"><StartStudyButton subjectId={task.subjectId} taskId={task.id} className="next-task-start" label="Bắt đầu" /><Link className="button secondary" to={`/tasks?taskId=${task.id}`}>Mở chi tiết</Link></div></article> }
function WeeklyActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; studyMinutes: number; taskDone: number } }> }) { const point = payload?.[0]?.payload; if (!active || !point) return null; return <div className="dashboard-chart-tooltip"><strong>{formatActivityDate(point.date)}</strong><span><i className="dashboard-chart-tooltip-pine" /> Tập trung <b>{point.studyMinutes} phút</b></span><span><i className="dashboard-chart-tooltip-moss" /> Hoàn thành <b>{point.taskDone} việc</b></span></div> }
function ActivityHeatmap({ points }: { points: Array<{ date: string; studyMinutes: number }> }) { const highest = Math.max(...points.map((point) => point.studyMinutes), 0); return <section className="dashboard-activity-heatmap" aria-label="Mức độ tập trung mỗi ngày"><div className="dashboard-activity-heatmap-head"><span>Nhịp tập trung</span><div aria-hidden="true"><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /></div></div><div className="dashboard-activity-heatmap-grid">{points.map((point) => { const level = activityLevel(point.studyMinutes, highest); const label = `${formatActivityDate(point.date)}: ${point.studyMinutes} phút tập trung`; return <span key={point.date} className={`dashboard-activity-heatmap-cell level-${level}`} aria-label={label} title={label} /> })}</div></section> }
function EventRow({ event }: { event: DashboardSchedule }) { const dateParts = event.startDate ? calendarDateParts(event.startDate) : null; const isTask = event.type === 'task_due'; const typeLabel: Record<string, string> = { task_due: 'Hạn công việc', schedule: 'Lịch', event: 'Sự kiện', exam: 'Kỳ thi' }; const fallbackType = typeLabel[event.type ?? ''] ?? 'Sự kiện'; return <div className={`event-row${isTask ? ' event-row-task' : ''}`}><div className={`event-date ${isTask ? 'orange' : 'blue'}`}><strong>{dateParts?.day ?? '•'}</strong><span>{dateParts ? `THG ${dateParts.month}` : 'SẮP TỚI'}</span></div><div><strong>{event.title}</strong><p className="subtle">{isTask ? typeLabel.task_due : event.startTime ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}` : fallbackType}</p></div></div> }
function calendarDateParts(value: string) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).formatToParts(new Date(value)); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return { day: values.day, month: values.month } }
function currentStudyStreak(points: Array<{ date: string; studyMinutes: number }>, todayKey: string) { let streak = 0; for (const point of [...points].filter((item) => item.date <= todayKey).reverse()) { if (point.studyMinutes <= 0) break; streak += 1 } return streak }
function activityLevel(minutes: number, highest: number) { if (minutes <= 0 || highest <= 0) return 0; const ratio = minutes / highest; return ratio <= .33 ? 1 : ratio <= .66 ? 2 : 3 }
function formatActivityDate(date: string) { const [year, month, day] = date.split('-').map(Number); return new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(year, month - 1, day, 12))) }
function formatChartDate(date: string, range: Range) { const [year, month, day] = date.split('-').map(Number); const value = new Date(Date.UTC(year, month - 1, day, 12)); const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).formatToParts(value); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); if (range === 'month') return `${values.day}/${values.month}`; const weekdays: Record<string, string> = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' }; return `${weekdays[values.weekday] ?? values.weekday} ${values.day}/${values.month}` }
function ChartSkeleton() { return <div className="chart-wrap chart-skeleton"><Skeleton height="100%" /></div> }
function InlineError({ onRetry }: { onRetry: () => void }) { return <ErrorState compact title="Không thể tải biểu đồ tiến độ." action={<button className="button secondary" onClick={onRetry}>Thử lại</button>} /> }
function DashboardError({ onRetry }: { onRetry: () => void }) { return <div className="empty-page"><ErrorState title="Không thể tải dashboard." action={<button className="button primary" onClick={onRetry}>Thử lại</button>} /></div> }
function DashboardSkeleton() { return <div className="dashboard"><section className="dashboard-hero dashboard-hero-skeleton"><div className="dashboard-hero-content"><Skeleton width={180} height={12} /><Skeleton width={300} height={36} className="skeleton-heading" /><Skeleton width={250} height={16} /><div className="dashboard-hero-actions"><Skeleton width={142} height={40} /><Skeleton width={174} height={40} /></div></div></section><section className="stat-grid">{[1, 2, 3, 4].map((item) => <Skeleton key={item} height={126} className="skeleton-card" />)}</section><div className="dashboard-grid"><section className="panel"><Skeleton height={280} /></section><section className="panel"><Skeleton height={280} /></section></div></div> }
