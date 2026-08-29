import { ArrowUpRight, BookOpen, CalendarDays, Check, CheckSquare, Clock3, Flame, Leaf, ListTodo, Plus, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { EmptyState, Skeleton, Tabs } from '../components/ui'
import { useDashboardSummaryQuery, useProgressChartQuery } from '../features/dashboard/dashboard.hooks'
import { useAuthStore } from '../stores/authStore'
import type { DashboardSchedule, DashboardSubject, DashboardSummary, DashboardTask } from '../features/dashboard/dashboard.api'
import { useState } from 'react'
import { usePlansQuery } from '../features/tasks/tasks.hooks'
import { getVietnamGreeting, getVietnamTodayKey } from '../utils/vietnamTime'
import { NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'
import type { StudyPlan } from '../features/tasks/tasks.api'
import { PRIORITY_LABELS } from '../features/tasks/task.constants'
import { StartStudyButton } from '../features/study-sessions/StartStudyButton'
import { aiFeaturesEnabled } from '../config/features'

type Range = 'week' | 'month'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [range, setRange] = useState<Range>('week')
  const summary = useDashboardSummaryQuery()
  const chart = useProgressChartQuery(range)
  const streakChart = useProgressChartQuery('month')
  const plans = usePlansQuery({ status: 'in_progress', limit: '3' })

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
        <ActivePlansPanel plans={plans.data?.items ?? []} loading={plans.isLoading} error={plans.isError} />
        <section className="panel progress-panel dashboard-weekly-activity">
          <div className="panel-heading"><div><h2>Hoạt động tuần</h2><p className="subtle">Thời gian tập trung và việc đã hoàn thành</p></div><Tabs value={range} onChange={setRange} items={[{ value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }]} /></div>
          {chart.isLoading ? <ChartSkeleton /> : chart.isError ? <InlineError onRetry={() => chart.refetch()} /> : chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#79a4ff" stopOpacity={0.18} /><stop offset="100%" stopColor="#79a4ff" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" interval={range === 'week' ? 0 : 1} minTickGap={range === 'week' ? 0 : 8} axisLine={false} tickLine={false} tick={{ fill: '#aab8cf', fontSize: range === 'week' ? 11 : 10 }} /><YAxis hide /><Tooltip contentStyle={{ border: '1px solid #3b485d', borderRadius: 8, background: '#202a3a', color: '#f4f7fb' }} formatter={(value: number, name: string) => [name === 'studyMinutes' ? `${value} phút` : `${value} việc`, name === 'studyMinutes' ? 'Học tập' : 'Hoàn thành']} /><Area type="monotone" dataKey="studyMinutes" stroke="#79a4ff" strokeWidth={2.5} fill="url(#studyFill)" /><Line type="monotone" dataKey="taskDone" stroke="#55c69e" strokeWidth={2.5} dot={{ r: 3, fill: '#55c69e', strokeWidth: 0 }} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div> : <EmptyState title="Chưa có dữ liệu tiến độ" description="Thời gian học và việc hoàn thành sẽ xuất hiện ở đây." />}
        </section>
      </div>

      <div className={`dashboard-architecture-grid dashboard-bottom-grid${aiFeaturesEnabled ? '' : ' dashboard-bottom-grid-single'}`}>
        <ActiveSubjectsPanel subjects={data.activeSubjects} />
        {aiFeaturesEnabled && <AICoachPanel briefing={data.dailyBriefing} />}
      </div>
    </div>
  )
}

function DashboardHero({ greeting, firstName }: { greeting: string; firstName: string }) {
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
    <div className="dashboard-hero-scene" aria-hidden="true">
      <img className="dashboard-hero-cloud" src={natureAssets.effects.cloud01} alt="" />
      <span className="dashboard-hero-hills" />
      <img className="dashboard-hero-bush dashboard-hero-bush-back" src={natureAssets.flora.bush[2]} alt="" />
      <NatureMascot animal="bunny" size={196} className="dashboard-hero-mascot" />
      <img className="dashboard-hero-bush dashboard-hero-bush-front" src={natureAssets.flora.bush[0]} alt="" />
    </div>
  </section>
}

function ActivePlansPanel({ plans, loading, error }: { plans: StudyPlan[]; loading: boolean; error: boolean }) {
  return <section className="panel dashboard-plans-panel"><div className="panel-heading"><div><h2>Kế hoạch đang tiến hành</h2><p className="subtle">Các lộ trình bạn đang theo đuổi</p></div><Link className="text-link" to="/study-plans">Xem tất cả <ArrowUpRight size={15} /></Link></div>{loading ? <div className="dashboard-preview-skeleton"><Skeleton height={46} /><Skeleton height={46} /></div> : error ? <p className="dashboard-panel-error">Không thể tải kế hoạch.</p> : plans.length ? <div className="dashboard-plan-preview-list">{plans.map((plan) => <Link className="dashboard-plan-preview" key={plan.id} to={`/study-plans/${plan.id}`}><span><strong>{plan.title}</strong><small>{plan.subject?.name ?? 'Kế hoạch cá nhân'}</small></span><b>{plan.progressPercent}%</b></Link>)}</div> : <EmptyState icon={<ListTodo size={22} />} title="Chưa có kế hoạch đang thực hiện" description="Tạo một lộ trình để chia mục tiêu thành các bước nhỏ." action={<Link className="button secondary" to="/study-plans"><Plus size={15} /> Tạo kế hoạch</Link>} />}</section>
}

function ActiveSubjectsPanel({ subjects }: { subjects: DashboardSubject[] }) {
  return <section className="panel dashboard-subjects-panel"><div className="panel-heading"><div><h2>Môn học đang học</h2><p className="subtle">Các không gian bạn đang duy trì</p></div><Link className="text-link" to="/subjects">Xem tất cả <ArrowUpRight size={15} /></Link></div>{subjects.length ? <div className="dashboard-subject-list">{subjects.slice(0, 4).map((subject) => <Link className="dashboard-subject-row" key={subject.id} to={`/subjects/${subject.id}`}><span className="dashboard-subject-dot" style={{ background: subject.colorHex ?? 'var(--nature-sage)' }} /><span><strong>{subject.name}</strong><small>{subject.code ?? 'Đang học'}</small></span><BookOpen size={16} aria-hidden="true" /></Link>)}</div> : <EmptyState icon={<BookOpen size={22} />} title="Chưa có môn học đang theo dõi" description="Thêm môn học để theo dõi tiến độ tại đây." action={<Link className="button secondary" to="/subjects"><Plus size={15} /> Thêm môn học</Link>} />}</section>
}

function AICoachPanel({ briefing }: { briefing?: DashboardSummary['dailyBriefing'] }) {
  return <section className="panel dashboard-ai-panel"><div className="panel-heading"><div><h2>AI Coach</h2><p className="subtle">Gợi ý nhịp học cho hôm nay</p></div><Sparkles size={20} className="panel-icon" /></div>{briefing ? <div className="dashboard-ai-summary"><span>Bạn có <strong>{briefing.openTaskCount} công việc</strong> đang mở.</span><span>{briefing.dueTodayCount > 0 ? <><strong>{briefing.dueTodayCount} việc</strong> đến hạn hôm nay.</> : 'Không có việc nào đến hạn hôm nay.'}</span><span>{briefing.availableSlot ? <>Khoảng trống: <strong>{briefing.availableSlot.startTime} - {briefing.availableSlot.endTime}</strong>.</> : 'Chưa có khoảng trống ít nhất 30 phút trong hôm nay.'}</span></div> : <p className="dashboard-ai-empty">AI Coach có thể giúp bạn sắp xếp một nhịp học phù hợp.</p>}<Link className="button secondary dashboard-ai-action" to="/ai-coach?prompt=Gợi%20%C3%BD%20l%E1%BB%8Bch%20h%E1%BB%8Dc%20h%C3%B4m%20nay%20d%E1%BB%B1a%20tr%C3%AAn%20c%C3%B4ng%20vi%E1%BB%87c%20v%C3%A0%20l%E1%BB%8Bch%20tr%E1%BB%91ng%20c%E1%BB%A7a%20t%C3%B4i."><Sparkles size={15} /> Gợi ý lịch hôm nay</Link></section>
}

function Stat({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className={`stat-change ${tone}`}><TrendingUp size={13} /> {change}</span></div> }
function NextTaskCard({ task, subjectName }: { task: DashboardTask; subjectName?: string }) { const metadata = ['Hôm nay', task.estimatedMinutes ? `${task.estimatedMinutes} phút` : 'Chưa ước tính', task.priority ? PRIORITY_LABELS[task.priority] : 'Chưa đặt ưu tiên']; return <article className="next-task-card"><span className="next-task-card-accent"><Leaf size={14} aria-hidden="true" /> Việc hôm nay</span><div className="next-task-card-copy"><h3>{task.title}</h3><p>{subjectName ?? 'Không gian học tập'}</p></div><div className="next-task-card-meta">{metadata.map((item) => <span key={item}>{item}</span>)}</div><div className="next-task-card-actions"><StartStudyButton subjectId={task.subjectId} taskId={task.id} className="next-task-start" label="Bắt đầu" /><Link className="button secondary" to={`/tasks?taskId=${task.id}`}>Mở chi tiết</Link></div></article> }
function EventRow({ event }: { event: DashboardSchedule }) { const dateParts = event.startDate ? calendarDateParts(event.startDate) : null; const isTask = event.type === 'task_due'; const typeLabel: Record<string, string> = { task_due: 'Hạn công việc', schedule: 'Lịch', event: 'Sự kiện', exam: 'Kỳ thi' }; const fallbackType = typeLabel[event.type ?? ''] ?? 'Sự kiện'; return <div className={`event-row${isTask ? ' event-row-task' : ''}`}><div className={`event-date ${isTask ? 'orange' : 'blue'}`}><strong>{dateParts?.day ?? '•'}</strong><span>{dateParts ? `THG ${dateParts.month}` : 'SẮP TỚI'}</span></div><div><strong>{event.title}</strong><p className="subtle">{isTask ? typeLabel.task_due : event.startTime ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}` : fallbackType}</p></div></div> }
function calendarDateParts(value: string) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).formatToParts(new Date(value)); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return { day: values.day, month: values.month } }
function currentStudyStreak(points: Array<{ date: string; studyMinutes: number }>, todayKey: string) { let streak = 0; for (const point of [...points].filter((item) => item.date <= todayKey).reverse()) { if (point.studyMinutes <= 0) break; streak += 1 } return streak }
function formatChartDate(date: string, range: Range) { const [year, month, day] = date.split('-').map(Number); const value = new Date(Date.UTC(year, month - 1, day, 12)); const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).formatToParts(value); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); if (range === 'month') return `${values.day}/${values.month}`; const weekdays: Record<string, string> = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' }; return `${weekdays[values.weekday] ?? values.weekday} ${values.day}/${values.month}` }
function ChartSkeleton() { return <div className="chart-wrap chart-skeleton"><Skeleton height="100%" /></div> }
function InlineError({ onRetry }: { onRetry: () => void }) { return <div className="inline-error"><p>Không thể tải biểu đồ tiến độ.</p><button className="button secondary" onClick={onRetry}>Thử lại</button></div> }
function DashboardError({ onRetry }: { onRetry: () => void }) { return <div className="empty-page"><span className="empty-icon"><Target size={24} /></span><h1>Chưa thể tải dashboard</h1><p className="subtle">Kiểm tra kết nối rồi thử lại nhé.</p><button className="button primary" onClick={onRetry}>Thử lại</button></div> }
function DashboardSkeleton() { return <div className="dashboard"><section className="dashboard-hero dashboard-hero-skeleton"><div className="dashboard-hero-content"><Skeleton width={180} height={12} /><Skeleton width={300} height={36} className="skeleton-heading" /><Skeleton width={250} height={16} /><div className="dashboard-hero-actions"><Skeleton width={142} height={40} /><Skeleton width={174} height={40} /></div></div></section><section className="stat-grid">{[1, 2, 3, 4].map((item) => <Skeleton key={item} height={126} className="skeleton-card" />)}</section><div className="dashboard-grid"><section className="panel"><Skeleton height={280} /></section><section className="panel"><Skeleton height={280} /></section></div></div> }
