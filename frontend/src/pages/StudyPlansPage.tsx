import { CalendarDays, Check, ChevronLeft, ChevronRight, Edit3, Filter, Plus, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import type { StudyPlan, StudyPlanInput } from '../features/tasks/tasks.api'
import { usePlanCreateMutation, usePlanDeleteMutation, usePlanUpdateMutation, usePlansQuery } from '../features/tasks/tasks.hooks'

const labels: Record<string, string> = { not_started: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', paused: 'Tạm dừng', completed: 'Hoàn thành', overdue: 'Quá hạn' }
const priorities = { low: 'Thấp', medium: 'Vừa', high: 'Cao', urgent: 'Khẩn cấp' }
const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function parseDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day) }
function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next }
function monthCells(anchor: Date) { const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1); const weekday = first.getDay(); const start = addDays(first, -(weekday === 0 ? 6 : weekday - 1)); return Array.from({ length: 42 }, (_, index) => addDays(start, index)) }

export function StudyPlansPage() {
  const [status, setStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudyPlan | null>(null)
  const [deleting, setDeleting] = useState<StudyPlan | null>(null)
  const query = usePlansQuery(status ? { status } : {})
  const create = usePlanCreateMutation()
  const update = usePlanUpdateMutation()
  const remove = usePlanDeleteMutation()
  const plans = query.data?.items ?? []
  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const save = (input: StudyPlanInput) => {
    const handlers = { onSuccess: () => { setModalOpen(false); toast.success(editing ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch') }, onError: () => toast.error('Không thể lưu kế hoạch') }
    if (editing) update.mutate({ id: editing.id, input }, handlers)
    else create.mutate(input, handlers)
  }

  return <div className="plans-page"><div className="page-heading"><div><p className="eyebrow">LỘ TRÌNH TIẾN BỘ</p><h1>Kế hoạch</h1><p className="subtle">Chia mục tiêu lớn thành những bước nhỏ có thể hoàn thành.</p></div><Button onClick={openCreate}><Plus size={16} /> Tạo kế hoạch</Button></div><section className="panel plan-toolbar"><Select customMenu value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái kế hoạch"><option value="">Mọi trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><span className="subtle"><Filter size={14} /> {query.data?.pagination.total ?? 0} kế hoạch</span></section>{query.isLoading ? <div className="plan-grid">{[1, 2, 3].map((item) => <Skeleton key={item} height={190} />)}</div> : query.isError ? <EmptyState title="Không thể tải kế hoạch" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : plans.length === 0 ? <EmptyState icon={<Target size={24} />} title="Chưa có kế hoạch" description="Tạo một lộ trình để biến mục tiêu thành hành động." action={<Button onClick={openCreate}><Plus size={16} /> Tạo kế hoạch</Button>} /> : <div className="plan-grid">{plans.map((plan) => <article className="plan-card" key={plan.id}><div className="plan-card-head"><span className={`plan-status plan-${plan.status}`}>{labels[plan.status] ?? plan.status}</span><div className="plan-card-actions"><button className="icon-button" onClick={() => { setEditing(plan); setModalOpen(true) }} aria-label={`Sửa ${plan.title}`}><Edit3 size={16} /></button><button className="icon-button danger-icon" onClick={() => setDeleting(plan)} aria-label={`Xóa ${plan.title}`}><Trash2 size={16} /></button></div></div><h2>{plan.title}</h2><p className="subtle">{plan.targetGoal || 'Kế hoạch cá nhân'} · {plan.endDate ? new Date(plan.endDate).toLocaleDateString('vi-VN') : 'Chưa đặt hạn'}</p><div className="progress-line"><span style={{ width: `${plan.progressPercent}%` }} /></div><div className="plan-progress"><strong>{plan.progressPercent}%</strong><span><Check size={14} /> tiến độ</span><span className={`priority priority-${plan.priority}`}>{priorities[plan.priority]}</span></div></article>)}</div>}<PlanForm key={editing?.id ?? 'new'} open={modalOpen} plan={editing} onClose={() => setModalOpen(false)} onSubmit={save} loading={create.isPending || update.isPending} /><ConfirmDialog open={Boolean(deleting)} title="Xóa kế hoạch?" description="Kế hoạch sẽ được ẩn khỏi danh sách." onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { setDeleting(null); toast.success('Đã xóa kế hoạch') }, onError: () => toast.error('Không thể xóa kế hoạch') })} loading={remove.isPending} /></div>
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
