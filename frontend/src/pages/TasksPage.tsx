import { Check, CheckSquare, ListFilter, ListTodo, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { DIFFICULTY_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '../features/tasks/task.constants'
import { TaskDrawer } from '../features/tasks/components/TaskDrawer'
import { TaskForm } from '../features/tasks/components/TaskForm'
import { TaskList } from '../features/tasks/components/TaskList'
import { TaskModuleTabs } from '../features/tasks/components/TaskModuleTabs'
import { TaskQuickCreate } from '../features/tasks/components/TaskQuickCreate'
import type { Task, TaskStatus } from '../features/tasks/tasks.api'
import { useOverdueTasksQuery, usePlansQuery, useTaskCreateMutation, useTaskDeleteMutation, useTaskDuplicateMutation, useTaskStatusMutation, useTasksQuery, useTaskUpdateMutation, useTodayTasksQuery } from '../features/tasks/tasks.hooks'

type TaskScope = 'today' | 'upcoming' | 'overdue' | 'all'
type TaskFilterState = { search: string; status: string; priority: string; subjectId: string; studyPlanId: string; dueDate: string; difficulty: string; page: number }
type TaskFilterKey = Exclude<keyof TaskFilterState, 'search' | 'page'>
type TaskSort = 'custom' | 'due-asc' | 'due-desc' | 'priority-desc' | 'created-desc' | 'title-asc'
type BulkMoveKind = 'subject' | 'plan'

const scopeLabels: Record<TaskScope, string> = { today: 'Hôm nay', upcoming: 'Sắp tới', overdue: 'Quá hạn', all: 'Tất cả' }
const sortOptions: Record<TaskSort, { label: string; sort: 'sortOrder' | 'dueDate' | 'priority' | 'createdAt' | 'title'; order: 'asc' | 'desc' }> = {
  custom: { label: 'Thứ tự tùy chỉnh', sort: 'sortOrder', order: 'asc' },
  'due-asc': { label: 'Deadline gần nhất', sort: 'dueDate', order: 'asc' },
  'due-desc': { label: 'Deadline xa nhất', sort: 'dueDate', order: 'desc' },
  'priority-desc': { label: 'Ưu tiên cao', sort: 'priority', order: 'desc' },
  'created-desc': { label: 'Mới tạo', sort: 'createdAt', order: 'desc' },
  'title-asc': { label: 'Tên A–Z', sort: 'title', order: 'asc' },
}

function isTaskScope(value: string | null): value is TaskScope {
  return value !== null && value in scopeLabels
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function toDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateChip(value: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const requestedScope = params.get('scope')
  const scope = isTaskScope(requestedScope) ? requestedScope : 'all'
  const [filters, setFilters] = useState<TaskFilterState>({ search: '', status: '', priority: '', subjectId: '', studyPlanId: '', dueDate: '', difficulty: '', page: 1 })
  const [sort, setSort] = useState<TaskSort>('custom')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState('')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [removeId, setRemoveId] = useState('')
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkMoveKind, setBulkMoveKind] = useState<BulkMoveKind | null>(null)
  const [bulkTargetId, setBulkTargetId] = useState('')
  const [bulkMoving, setBulkMoving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const tomorrow = toDateParam(addDays(new Date(), 1))
  const nextWeek = toDateParam(addDays(new Date(), 7))
  const sortQuery = sortOptions[sort]
  const allQuery = useTasksQuery({ ...filters, ...sortQuery, limit: 15 })
  const upcomingQuery = useTasksQuery({ ...filters, ...sortQuery, dueFrom: tomorrow, dueTo: nextWeek, limit: 15 })
  const allCountQuery = useTasksQuery({ limit: 1 })
  const upcomingCountQuery = useTasksQuery({ dueFrom: tomorrow, dueTo: nextWeek, limit: 1 })
  const todayQuery = useTodayTasksQuery()
  const overdueQuery = useOverdueTasksQuery()
  const topics = useTopicsQuery()
  const plans = usePlansQuery({ limit: '100' })
  const statusMutation = useTaskStatusMutation()
  const updateMutation = useTaskUpdateMutation()
  const deleteMutation = useTaskDeleteMutation()
  const duplicateMutation = useTaskDuplicateMutation()
  const createMutation = useTaskCreateMutation()
  const isDedicatedScope = scope === 'today' || scope === 'overdue'
  const tasks = scope === 'today' ? todayQuery.data ?? [] : scope === 'overdue' ? overdueQuery.data ?? [] : scope === 'upcoming' ? upcomingQuery.data?.items ?? [] : allQuery.data?.items ?? []
  const isLoading = scope === 'today' ? todayQuery.isLoading : scope === 'overdue' ? overdueQuery.isLoading : scope === 'upcoming' ? upcomingQuery.isLoading : allQuery.isLoading
  const isError = scope === 'today' ? todayQuery.isError : scope === 'overdue' ? overdueQuery.isError : scope === 'upcoming' ? upcomingQuery.isError : allQuery.isError
  const pagination = scope === 'upcoming' ? upcomingQuery.data?.pagination : scope === 'all' ? allQuery.data?.pagination : undefined
  const scopeCounts: Record<TaskScope, number | undefined> = { today: todayQuery.data?.length, upcoming: upcomingCountQuery.data?.pagination.total, overdue: overdueQuery.data?.length, all: allCountQuery.data?.pagination.total }
  const activeFilters = [
    filters.status && { key: 'status' as const, label: TASK_STATUS_LABELS[filters.status as TaskStatus] },
    filters.priority && { key: 'priority' as const, label: PRIORITY_LABELS[filters.priority as keyof typeof PRIORITY_LABELS] },
    filters.subjectId && { key: 'subjectId' as const, label: topics.data?.items.find((topic) => topic.id === filters.subjectId)?.name ?? 'Môn học đã chọn' },
    filters.studyPlanId && { key: 'studyPlanId' as const, label: plans.data?.items.find((plan) => plan.id === filters.studyPlanId)?.title ?? 'Kế hoạch đã chọn' },
    filters.dueDate && { key: 'dueDate' as const, label: `Hạn ${formatDateChip(filters.dueDate)}` },
    filters.difficulty && { key: 'difficulty' as const, label: DIFFICULTY_LABELS[Number(filters.difficulty) as keyof typeof DIFFICULTY_LABELS] },
  ].filter(Boolean) as Array<{ key: TaskFilterKey; label: string }>

  useEffect(() => {
    if (requestedScope === scope) return
    const next = new URLSearchParams(params)
    next.set('scope', scope)
    setParams(next, { replace: true })
  }, [params, requestedScope, scope, setParams])

  const updateFilter = (key: keyof TaskFilterState, value: string) => setFilters((current) => ({ ...current, [key]: value, page: 1 }))
  const clearFilters = () => setFilters((current) => ({ ...current, status: '', priority: '', subjectId: '', studyPlanId: '', dueDate: '', difficulty: '', page: 1 }))
  const exitSelectionMode = () => { setSelectionMode(false); setSelected([]) }
  const selectScope = (nextScope: TaskScope) => {
    const next = new URLSearchParams(params)
    next.set('scope', nextScope)
    setParams(next)
    exitSelectionMode()
    setFilters((current) => ({ ...current, page: 1 }))
  }
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const allSelected = tasks.length > 0 && tasks.every((task) => selected.includes(task.id))
  const toggleAll = () => setSelected((current) => allSelected ? current.filter((id) => !tasks.some((task) => task.id === id)) : Array.from(new Set([...current, ...tasks.map((task) => task.id)])))
  const bulkStatus = async (status: TaskStatus) => {
    if (selected.length === 0) return
    try {
      await Promise.all(selected.map((id) => statusMutation.mutateAsync({ id, status })))
      setSelected([])
      toast.success('Đã cập nhật các công việc')
    } catch {
      toast.error('Không thể cập nhật tất cả công việc')
    }
  }
  const openBulkMove = (kind: BulkMoveKind) => {
    if (selected.length === 0) return
    setBulkTargetId('')
    setBulkMoveKind(kind)
  }
  const bulkMove = async () => {
    if (!bulkMoveKind || !bulkTargetId) return
    setBulkMoving(true)
    try {
      const input = bulkMoveKind === 'subject' ? { subjectId: bulkTargetId } : { studyPlanId: bulkTargetId }
      await Promise.all(selected.map((id) => updateMutation.mutateAsync({ id, input })))
      setSelected([])
      setBulkMoveKind(null)
      toast.success(bulkMoveKind === 'subject' ? 'Đã chuyển môn học cho các công việc' : 'Đã chuyển kế hoạch cho các công việc')
    } catch {
      toast.error('Không thể chuyển tất cả công việc')
    } finally {
      setBulkMoving(false)
    }
  }
  const bulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)))
      setSelected([])
      setBulkRemoveOpen(false)
      toast.success('Đã xóa các công việc đã chọn')
    } catch {
      toast.error('Một hoặc nhiều công việc chưa thể xóa')
    } finally {
      setBulkDeleting(false)
    }
  }
  const retry = () => {
    if (scope === 'today') void todayQuery.refetch()
    else if (scope === 'overdue') void overdueQuery.refetch()
    else if (scope === 'upcoming') void upcomingQuery.refetch()
    else void allQuery.refetch()
  }

  return <div className="tasks-page">
    <div className="page-heading tasks-heading">
      <div><p className="eyebrow">NHỊP TIẾN ĐỘ CỦA BẠN</p><h1>Công việc</h1><p className="subtle">Tập trung vào việc tiếp theo, dù bạn đang học hay làm một dự án riêng.</p></div>
      <div className="tasks-heading-actions">
        <Button variant="secondary" onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}><CheckSquare size={16} /> {selectionMode ? 'Thoát chọn' : 'Chọn nhiều'}</Button>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Tạo công việc</Button>
      </div>
    </div>
    <TaskModuleTabs />
    <nav className="task-scope-tabs" aria-label="Phạm vi công việc">{(Object.keys(scopeLabels) as TaskScope[]).map((item) => <button key={item} type="button" className={scope === item ? 'active' : ''} onClick={() => selectScope(item)} aria-pressed={scope === item}>{scopeLabels[item]} <span>{scopeCounts[item] ?? '—'}</span></button>)}</nav>
    {!isDedicatedScope && <>
      <section className="panel task-toolbar">
        <label className="search-field"><Search size={16} /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Tìm công việc..." aria-label="Tìm công việc" /></label>
        <Button variant="secondary" className="task-filter-trigger" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}><ListFilter size={16} /> Bộ lọc{activeFilters.length > 0 && <span>{activeFilters.length}</span>}</Button>
        <div className="task-sort-select"><Select customMenu value={sort} onChange={(event) => setSort(event.target.value as TaskSort)} aria-label="Sắp xếp công việc">{Object.entries(sortOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</Select></div>
      </section>
      {filterOpen && <section className="panel task-filter-panel">
        <Select label="Trạng thái" customMenu value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(TASK_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select label="Ưu tiên" customMenu value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}><option value="">Mọi ưu tiên</option>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select label="Môn học" customMenu value={filters.subjectId} onChange={(event) => updateFilter('subjectId', event.target.value)}><option value="">Tất cả môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</Select>
        <Select label="Kế hoạch" customMenu value={filters.studyPlanId} onChange={(event) => updateFilter('studyPlanId', event.target.value)}><option value="">Tất cả kế hoạch</option>{plans.data?.items.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</Select>
        <Input label="Hạn hoàn thành" type="date" value={filters.dueDate} onChange={(event) => updateFilter('dueDate', event.target.value)} />
        <Select label="Độ khó" customMenu value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">Mọi độ khó</option>{Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      </section>}
      {activeFilters.length > 0 && <div className="task-filter-chips">{activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => updateFilter(filter.key, '')}>{filter.label} <X size={13} /></button>)}<button type="button" className="task-clear-filters" onClick={clearFilters}>Xóa bộ lọc</button></div>}
    </>}
    <TaskQuickCreate topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} />
    {selectionMode && <div className="bulk-toolbar" aria-label="Thao tác nhiều công việc">
      <button type="button" className="bulk-select-all" onClick={toggleAll}><CheckSquare size={15} /> {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button>
      <strong>{selected.length > 0 ? `${selected.length} việc đã chọn` : 'Chọn các công việc cần thao tác'}</strong>
      <Button variant="secondary" disabled={selected.length === 0} onClick={() => void bulkStatus('done')}><Check size={15} /> Hoàn thành</Button>
      <Button variant="secondary" disabled={selected.length === 0} onClick={() => void bulkStatus('in_progress')}>Đang làm</Button>
      <Button variant="secondary" disabled={selected.length === 0} onClick={() => openBulkMove('subject')}>Chuyển môn học</Button>
      <Button variant="secondary" disabled={selected.length === 0} onClick={() => openBulkMove('plan')}>Chuyển kế hoạch</Button>
      <Button variant="danger" disabled={selected.length === 0} onClick={() => setBulkRemoveOpen(true)}><Trash2 size={15} /> Xóa</Button>
      <button type="button" className="bulk-exit-selection" onClick={exitSelectionMode} aria-label="Thoát chế độ chọn nhiều"><X size={16} /> Thoát chọn</button>
    </div>}
    {isLoading ? <div className="task-list-page">{[1, 2, 3].map((item) => <Skeleton key={item} height={116} />)}</div> : isError ? <EmptyState icon={<ListTodo size={24} />} title="Không thể tải công việc" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={retry}>Thử lại</Button>} /> : tasks.length === 0 ? <EmptyState icon={<CheckSquare size={24} />} title={`Chưa có việc ${scopeLabels[scope].toLowerCase()}`} description="Tạo một việc nhỏ để bắt đầu nhịp của bạn." action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Tạo công việc</Button>} /> : <TaskList tasks={tasks} selectionMode={selectionMode} selectedIds={selected} onSelect={toggleSelected} onOpen={setDrawerId} onEdit={setEditTask} onDuplicate={(task) => duplicateMutation.mutate(task.id, { onSuccess: () => toast.success('Đã nhân bản công việc'), onError: () => toast.error('Không thể nhân bản công việc') })} onStatusChange={(id, status) => statusMutation.mutate({ id, status })} onDelete={setRemoveId} />}
    {pagination && pagination.totalPages > 1 && <div className="task-pagination"><Button variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</Button><span>Trang {filters.page} / {pagination.totalPages}</span><Button variant="secondary" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</Button></div>}
    <TaskForm open={createOpen} title="Tạo công việc" submitLabel="Lưu công việc" onClose={() => setCreateOpen(false)} topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} loading={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success('Đã tạo công việc') }, onError: () => toast.error('Không thể tạo công việc') })} />
    <TaskForm open={Boolean(editTask)} title="Chỉnh sửa công việc" submitLabel="Lưu thay đổi" onClose={() => setEditTask(null)} initial={editTask ?? undefined} topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} loading={updateMutation.isPending} onSubmit={(input) => { if (!editTask) return; updateMutation.mutate({ id: editTask.id, input }, { onSuccess: () => { setEditTask(null); toast.success('Đã cập nhật công việc') }, onError: () => toast.error('Không thể cập nhật công việc') }) }} />
    <TaskDrawer id={drawerId} onClose={() => setDrawerId('')} onDelete={(id) => { setDrawerId(''); setRemoveId(id) }} />
    <ConfirmDialog open={Boolean(removeId)} title="Xóa công việc?" description="Công việc sẽ được ẩn khỏi danh sách." onCancel={() => setRemoveId('')} onConfirm={() => deleteMutation.mutate(removeId, { onSuccess: () => { setRemoveId(''); toast.success('Đã xóa công việc') }, onError: () => toast.error('Không thể xóa công việc') })} loading={deleteMutation.isPending} />
    <ConfirmDialog open={bulkRemoveOpen} title={`Xóa ${selected.length} công việc?`} description={`${selected.length} công việc được chọn sẽ bị xóa.`} onCancel={() => setBulkRemoveOpen(false)} onConfirm={bulkDelete} loading={bulkDeleting} />
    <Modal open={bulkMoveKind !== null} title={bulkMoveKind === 'subject' ? 'Chuyển môn học cho công việc' : 'Chuyển kế hoạch cho công việc'} onClose={() => setBulkMoveKind(null)} footer={<><Button variant="secondary" onClick={() => setBulkMoveKind(null)}>Hủy</Button><Button disabled={!bulkTargetId} loading={bulkMoving} onClick={() => void bulkMove()}>Xác nhận chuyển</Button></>}>
      <p className="subtle">Áp dụng thay đổi cho {selected.length} công việc đã chọn.</p>
      {bulkMoveKind === 'subject' ? <Select label="Môn học mới" customMenu value={bulkTargetId} onChange={(event) => setBulkTargetId(event.target.value)}><option value="">Chọn môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</Select> : <Select label="Kế hoạch mới" customMenu value={bulkTargetId} onChange={(event) => setBulkTargetId(event.target.value)}><option value="">Chọn kế hoạch</option>{plans.data?.items.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</Select>}
    </Modal>
  </div>
}
