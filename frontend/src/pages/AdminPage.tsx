import { Activity, ArrowLeft, Ban, BarChart3, BookOpen, Bot, CalendarDays, CheckCircle2, ClipboardList, FileSpreadsheet, FileText, LayoutDashboard, Map, MessageSquareText, MoreHorizontal, Search, Settings, ShieldCheck, TriangleAlert, Upload, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ChartLegend, ConfirmDialog, Dropdown, EmptyState, ErrorState, Modal, Pagination, Select, Skeleton, Textarea } from '../components/ui'
import { NatureMascot } from '../components/nature'
import { aiFeaturesEnabled } from '../config/features'
import type { AdminAnalyticsPoint, AdminFeedback, AdminUser, FeedbackStatus, TopicTemplate } from '../features/admin/admin.api'
import { useActivityLogsQuery, useAdminFeedbackQuery, useAdminFeedbackUpdateMutation, useAdminStatisticsQuery, useAdminUsersQuery, useAdminUserUpdateMutation, useSystemContentSupportQuery, useTopicTemplateImportMutation } from '../features/admin/admin.hooks'
import { formatAdminAnalyticsDate, isAdminOverviewData } from '../features/admin/admin.presentation'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useAuthStore } from '../stores/authStore'

type AdminTab = 'overview' | 'users' | 'feedback' | 'logs' | 'templates' | 'content'
type AdminNavigationItem =
  | { label: string; icon: LucideIcon; status: 'available'; tab: AdminTab }
  | { label: string; icon: LucideIcon; status: 'comingSoon' | 'hidden' }

const primaryAdminNavigation: readonly AdminNavigationItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, status: 'available', tab: 'overview' },
  { label: 'Người dùng', icon: Users, status: 'available', tab: 'users' },
  { label: 'Môn học', icon: BookOpen, status: 'available', tab: 'templates' },
  { label: 'Công việc', icon: ClipboardList, status: 'comingSoon' },
  { label: 'Kế hoạch', icon: Map, status: 'comingSoon' },
  { label: 'Lịch', icon: CalendarDays, status: 'comingSoon' },
  { label: 'AI Coach', icon: Bot, status: 'comingSoon' },
  { label: 'Phân tích', icon: BarChart3, status: 'comingSoon' },
  { label: 'Báo cáo', icon: FileText, status: 'comingSoon' },
  { label: 'Cài đặt', icon: Settings, status: 'comingSoon' },
]

const operationalAdminNavigation: readonly AdminNavigationItem[] = [
  { label: 'Phản hồi', icon: MessageSquareText, status: 'available', tab: 'feedback' },
  { label: 'Nhật ký quản trị', icon: ShieldCheck, status: 'available', tab: 'logs' },
  { label: 'Nội dung hệ thống', icon: LayoutDashboard, status: 'available', tab: 'content' },
]
const feedbackStatusLabels: Record<FeedbackStatus, string> = { open: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng' }
const feedbackTypeLabels = { bug: 'Lỗi', feature_request: 'Đề xuất', question: 'Câu hỏi' }
const adminActionLabels: Record<string, string> = {
  'admin.bootstrap_granted': 'Cấp quyền quản trị ban đầu',
  'admin.user_updated': 'Cập nhật tài khoản người dùng',
  'admin.feedback_updated': 'Cập nhật phản hồi',
  'admin.topic_templates_imported': 'Nhập TopicTemplate',
}

function formatDateTime(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) }
function formatDate(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) }
function formatAnalyticsDate(value: string) { return formatAdminAnalyticsDate(value) }
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="admin-search"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label> }
function QueryError({ retry }: { retry: () => void }) { return <ErrorState title="Không thể tải dữ liệu." action={<Button onClick={retry}>Thử lại</Button>} /> }

function AdminShellNavItem({ item, activeTab, onChange }: { item: AdminNavigationItem; activeTab: AdminTab; onChange: (tab: AdminTab) => void }) {
  if (item.status === 'hidden') return null

  const Icon = item.icon
  if (item.status !== 'available') {
    return <div className="admin-shell-nav-item is-coming-soon" aria-label={`${item.label}: Sắp có`}><Icon size={16} aria-hidden="true" /><span>{item.label}</span><span className="admin-shell-nav-soon">Sắp có</span></div>
  }

  const active = item.tab === activeTab
  return <button type="button" className={`admin-shell-nav-item${active ? ' active' : ''}`} onClick={() => onChange(item.tab)} aria-current={active ? 'page' : undefined}><Icon size={16} aria-hidden="true" /><span>{item.label}</span></button>
}

