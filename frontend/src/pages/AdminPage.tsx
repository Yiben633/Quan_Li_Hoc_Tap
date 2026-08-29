import { Activity, Ban, CheckCircle2, ClipboardList, FileSpreadsheet, Inbox, LayoutDashboard, MessageSquareText, Search, ShieldCheck, Timer, Upload, UserPlus, Users, UserX } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Modal, Pagination, Select, Skeleton, Tabs, Textarea } from '../components/ui'
import type { AdminFeedback, AdminStatisticsRange, AdminUser, FeedbackStatus, TopicTemplate } from '../features/admin/admin.api'
import { useActivityLogsQuery, useAdminFeedbackQuery, useAdminFeedbackUpdateMutation, useAdminStatisticsQuery, useAdminUsersQuery, useAdminUserUpdateMutation, useSystemContentSupportQuery, useTopicTemplateImportMutation } from '../features/admin/admin.hooks'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useAuthStore } from '../stores/authStore'

type AdminTab = 'overview' | 'users' | 'feedback' | 'logs' | 'templates' | 'content'
const feedbackStatusLabels: Record<FeedbackStatus, string> = { open: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng' }
const feedbackTypeLabels = { bug: 'Lỗi', feature_request: 'Đề xuất', question: 'Câu hỏi' }
const adminActionLabels: Record<string, string> = {
  'admin.bootstrap_granted': 'Cấp quyền quản trị ban đầu',
  'admin.user_updated': 'Cập nhật tài khoản người dùng',
  'admin.feedback_updated': 'Cập nhật phản hồi',
  'admin.topic_templates_imported': 'Nhập TopicTemplate',
}

function formatDateTime(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) }
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="admin-search"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label> }
function QueryError({ retry }: { retry: () => void }) { return <EmptyState title="Không thể tải dữ liệu" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={retry}>Thử lại</Button>} /> }

