import { ArrowUpRight, CalendarDays, Check, Clock3, Columns3, MoreHorizontal, Plus, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { EmptyState, Skeleton, Tabs } from '../components/ui'
import { useDashboardSummaryQuery, useProgressChartQuery } from '../features/dashboard/dashboard.hooks'
import { useAuthStore } from '../stores/authStore'
import type { DashboardGoal, DashboardSchedule, DashboardSubject, DashboardTask } from '../features/dashboard/dashboard.api'
import { formatDate, formatDayMonth } from '../utils/format'
import { useState } from 'react'

type Range = 'week' | 'month'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [range, setRange] = useState<Range>('week')
  const summary = useDashboardSummaryQuery()
  const chart = useProgressChartQuery(range)

  if (summary.isLoading) return <DashboardSkeleton />
  if (summary.isError) return <DashboardError onRetry={() => summary.refetch()} />

  const data = summary.data
  if (!data) return <DashboardError onRetry={() => summary.refetch()} />
  const nameParts = user?.fullName?.trim().split(/\s+/) ?? []
  const firstName = nameParts[nameParts.length - 1] || 'bạn'
  const hasData = data.tasksToday.length > 0 || data.activeSubjects.length > 0 || data.activeGoals.length > 0 || data.upcomingSchedules.length > 0
  const chartData = chart.data?.points.map((point) => ({ ...point, label: formatChartDate(point.date, range) })) ?? []

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
          <h1>Chào buổi sáng, {firstName}.</h1>
          <p className="subtle">Sẵn sàng tiếp tục nhịp học hôm nay?</p>
        </div>
        <Link className="button primary" to="/study"><Clock3 size={17} /> Bắt đầu học</Link>
      </div>

      {!hasData && <section className="panel dashboard-welcome"><EmptyState icon={<Target size={24} />} title="Bắt đầu xây dựng nhịp học của bạn" description="Tạo một mục tiêu hoặc bắt đầu phiên học đầu tiên. Bạn luôn có thể thêm chủ đề sau." action={<div className="quick-actions"><Link className="button primary" to="/tasks"><Plus size={16} /> Tạo việc đầu tiên</Link><Link className="button secondary" to="/study"><Clock3 size={16} /> Bắt đầu phiên học</Link></div>} /></section>}

      <section className="stat-grid">
        <Stat icon={<Check />} label="Việc hôm nay" value={String(data.tasksToday.length)} change="Đến hạn hôm nay" tone="green" />
        <Stat icon={<Check />} label="Đã hoàn thành" value={String(data.taskDone)} change="Hoàn thành hôm nay" tone="green" />
        <Stat icon={<Target />} label="Việc quá hạn" value={String(data.taskOverdue)} change={data.taskOverdue ? 'Cần xem lại' : 'Mọi thứ đang ổn'} tone="orange" />
        <Stat icon={<Clock3 />} label="Giờ học tuần này" value={`${data.studyHoursThisWeek}h`} change={`${data.studyMinutesThisWeek} phút tập trung`} tone="blue" />
      </section>

      <div className="dashboard-grid">
        <section className="panel progress-panel">
          <div className="panel-heading"><div><h2>Tiến độ học tập</h2><p className="subtle">Thời gian tập trung và việc đã hoàn thành</p></div><Tabs value={range} onChange={setRange} items={[{ value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }]} /></div>
          {chart.isLoading ? <ChartSkeleton /> : chart.isError ? <InlineError onRetry={() => chart.refetch()} /> : chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#79a4ff" stopOpacity={0.18} /><stop offset="100%" stopColor="#79a4ff" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" interval={range === 'week' ? 0 : 1} minTickGap={range === 'week' ? 0 : 8} axisLine={false} tickLine={false} tick={{ fill: '#aab8cf', fontSize: range === 'week' ? 11 : 10 }} /><YAxis hide /><Tooltip contentStyle={{ border: '1px solid #3b485d', borderRadius: 8, background: '#202a3a', color: '#f4f7fb' }} formatter={(value: number, name: string) => [name === 'studyMinutes' ? `${value} phút` : `${value} việc`, name === 'studyMinutes' ? 'Học tập' : 'Hoàn thành']} /><Area type="monotone" dataKey="studyMinutes" stroke="#79a4ff" strokeWidth={2.5} fill="url(#studyFill)" /></AreaChart></ResponsiveContainer></div> : <EmptyState title="Chưa có dữ liệu tiến độ" description="Thời gian học và việc hoàn thành sẽ xuất hiện ở đây." />}
        </section>
        <GoalPanel goals={data.activeGoals} />
      </div>

      <div className="dashboard-grid lower-grid">
        <section className="panel task-panel"><div className="panel-heading"><div><h2>Việc cần làm</h2><p className="subtle">Các việc đến hạn hôm nay</p></div><Link className="text-link" to="/tasks">Xem tất cả <ArrowUpRight size={15} /></Link></div>{data.tasksToday.length ? <div className="task-list">{data.tasksToday.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} />)}</div> : <EmptyState icon={<Check size={22} />} title="Hôm nay chưa có việc" description="Bạn có thể nghỉ ngơi hoặc tạo một việc mới." action={<Link className="button secondary" to="/tasks"><Plus size={15} /> Tạo việc</Link>} />}</section>
        <section className="panel calendar-panel"><div className="panel-heading"><div><h2>Lịch sắp tới</h2><p className="subtle">Lịch học và sự kiện</p></div><CalendarDays size={20} className="panel-icon" /></div>{data.upcomingSchedules.length ? <div className="event-list">{data.upcomingSchedules.slice(0, 5).map((event) => <EventRow key={event.id} event={event} />)}</div> : <EmptyState icon={<CalendarDays size={22} />} title="Lịch của bạn đang trống" description="Thêm một lịch học, sự kiện hoặc thời gian tập trung." action={<Link className="button secondary" to="/calendar"><Plus size={15} /> Thêm vào lịch</Link>} />}</section>
      </div>

      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Bắt đầu nhanh</h2><p className="subtle">Chọn một việc để tiếp tục</p></div><MoreHorizontal size={18} className="panel-icon" /></div><div className="quick-actions"><Link className="quick-action" to="/goals"><Target size={17} /><span><strong>Tạo mục tiêu</strong><small>Chọn điều muốn tiến bộ</small></span></Link><Link className="quick-action" to="/study-plans"><Check size={17} /><span><strong>Tạo kế hoạch</strong><small>Chia nhỏ các bước</small></span></Link><Link className="quick-action" to="/tasks"><Check size={17} /><span><strong>Tạo việc</strong><small>Chia nhỏ việc cần làm</small></span></Link><Link className="quick-action" to="/calendar"><CalendarDays size={17} /><span><strong>Mở lịch</strong><small>Sắp xếp thời gian</small></span></Link><Link className="quick-action" to="/study"><Clock3 size={17} /><span><strong>Tập trung</strong><small>Bắt đầu phiên học</small></span></Link><Link className="quick-action" to="/tasks?view=kanban"><Columns3 size={17} /><span><strong>Mở Kanban</strong><small>Điều phối tiến độ</small></span></Link></div></section>
    </div>
  )
}