function AdminAnalytics({ points }: { points: AdminAnalyticsPoint[] }) {
  const data = points.map((point) => ({ ...point, label: formatAdminAnalyticsDate(point.date) }))
  const hasUserGrowth = data.some((point) => point.users > 0)
  const hasActivity = data.some((point) => point.sessions > 0 || point.taskCompletions > 0)
  const hasTaskCompletions = data.some((point) => point.taskCompletions > 0)
  const hasPlanAdoption = data.some((point) => point.plans > 0)
  const hasCharts = hasUserGrowth || hasActivity || hasTaskCompletions || hasPlanAdoption
  const tooltipStyle = { background: 'var(--nature-surface)', border: '1px solid var(--nature-border)', borderRadius: 7, color: 'var(--nature-text)', fontSize: 12 }
  const axisTick = { fill: 'var(--nature-text-muted)', fontSize: 10 }

  if (!hasCharts) return null

  return <section className="admin-analytics" aria-labelledby="admin-analytics-title">
    <div className="admin-analytics-heading"><div><h2 id="admin-analytics-title">Phân tích hoạt động</h2><p>Các biểu đồ chỉ dùng dữ liệu đã được hệ thống ghi nhận.</p></div></div>
    <div className="admin-analytics-grid">
      {hasUserGrowth && <article className="admin-chart-card">
        <div><h3>Tăng trưởng người dùng</h3><p>Tài khoản mới theo ngày.</p></div>
        <ChartLegend items={[{ label: 'Người dùng mới', tone: 'pine' }]} /><div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="admin-user-growth-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--nature-pine)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--nature-pine)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--nature-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tick={axisTick} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} /><Tooltip contentStyle={tooltipStyle} labelFormatter={formatAnalyticsDate} formatter={(value: number) => [value, 'Người dùng mới']} /><Area type="monotone" dataKey="users" name="Người dùng mới" stroke="var(--nature-pine)" strokeWidth={2.5} fill="url(#admin-user-growth-fill)" /></AreaChart></ResponsiveContainer></div>
      </article>}
      {hasActivity && <article className="admin-chart-card">
        <div><h3>Hoạt động học tập</h3><p>Phiên học và công việc đã hoàn thành.</p></div>
        <ChartLegend items={[{ label: 'Phiên học', tone: 'sage' }, { label: 'Việc hoàn thành', tone: 'amber' }]} /><div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--nature-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tick={axisTick} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} /><Tooltip contentStyle={tooltipStyle} labelFormatter={formatAnalyticsDate} formatter={(value: number, name: string) => [value, name]} /><Bar dataKey="sessions" name="Phiên học" fill="var(--nature-sage)" radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="taskCompletions" name="Việc hoàn thành" stroke="var(--nature-amber)" strokeWidth={2.5} dot={{ r: 2.5, fill: 'var(--nature-amber)', strokeWidth: 0 }} /></ComposedChart></ResponsiveContainer></div>
      </article>}
      {hasTaskCompletions && <article className="admin-chart-card">
        <div><h3>Hoàn thành công việc</h3><p>Công việc được đánh dấu hoàn thành theo ngày.</p></div>
        <ChartLegend items={[{ label: 'Việc hoàn thành', tone: 'coral' }]} /><div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--nature-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tick={axisTick} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} /><Tooltip contentStyle={tooltipStyle} labelFormatter={formatAnalyticsDate} formatter={(value: number) => [value, 'Việc hoàn thành']} /><Line type="monotone" dataKey="taskCompletions" name="Việc hoàn thành" stroke="var(--nature-coral)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--nature-coral)', strokeWidth: 0 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
      </article>}
      {hasPlanAdoption && <article className="admin-chart-card">
        <div><h3>Kế hoạch được tạo</h3><p>Kế hoạch học tập mới theo ngày.</p></div>
        <ChartLegend items={[{ label: 'Kế hoạch mới', tone: 'sky' }]} /><div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--nature-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tick={axisTick} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} /><Tooltip contentStyle={tooltipStyle} labelFormatter={formatAnalyticsDate} formatter={(value: number) => [value, 'Kế hoạch mới']} /><Bar dataKey="plans" name="Kế hoạch mới" fill="var(--nature-sky)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </article>}
    </div>
  </section>
}