function OverviewPanel() {
  const [range, setRange] = useState<AdminStatisticsRange>('30d')
  const query = useAdminStatisticsQuery(range)
  const rangeControl = <Select customMenu aria-label="Khoảng thời gian thống kê người dùng mới" value={range} onChange={(event) => setRange(event.target.value as AdminStatisticsRange)}>
    <option value="7d">7 ngày gần đây</option>
    <option value="30d">30 ngày gần đây</option>
    <option value="90d">90 ngày gần đây</option>
  </Select>

  if (query.isLoading) return <section className="admin-overview"><div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div>{rangeControl}</div><div className="admin-stat-grid">{Array.from({ length: 9 }, (_, index) => <Skeleton key={index} height={105} />)}</div><Skeleton height={230} /></section>
  if (query.isError || !query.data) return <section className="admin-overview"><div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div>{rangeControl}</div><QueryError retry={() => query.refetch()} /></section>

  const items = [
    { label: 'Tài khoản hoạt động', value: query.data.activeUsers.toLocaleString('vi-VN'), icon: Users },
    { label: 'Người dùng mới trong ' + query.data.range.days + ' ngày', value: query.data.newUsers.toLocaleString('vi-VN'), icon: UserPlus },
    { label: 'Tài khoản bị vô hiệu hóa', value: query.data.disabledUsers.toLocaleString('vi-VN'), icon: UserX },
    { label: 'Tổng công việc', value: query.data.tasks.toLocaleString('vi-VN'), icon: Inbox },
    { label: 'Tổng kế hoạch', value: query.data.studyPlans.toLocaleString('vi-VN'), icon: ClipboardList },
    { label: 'Tổng phiên tập trung', value: query.data.studySessions.toLocaleString('vi-VN'), icon: Timer },
    { label: 'Công việc hoàn thành', value: query.data.completedTasks.toLocaleString('vi-VN'), icon: CheckCircle2 },
    { label: 'Phút tập trung', value: query.data.totalStudyMinutes.toLocaleString('vi-VN'), icon: Activity },
    { label: 'Phản hồi cần xử lý', value: query.data.openFeedback.toLocaleString('vi-VN'), icon: MessageSquareText },
  ]
  return <section className="admin-overview">
    <div className="admin-overview-heading"><div><h2>Mức độ sử dụng thực tế</h2><p>Tổng hợp trực tiếp từ dữ liệu hệ thống.</p></div>{rangeControl}</div>
    <div className="admin-stat-grid">{items.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={18} /></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <section className="admin-recent-activity" aria-labelledby="recent-admin-activity-title">
      <div><h2 id="recent-admin-activity-title">Hoạt động quản trị gần đây</h2><p>Tối đa 8 hành động gần nhất, không gồm nội dung riêng tư của người dùng.</p></div>
      {query.data.recentAdminActivity.length === 0 ? <EmptyState title="Chưa có hoạt động quản trị" description="Các thao tác quản trị có audit sẽ xuất hiện tại đây." /> : <div className="admin-activity-list">{query.data.recentAdminActivity.map((item) => <article key={item.id}>
        <span className="admin-activity-icon"><ShieldCheck size={16} /></span>
        <div><strong>{adminActionLabels[item.action] ?? item.action}</strong><p>{[item.actor?.fullName ?? 'Hệ thống', item.entityType].filter(Boolean).join(' · ')}</p></div>
        <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
      </article>)}</div>}
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
        <td><button className={`admin-state-button ${user.isEmailVerified ? 'success' : ''}`} disabled={update.isPending} aria-label={`${user.isEmailVerified ? 'Bỏ xác minh' : 'Xác minh'} email của ${user.fullName}`} onClick={() => patchUser(user, { isEmailVerified: !user.isEmailVerified }, user.isEmailVerified ? 'Đã bỏ xác minh email' : 'Đã xác minh email')}><CheckCircle2 size={14} /> {user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</button></td>
        <td><span className={`admin-status ${user.status}`}>{user.status === 'disabled' ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}</span></td>
        <td>{formatDateTime(user.createdAt)}</td>
        <td>{formatDateTime(user.updatedAt)}</td>
        <td>{user.status === 'disabled' ? <Button variant="secondary" loading={isUpdating} disabled={update.isPending} onClick={() => patchUser(user, { deletedAt: null }, 'Đã khôi phục tài khoản')}>Khôi phục</Button> : <Button variant="ghost" disabled={isSelf || update.isPending} aria-label={isSelf ? 'Không thể tự vô hiệu hóa tài khoản quản trị' : `Vô hiệu hóa tài khoản ${user.fullName}`} title={isSelf ? 'Bạn không thể tự vô hiệu hóa tài khoản đang dùng' : undefined} onClick={() => setPendingDeactivate(user)}><Ban size={15} /> Vô hiệu hóa</Button>}</td>
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
  const tabs = [
    { value: 'overview' as const, label: 'Tổng quan' }, { value: 'users' as const, label: 'Người dùng' }, { value: 'feedback' as const, label: 'Phản hồi' },
    { value: 'logs' as const, label: 'Nhật ký' }, { value: 'templates' as const, label: 'TopicTemplate' }, { value: 'content' as const, label: 'Nội dung' },
  ]
  return <div className="admin-page"><div className="page-heading admin-heading"><div><p className="eyebrow">KHU VỰC ĐƯỢC BẢO VỆ</p><h1>Quản trị</h1><p className="subtle">Theo dõi vận hành và xử lý dữ liệu hệ thống với audit rõ ràng.</p></div><span className="admin-shield"><ShieldCheck size={17} /> Admin only</span></div><Tabs value={tab} onChange={setTab} items={tabs} />{tab === 'overview' && <OverviewPanel />}{tab === 'users' && <UsersPanel />}{tab === 'feedback' && <FeedbackPanel />}{tab === 'logs' && <LogsPanel />}{tab === 'templates' && <TemplatesPanel />}{tab === 'content' && <ContentPanel />}</div>
}