function Stat({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className={`stat-change ${tone}`}><TrendingUp size={13} /> {change}</span></div> }
function TaskRow({ task }: { task: DashboardTask }) { return <div className="task-row"><button className="check-button" aria-label={`Hoàn thành ${task.title}`}><Check size={14} /></button><div className="task-copy"><strong>{task.title}</strong><span>{task.dueDate ? `Hạn ${formatDate(task.dueDate)}` : 'Không có hạn'}</span></div><time>{task.status === 'done' ? 'Đã xong' : 'Hôm nay'}</time></div> }
function EventRow({ event }: { event: DashboardSchedule }) { const dateParts = event.startDate ? formatDayMonth(event.startDate).split('/') : []; return <div className="event-row"><div className="event-date blue"><strong>{dateParts[0] ?? '•'}</strong><span>{dateParts[1] ? `THÁNG ${dateParts[1]}` : 'SẮP TỚI'}</span></div><div><strong>{event.title}</strong><p className="subtle">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p></div></div> }
function GoalPanel({ goals }: { goals: DashboardGoal[] }) { const goal = goals[0]; if (!goal) return <section className="panel goal-panel"><div className="panel-heading"><div><h2>Mục tiêu nổi bật</h2><p className="subtle">Chưa có mục tiêu active</p></div><Target size={20} className="panel-icon" /></div><EmptyState title="Chọn một điều muốn tiến bộ" description="Mục tiêu giúp bạn giữ nhịp học theo cách của riêng mình." action={<Link className="button secondary" to="/goals"><Plus size={15} /> Tạo mục tiêu</Link>} /></section>; const progress = goal.progressPercent ?? Math.min(100, Math.round((Number(goal.currentValue) / Math.max(1, Number(goal.targetValue))) * 100)); return <section className="panel goal-panel"><div className="panel-heading"><div><h2>Mục tiêu nổi bật</h2><p className="subtle">Đang theo dõi</p></div><Link className="icon-button" to="/goals" aria-label="Xem mục tiêu"><ArrowUpRight size={18} /></Link></div><div className="goal-ring" style={{ background: `radial-gradient(closest-side, #f2f5fa 78%, transparent 79% 100%), conic-gradient(#4d7dff ${progress}%, #526078 0)` }}><div><strong>{progress}%</strong><span>tiến độ</span></div></div><div className="goal-detail"><strong>{goal.name}</strong>{goal.deadline && <p className="subtle">Hạn {formatDate(goal.deadline)}</p>}</div><div className="progress-line"><span style={{ width: `${progress}%` }} /></div></section> }
function formatChartDate(date: string, range: Range) { const options: Intl.DateTimeFormatOptions = range === 'month' ? { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' } : { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit' }; return new Date(date).toLocaleDateString('vi-VN', options).replace(',', '') }
function ChartSkeleton() { return <div className="chart-wrap chart-skeleton"><Skeleton height="100%" /></div> }
function InlineError({ onRetry }: { onRetry: () => void }) { return <div className="inline-error"><p>Không thể tải biểu đồ tiến độ.</p><button className="button secondary" onClick={onRetry}>Thử lại</button></div> }
function DashboardError({ onRetry }: { onRetry: () => void }) { return <div className="empty-page"><span className="empty-icon"><Target size={24} /></span><h1>Chưa thể tải dashboard</h1><p className="subtle">Kiểm tra kết nối rồi thử lại nhé.</p><button className="button primary" onClick={onRetry}>Thử lại</button></div> }
function DashboardSkeleton() { return <div className="dashboard"><div className="page-heading"><div><Skeleton width={180} height={12} /><Skeleton width={280} height={34} className="skeleton-heading" /><Skeleton width={240} height={16} /></div><Skeleton width={140} height={40} /></div><section className="stat-grid">{[1, 2, 3].map((item) => <Skeleton key={item} height={126} className="skeleton-card" />)}</section><div className="dashboard-grid"><section className="panel"><Skeleton height={280} /></section><section className="panel"><Skeleton height={280} /></section></div></div> }
