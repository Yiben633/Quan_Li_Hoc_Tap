import { CalendarDays, ChevronLeft, ChevronRight, Filter, ListFilter, Plus, Search, Target, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { PLAN_STATUS_LABELS, PRIORITY_LABELS } from '../features/tasks/task.constants'
import { StudyPlanCard } from '../features/tasks/components/StudyPlanCard'
import type { StudyPlan, StudyPlanInput } from '../features/tasks/tasks.api'
import { usePlanCreateMutation, usePlanDeleteMutation, usePlanSummaryQuery, usePlanUpdateMutation, usePlansQuery } from '../features/tasks/tasks.hooks'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const labels = PLAN_STATUS_LABELS
const priorities = PRIORITY_LABELS
const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
type PlanFilterState = { status: string; subjectId: string; priority: string }
type PlanSort = 'created-desc' | 'title-asc' | 'start-asc' | 'end-asc' | 'priority-desc'
const sortOptions: Record<PlanSort, { label: string; sort: 'createdAt' | 'title' | 'startDate' | 'endDate' | 'priority'; order: 'asc' | 'desc' }> = {
  'created-desc': { label: 'Mới tạo', sort: 'createdAt', order: 'desc' },
  'title-asc': { label: 'Tên A-Z', sort: 'title', order: 'asc' },
  'start-asc': { label: 'Ngày bắt đầu', sort: 'startDate', order: 'asc' },
  'end-asc': { label: 'Deadline gần nhất', sort: 'endDate', order: 'asc' },
  'priority-desc': { label: 'Ưu tiên cao', sort: 'priority', order: 'desc' },
}

function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function parseDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day) }
function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next }
function monthCells(anchor: Date) { const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1); const weekday = first.getDay(); const start = addDays(first, -(weekday === 0 ? 6 : weekday - 1)); return Array.from({ length: 42 }, (_, index) => addDays(start, index)) }