function AdminAttentionPanel({ overduePlans }: { overduePlans: number }) {
  if (overduePlans === 0) return null
  return <section className="admin-attention-panel" aria-labelledby="admin-attention-title">
    <div className="admin-attention-heading"><div><p>CẦN CHÚ Ý</p><h2 id="admin-attention-title">Các mục cần xử lý</h2></div></div>
    <div className="admin-attention-item"><span aria-hidden="true"><TriangleAlert size={18} /></span><div><strong>Kế hoạch quá hạn</strong><p>{overduePlans.toLocaleString('vi-VN')} kế hoạch chưa hoàn thành đã qua hạn.</p></div><b>{overduePlans.toLocaleString('vi-VN')}</b></div>
  </section>
}

function AdminAIInsightCard() {
  if (!aiFeaturesEnabled) return null
  return <section className="admin-ai-insight" aria-labelledby="admin-ai-insight-title">
    <div className="admin-ai-insight-copy"><p>AI / PHÂN TÍCH</p><h2 id="admin-ai-insight-title">Phân tích quản trị</h2><span>Chưa có insight cấp quản trị được backend cung cấp.</span><Link className="button secondary" to="/ai-coach">Mở AI Coach</Link></div>
    <NatureMascot animal="owl" size={68} className="admin-ai-insight-owl" />
  </section>
}

function OverviewPanel() {
  const query = useAdminStatisticsQuery()

  if (query.isLoading) return <section className="admin-overview"><div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div></div><div className="admin-stat-grid">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={92} />)}</div><Skeleton height={230} /></section>
  if (query.isError || !isAdminOverviewData(query.data)) return <section className="admin-overview"><div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div></div><QueryError retry={() => query.refetch()} /></section>

  const items = [
    { label: 'Tổng người dùng', value: query.data.totalUsers.toLocaleString('vi-VN'), icon: Users },
    { label: 'Hoạt động hôm nay', value: query.data.activityToday.toLocaleString('vi-VN'), icon: Activity },
    { label: 'Công việc đang mở', value: query.data.openTasks.toLocaleString('vi-VN'), icon: ClipboardList },
    { label: 'Kế hoạch đang chạy', value: query.data.activeStudyPlans.toLocaleString('vi-VN'), icon: Map },
  ]
  return <section className="admin-overview">
    <div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div></div>
    <div className="admin-stat-grid">{items.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={18} /></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <AdminAttentionPanel overduePlans={query.data.attention.overduePlans} />
    <AdminAIInsightCard />
    <AdminAnalytics points={query.data.analytics} />
    <section className="admin-table-section" aria-labelledby="plans-attention-title">
      <div className="admin-table-section-heading"><div><h2 id="plans-attention-title">Kế hoạch cần chú ý</h2><p>Tối đa 8 kế hoạch quá hạn hoặc có hạn trong 7 ngày tới.</p></div></div>
      {query.data.plansRequiringAttention.length === 0 ? <EmptyState title="Chưa có kế hoạch cần chú ý" description="Kế hoạch quá hạn hoặc sắp đến hạn sẽ xuất hiện tại đây." /> : <div className="admin-table-wrap"><table className="admin-table admin-attention-plans-table"><thead><tr><th>Kế hoạch</th><th>Người học</th><th>Hạn</th><th>Tiến độ</th><th>Tình trạng</th></tr></thead><tbody>{query.data.plansRequiringAttention.map((plan) => <tr key={plan.id}><td><strong>{plan.title}</strong>{plan.subject && <span>{plan.subject.code} · {plan.subject.name}</span>}</td><td><strong>{plan.user.fullName}</strong><span>{plan.user.email}</span></td><td>{plan.endDate ? <time dateTime={plan.endDate}>{formatDate(plan.endDate)}</time> : 'Chưa đặt hạn'}</td><td><div className="admin-progress-cell"><span aria-label={`${plan.progressPercent}% tiến độ`}><i style={{ width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` }} /></span><b>{plan.progressPercent}%</b></div></td><td><span className={`admin-status attention-${plan.attention}`}>{plan.attention === 'overdue' ? 'Quá hạn' : 'Sắp đến hạn'}</span></td></tr>)}</tbody></table></div>}
    </section>
    <section className="admin-table-section" aria-labelledby="recent-admin-activity-title">
      <div className="admin-table-section-heading"><div><h2 id="recent-admin-activity-title">Hoạt động quản trị gần đây</h2><p>Tối đa 8 hành động gần nhất, không gồm nội dung riêng tư của người dùng.</p></div></div>
      {query.data.recentAdminActivity.length === 0 ? <EmptyState title="Chưa có hoạt động quản trị" description="Các thao tác quản trị có audit sẽ xuất hiện tại đây." /> : <div className="admin-table-wrap"><table className="admin-table admin-recent-activity-table"><thead><tr><th>Hành động</th><th>Người thực hiện</th><th>Đối tượng</th><th>Thời gian</th></tr></thead><tbody>{query.data.recentAdminActivity.map((item) => <tr key={item.id}><td><strong>{adminActionLabels[item.action] ?? item.action}</strong></td><td>{item.actor?.fullName ?? 'Hệ thống'}{item.actor?.email && <span>{item.actor.email}</span>}</td><td>{item.entityType ?? '—'}</td><td><time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></td></tr>)}</tbody></table></div>}
    </section>
  </section>
}

function UsersPanel() {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const update = useAdminUserUpdateMutation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminUser | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)
  const query = useAdminUsersQuery({ search: debouncedSearch || undefined, page, limit: 15 })
  const updatingUserId = update.isPending ? update.variables?.id : undefined
  const patchUser = (user: AdminUser, input: { deletedAt?: string | null; isEmailVerified?: boolean }, message: string) => {
    update.mutate({ id: user.id, input }, {
      onSuccess: () => { toast.success(message); setPendingDeactivate(null) },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật tài khoản')),
    })
  }
  return <section className="admin-panel">
    <div className="admin-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Tìm theo tên hoặc email..." />{query.data && <span>{query.data.pagination.total} tài khoản</span>}</div>
    {query.isLoading ? <Skeleton height={360} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : !query.data?.items.length ? <EmptyState title="Không tìm thấy tài khoản" description={debouncedSearch ? 'Không có người dùng nào khớp tên hoặc email đang tìm.' : 'Chưa có người dùng nào trong hệ thống.'} /> : <div className="admin-table-wrap"><table className="admin-table admin-users-table"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Xác minh</th><th>Trạng thái</th><th>Ngày tạo</th><th>Cập nhật gần nhất</th><th><span className="sr-only">Hành động</span></th></tr></thead><tbody>{query.data.items.map((user) => {
      const isUpdating = updatingUserId === user.id
      const isSelf = user.id === currentUserId
      return <tr key={user.id} aria-busy={isUpdating}>
        <td><strong>{user.fullName}</strong><span>{user.email}</span></td>
        <td>{user.roles.map((item) => item.role.name).join(', ') || 'Chưa gán'}</td>
        <td><span className={`admin-status ${user.isEmailVerified ? 'verified' : 'unverified'}`}>{user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</span></td>
        <td><span className={`admin-status ${user.status}`}>{user.status === 'disabled' ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}</span></td>
        <td>{formatDateTime(user.createdAt)}</td>
        <td>{formatDateTime(user.updatedAt)}</td>
        <td><Dropdown ariaLabel={`Thao tác với ${user.fullName}`} label={<><MoreHorizontal size={18} /><span className="sr-only">Thao tác với {user.fullName}</span></>} showChevron={false}><button type="button" className="menu-item" disabled={update.isPending} onClick={() => patchUser(user, { isEmailVerified: !user.isEmailVerified }, user.isEmailVerified ? 'Đã bỏ xác minh email' : 'Đã xác minh email')}><CheckCircle2 size={15} /> {user.isEmailVerified ? 'Bỏ xác minh email' : 'Xác minh email'}</button>{user.status === 'disabled' ? <button type="button" className="menu-item" disabled={update.isPending} onClick={() => patchUser(user, { deletedAt: null }, 'Đã khôi phục tài khoản')}>Khôi phục tài khoản</button> : <button type="button" className="menu-item danger-text" disabled={isSelf || update.isPending} title={isSelf ? 'Bạn không thể tự vô hiệu hóa tài khoản đang dùng' : undefined} onClick={() => setPendingDeactivate(user)}><Ban size={15} /> Vô hiệu hóa</button>}</Dropdown></td>
      </tr>
    })}</tbody></table></div>}
    {(query.data?.pagination.totalPages ?? 0) > 1 && <Pagination page={query.data?.pagination.page ?? page} totalPages={query.data?.pagination.totalPages ?? 1} onChange={setPage} />}
    <ConfirmDialog open={Boolean(pendingDeactivate)} title="Vô hiệu hóa tài khoản?" description={`Tài khoản “${pendingDeactivate?.fullName ?? ''}” sẽ không thể đăng nhập cho đến khi được khôi phục.`} onCancel={() => setPendingDeactivate(null)} onConfirm={() => pendingDeactivate && patchUser(pendingDeactivate, { deletedAt: new Date().toISOString() }, 'Đã vô hiệu hóa tài khoản')} loading={update.isPending} />
  </section>
}

function FeedbackEditor({ item, onClose }: { item: AdminFeedback | null; onClose: () => void }) {
  const update = useAdminFeedbackUpdateMutation()
  const [status, setStatus] = useState<FeedbackStatus>(item?.status ?? 'open')
  const [reply, setReply] = useState(item?.adminReply ?? '')
  if (!item) return null
  const save = () => update.mutate({ id: item.id, input: { status, adminReply: reply.trim() || null } }, { onSuccess: () => { toast.success('Đã cập nhật phản hồi và ghi audit log'); onClose() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật phản hồi')) })
  return <Modal open title="Xử lý phản hồi" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={save} loading={update.isPending}>Lưu phản hồi</Button></>}><div className="feedback-editor"><div className="feedback-message"><span>{feedbackTypeLabels[item.type]}</span><h3>{item.title}</h3><p>{item.content}</p><small>{item.user.fullName} · {formatDateTime(item.createdAt)}</small></div><Select customMenu label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus)}>{Object.entries(feedbackStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Textarea label="Phản hồi của quản trị viên" value={reply} onChange={(event) => setReply(event.target.value)} rows={5} maxLength={10000} placeholder="Thông tin xử lý hoặc câu trả lời cho người gửi..." /></div></Modal>
}

function FeedbackPanel() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FeedbackStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminFeedback | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)
  const query = useAdminFeedbackQuery({ search: debouncedSearch || undefined, status: status || undefined, page, limit: 15 })
  return <section className="admin-panel"><div className="admin-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Tìm phản hồi..." /><Select customMenu aria-label="Lọc trạng thái phản hồi" value={status} onChange={(event) => { setStatus(event.target.value as FeedbackStatus | ''); setPage(1) }}><option value="">Tất cả trạng thái</option>{Object.entries(feedbackStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>{query.data && <span>{query.data.pagination.total} phản hồi</span>}</div>{query.isLoading ? <Skeleton height={350} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : !query.data?.items.length ? <EmptyState title="Không có phản hồi phù hợp" /> : <div className="feedback-list">{query.data.items.map((item) => <button key={item.id} onClick={() => setSelected(item)}><span className={`admin-status feedback-${item.status}`}>{feedbackStatusLabels[item.status]}</span><div><strong>{item.title}</strong><p>{item.content}</p><small>{item.user.fullName} · {formatDateTime(item.createdAt)}</small></div><span>{feedbackTypeLabels[item.type]}</span></button>)}</div>}{(query.data?.pagination.totalPages ?? 0) > 1 && <Pagination page={query.data?.pagination.page ?? page} totalPages={query.data?.pagination.totalPages ?? 1} onChange={setPage} />}<FeedbackEditor key={selected?.id} item={selected} onClose={() => setSelected(null)} /></section>
}

function LogsPanel() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)
  const query = useActivityLogsQuery({ search: debouncedSearch || undefined, page, limit: 20 })
  return <section className="admin-panel"><div className="admin-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Tìm hành động, đối tượng hoặc người dùng..." />{query.data && <span>{query.data.pagination.total} bản ghi</span>}</div>{query.isLoading ? <Skeleton height={380} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : !query.data?.items.length ? <EmptyState title="Không có hoạt động phù hợp" /> : <div className="admin-table-wrap"><table className="admin-table logs-table"><thead><tr><th>Thời gian</th><th>Hành động</th><th>Người thực hiện</th><th>Đối tượng</th><th>IP</th></tr></thead><tbody>{query.data.items.map((log) => <tr key={log.id}><td>{formatDateTime(log.createdAt)}</td><td><code>{log.action}</code></td><td>{log.user?.fullName ?? 'Hệ thống'}{log.user?.email && <span>{log.user.email}</span>}</td><td>{log.entityType ?? '—'}{log.entityId && <span>{log.entityId}</span>}</td><td>{log.ipAddress ?? '—'}</td></tr>)}</tbody></table></div>}{(query.data?.pagination.totalPages ?? 0) > 1 && <Pagination page={query.data?.pagination.page ?? page} totalPages={query.data?.pagination.totalPages ?? 1} onChange={setPage} />}</section>
}

function TemplatesPanel() {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useTopicTemplateImportMutation()
  const [templates, setTemplates] = useState<TopicTemplate[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => templates.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(search.toLowerCase())), [search, templates])
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const selectFile = (file?: File) => { if (!file) return; upload.mutate(file, { onSuccess: (result) => { setTemplates(result.templates); setPage(1); toast.success(`Đã kiểm tra ${result.imported} TopicTemplate`) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể nhập TopicTemplate')), onSettled: () => { if (inputRef.current) inputRef.current.value = '' } }) }
  return <section className="admin-panel template-panel"><div className="template-intro"><span><FileSpreadsheet size={23} /></span><div><h2>Nhập TopicTemplate từ Excel</h2><p>UI dùng nhãn TopicTemplate; backend vẫn giữ contract <code>subject-templates</code>. File cần ba cột: mã, tên và số tín chỉ.</p></div><input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(event) => selectFile(event.target.files?.[0])} /><Button onClick={() => inputRef.current?.click()} loading={upload.isPending}><Upload size={16} /> Chọn file Excel</Button></div>{templates.length > 0 && <><div className="admin-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Tìm trong kết quả nhập..." /><span>{filtered.length} mẫu</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã</th><th>Tên TopicTemplate</th><th>Số tín chỉ</th></tr></thead><tbody>{pageItems.map((item, index) => <tr key={`${item.code}-${index}`}><td><code>{item.code}</code></td><td>{item.name}</td><td>{item.credits}</td></tr>)}</tbody></table></div>{totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}</>}</section>
}

function ContentPanel() {
  const query = useSystemContentSupportQuery()
  if (query.isLoading) return <Skeleton height={180} />
  if (query.isError) return <QueryError retry={() => query.refetch()} />
  return <EmptyState icon={<LayoutDashboard size={23} />} title="Nội dung hệ thống chưa được cấu hình" description="Backend hiện chưa có kho dữ liệu nội dung, vì vậy trang không hiển thị biểu mẫu hoặc hành động giả." />
}

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview')
  return <div className="admin-page">
    <aside className="admin-shell-sidebar" aria-label="Điều hướng quản trị">
      <div className="admin-shell-brand"><span className="admin-shell-brand-mark"><ShieldCheck size={18} aria-hidden="true" /></span><div><strong>STUDYFLOW</strong><span>Admin</span></div></div>
      <nav className="admin-shell-nav">
        <section className="admin-shell-nav-group" aria-label="Quản trị StudyFlow"><p>QUẢN TRỊ</p>{primaryAdminNavigation.map((item) => <AdminShellNavItem key={item.label} item={item} activeTab={tab} onChange={setTab} />)}</section>
        <section className="admin-shell-nav-group" aria-label="Vận hành hiện có"><p>VẬN HÀNH</p>{operationalAdminNavigation.map((item) => <AdminShellNavItem key={item.label} item={item} activeTab={tab} onChange={setTab} />)}</section>
      </nav>
      <Link className="admin-shell-back" to="/"><ArrowLeft size={15} aria-hidden="true" />Quay lại StudyFlow</Link>
    </aside>
    <section className="admin-shell-content">
      <div className="page-heading admin-heading">
        <div><p className="eyebrow">QUẢN TRỊ STUDYFLOW</p><h1>Tổng quan hệ thống</h1><p className="subtle">Theo dõi hoạt động học tập và tình trạng nền tảng.</p></div>
        <div className="admin-heading-aside">
          <span className="admin-shield"><ShieldCheck size={17} /> Admin only</span>
          <div className="admin-heading-forest" aria-hidden="true"><span className="admin-heading-mountain back" /><span className="admin-heading-mountain front" /><span className="admin-heading-pine tall" /><span className="admin-heading-pine small" /><span className="admin-heading-ground" /></div>
        </div>
      </div>
      {tab === 'overview' && <OverviewPanel />}{tab === 'users' && <UsersPanel />}{tab === 'feedback' && <FeedbackPanel />}{tab === 'logs' && <LogsPanel />}{tab === 'templates' && <TemplatesPanel />}{tab === 'content' && <ContentPanel />}
    </section>
  </div>
}