export function StudyPlansPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<PlanFilterState>({ status: '', subjectId: '', priority: '' })
  const [sort, setSort] = useState<PlanSort>('created-desc')
  const [filterOpen, setFilterOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudyPlan | null>(null)
  const [deleting, setDeleting] = useState<StudyPlan | null>(null)
  const navigate = useNavigate()
  const debouncedSearch = useDebouncedValue(search)
  const selectedSort = sortOptions[sort]
  const query = usePlansQuery({ ...filters, search: debouncedSearch, sort: selectedSort.sort, order: selectedSort.order })
  const summary = usePlanSummaryQuery()
  const topics = useTopicsQuery()
  const create = usePlanCreateMutation()
  const update = usePlanUpdateMutation()
  const remove = usePlanDeleteMutation()
  const plans = query.data?.items ?? []
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const clearFilters = () => { setFilters({ status: '', subjectId: '', priority: '' }); setSearch('') }
  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const save = (input: StudyPlanInput) => {
    const handlers = { onSuccess: () => { setModalOpen(false); toast.success(editing ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch') }, onError: () => toast.error('Không thể lưu kế hoạch') }
    if (editing) update.mutate({ id: editing.id, input }, handlers)
    else create.mutate(input, handlers)
  }
  const pausePlan = (plan: StudyPlan) => update.mutate({ id: plan.id, input: { status: 'paused' } }, { onSuccess: () => toast.success('Đã tạm dừng kế hoạch'), onError: () => toast.error('Không thể tạm dừng kế hoạch') })

  return <div className="plans-page"><div className="page-heading"><div><p className="eyebrow">LỘ TRÌNH TIẾN BỘ</p><h1>Kế hoạch</h1><p className="subtle">Chia mục tiêu lớn thành những bước nhỏ có thể hoàn thành.</p></div><Button onClick={openCreate}><Plus size={16} /> Tạo kế hoạch</Button></div><section className="plan-summary" aria-label="Tổng quan kế hoạch">{summary.isLoading ? <Skeleton width={360} height={30} /> : summary.data && <><span className="plan-summary-chip active">Đang thực hiện <strong>{summary.data.active}</strong></span><span className="plan-summary-chip due-soon">Sắp hết hạn <strong>{summary.data.dueSoon}</strong></span><span className="plan-summary-chip completed">Hoàn thành <strong>{summary.data.completed}</strong></span>{summary.data.overdue > 0 && <span className="plan-summary-chip overdue">Quá hạn <strong>{summary.data.overdue}</strong></span>}</>}</section><section className="panel plan-toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kế hoạch..." aria-label="Tìm kế hoạch" /></label><Button variant="secondary" className="task-filter-trigger" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}><ListFilter size={16} /> Bộ lọc{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</Button><div className="task-sort-select"><Select customMenu value={sort} onChange={(event) => setSort(event.target.value as PlanSort)} aria-label="Sắp xếp kế hoạch">{Object.entries(sortOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</Select></div><span className="subtle"><Filter size={14} /> {query.data?.pagination.total ?? 0} kế hoạch</span></section>{filterOpen && <section className="panel task-filter-panel plan-filter-panel"><Select label="Trạng thái" customMenu value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Mọi trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select label="Chủ đề" customMenu value={filters.subjectId} onChange={(event) => setFilters((current) => ({ ...current, subjectId: event.target.value }))}><option value="">Tất cả chủ đề</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</Select><Select label="Ưu tiên" customMenu value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}><option value="">Mọi ưu tiên</option>{Object.entries(priorities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>{(activeFilterCount > 0 || search) && <button type="button" className="plan-clear-filters" onClick={clearFilters}><X size={14} /> Xóa bộ lọc</button>}</section>}{query.isLoading ? <div className="plan-grid">{[1, 2, 3].map((item) => <Skeleton key={item} height={252} />)}</div> : query.isError ? <EmptyState title="Không thể tải kế hoạch" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : plans.length === 0 ? <EmptyState icon={<Target size={24} />} title="Chưa có kế hoạch" description="Tạo một lộ trình để biến mục tiêu thành hành động." action={<Button onClick={openCreate}><Plus size={16} /> Tạo kế hoạch</Button>} /> : <div className="plan-grid">{plans.map((plan) => <StudyPlanCard key={plan.id} plan={plan} onView={() => navigate(`/study-plans/${plan.id}`)} onEdit={() => { setEditing(plan); setModalOpen(true) }} onPause={() => pausePlan(plan)} onDelete={() => setDeleting(plan)} />)}</div>}<PlanForm key={editing?.id ?? 'new'} open={modalOpen} plan={editing} onClose={() => setModalOpen(false)} onSubmit={save} loading={create.isPending || update.isPending} /><ConfirmDialog open={Boolean(deleting)} title="Xóa kế hoạch?" description="Kế hoạch sẽ được ẩn khỏi danh sách." onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { setDeleting(null); toast.success('Đã xóa kế hoạch') }, onError: () => toast.error('Không thể xóa kế hoạch') })} loading={remove.isPending} /></div>
}

function PlanForm({ open, plan, onClose, onSubmit, loading }: { open: boolean; plan: StudyPlan | null; onClose: () => void; onSubmit: (input: StudyPlanInput) => void; loading: boolean }) {
  return <Modal open={open} title={plan ? 'Chỉnh sửa kế hoạch' : 'Tạo kế hoạch'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="study-plan-form" loading={loading}>{plan ? 'Lưu thay đổi' : 'Tạo kế hoạch'}</Button></>}><form id="study-plan-form" className="modal-form" onSubmit={(event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; if (values.startDate && values.endDate && values.endDate < values.startDate) { toast.error('Ngày kết thúc cần sau ngày bắt đầu'); return } onSubmit({ title: values.title.trim(), description: values.description || null, targetGoal: values.targetGoal || null, startDate: values.startDate || null, endDate: values.endDate || null, estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : null, priority: values.priority as StudyPlanInput['priority'], status: values.status as StudyPlanInput['status'] }) }}><Input name="title" label="Tên kế hoạch" defaultValue={plan?.title} required /><Input name="description" label="Mô tả (tùy chọn)" defaultValue={plan?.description ?? ''} /><Input name="targetGoal" label="Mục tiêu (tùy chọn)" defaultValue={plan?.targetGoal ?? ''} /><div className="form-grid"><PlanDatePicker name="startDate" label="Ngày bắt đầu" defaultValue={plan?.startDate?.slice(0, 10) ?? ''} /><PlanDatePicker name="endDate" label="Ngày kết thúc" defaultValue={plan?.endDate?.slice(0, 10) ?? ''} /></div><div className="form-grid"><Input name="estimatedHours" label="Số giờ dự kiến" type="number" min="0" step="0.5" defaultValue={plan?.estimatedHours ?? ''} /><Select name="priority" label="Ưu tiên" defaultValue={plan?.priority ?? 'medium'}>{Object.entries(priorities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><Select name="status" label="Trạng thái" customMenu defaultValue={plan?.status ?? 'not_started'}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></form></Modal>
}

function PlanDatePicker({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => { const selected = value ? parseDate(value) : new Date(); return new Date(selected.getFullYear(), selected.getMonth(), 1) })
  const cells = monthCells(month)
  const display = value ? parseDate(value).toLocaleDateString('vi-VN') : 'Chọn ngày'
  return <label className="field plan-date-picker"><span>{label}</span><input type="hidden" name={name} value={value} readOnly /><button type="button" className="plan-date-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}><span>{display}</span><CalendarDays size={16} /></button>{open && <div className="plan-date-popover"><div className="plan-date-head"><button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Tháng trước"><ChevronLeft size={15} /></button><strong>{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</strong><button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Tháng sau"><ChevronRight size={15} /></button></div><div className="plan-date-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="plan-date-days">{cells.map((day) => <button type="button" key={dayKey(day)} className={`${day.getMonth() !== month.getMonth() ? 'is-muted ' : ''}${dayKey(day) === value ? 'is-selected' : ''}`} onClick={() => { setValue(dayKey(day)); setOpen(false) }}>{day.getDate()}</button>)}</div><button type="button" className="plan-date-today" onClick={() => { const today = new Date(); setValue(dayKey(today)); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setOpen(false) }}>Hôm nay</button></div>}</label>
}
