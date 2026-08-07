import { Check, CheckSquare, Copy, Edit3, Filter, ListTodo, Paperclip, Plus, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Checkbox, ConfirmDialog, Drawer, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { TaskModuleTabs } from '../features/tasks/components/TaskModuleTabs'
import type { Priority, StudyPlan, Task, TaskStatus } from '../features/tasks/tasks.api'
import { usePlansQuery, useSubtaskMutation, useTaskAttachmentMutation, useTaskCreateMutation, useTaskDeleteMutation, useTaskDuplicateMutation, useTaskQuery, useTasksQuery, useTaskStatusMutation, useTaskUpdateMutation } from '../features/tasks/tasks.hooks'

const statusLabels: Record<TaskStatus, string> = { todo: 'Chưa làm', in_progress: 'Đang làm', waiting: 'Chờ xử lý', done: 'Hoàn thành' }
const priorityLabels: Record<Priority, string> = { low: 'Thấp', medium: 'Vừa', high: 'Cao', urgent: 'Khẩn cấp' }

export function TasksPage() {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', dueDate: '', page: 1 })
  const [selected, setSelected] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState('')
  const [removeId, setRemoveId] = useState('')
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const query = useTasksQuery({ ...filters, limit: 15 })
  const topics = useTopicsQuery()
  const plans = usePlansQuery({ limit: '100' })
  const statusMutation = useTaskStatusMutation()
  const deleteMutation = useTaskDeleteMutation()
  const createMutation = useTaskCreateMutation()
  const tasks = query.data?.items ?? []
  const update = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value, page: 1 }))
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const allSelected = tasks.length > 0 && tasks.every((task) => selected.includes(task.id))
  const toggleAll = () => setSelected((current) => allSelected ? current.filter((id) => !tasks.some((task) => task.id === id)) : Array.from(new Set([...current, ...tasks.map((task) => task.id)])))
  const bulkStatus = (status: TaskStatus) => {
    Promise.all(selected.map((id) => statusMutation.mutateAsync({ id, status }))).then(() => { setSelected([]); toast.success('Đã cập nhật các công việc') }).catch(() => toast.error('Không thể cập nhật tất cả công việc'))
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

  return <div className="tasks-page"><div className="page-heading tasks-heading"><div><p className="eyebrow">NHỊP TIẾN ĐỘ CỦA BẠN</p><h1>Công việc</h1><p className="subtle">Tập trung vào việc tiếp theo, dù bạn đang học hay làm một dự án riêng.</p></div><Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Tạo công việc</Button></div><TaskModuleTabs /><section className="panel task-toolbar"><label className="search-field"><Search size={16} /><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Tìm công việc..." aria-label="Tìm công việc" /></label><Select customMenu value={filters.status} onChange={(event) => update('status', event.target.value)} aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select customMenu value={filters.priority} onChange={(event) => update('priority', event.target.value)} aria-label="Lọc độ ưu tiên"><option value="">Mọi ưu tiên</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Input type="date" value={filters.dueDate} onChange={(event) => update('dueDate', event.target.value)} aria-label="Lọc hạn hoàn thành" /></section>{selected.length > 0 && <div className="bulk-toolbar"><button type="button" className="bulk-select-all" onClick={toggleAll}><CheckSquare size={15} /> {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button><strong>{selected.length} việc đã chọn</strong><Button variant="secondary" onClick={() => bulkStatus('done')}><Check size={15} /> Hoàn thành</Button><Button variant="secondary" onClick={() => bulkStatus('in_progress')}>Đang làm</Button><Button variant="danger" onClick={() => setBulkRemoveOpen(true)}><Trash2 size={15} /> Xóa</Button><button className="icon-button" onClick={() => setSelected([])} aria-label="Bỏ chọn"><X size={16} /></button></div>}{query.isLoading ? <div className="task-list-page">{[1, 2, 3].map((item) => <Skeleton key={item} height={72} />)}</div> : query.isError ? <EmptyState icon={<ListTodo size={24} />} title="Không thể tải công việc" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : tasks.length === 0 ? <EmptyState icon={<CheckSquare size={24} />} title="Chưa có công việc" description="Tạo một việc nhỏ để bắt đầu nhịp của bạn." action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Tạo công việc</Button>} /> : <div className="task-list-page">{tasks.map((task) => <TaskRow key={task.id} task={task} checked={selected.includes(task.id)} onCheck={() => toggle(task.id)} onOpen={() => setDrawerId(task.id)} onStatus={(nextStatus) => statusMutation.mutate({ id: task.id, status: nextStatus })} onDelete={() => setRemoveId(task.id)} />)}</div>}{query.data && query.data.pagination.totalPages > 1 && <div className="task-pagination"><Button variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</Button><span>Trang {filters.page} / {query.data.pagination.totalPages}</span><Button variant="secondary" disabled={filters.page >= query.data.pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</Button></div>}<TaskForm open={createOpen} title="Tạo công việc" submitLabel="Lưu công việc" onClose={() => setCreateOpen(false)} topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} loading={createMutation.isPending} onSubmit={(input) => createMutation.mutate(input, { onSuccess: () => { setCreateOpen(false); toast.success('Đã tạo công việc') }, onError: () => toast.error('Không thể tạo công việc') })} /><TaskDrawer id={drawerId} onClose={() => setDrawerId('')} onDelete={(id) => { setDrawerId(''); setRemoveId(id) }} /><ConfirmDialog open={Boolean(removeId)} title="Xóa công việc?" description="Công việc sẽ được ẩn khỏi danh sách." onCancel={() => setRemoveId('')} onConfirm={() => deleteMutation.mutate(removeId, { onSuccess: () => { setRemoveId(''); toast.success('Đã xóa công việc') }, onError: () => toast.error('Không thể xóa công việc') })} loading={deleteMutation.isPending} /><ConfirmDialog open={bulkRemoveOpen} title={`Xóa ${selected.length} công việc?`} description={`${selected.length} công việc được chọn sẽ bị xóa.`} onCancel={() => setBulkRemoveOpen(false)} onConfirm={bulkDelete} loading={bulkDeleting} /></div>
}

function TaskRow({ task, checked, onCheck, onOpen, onStatus, onDelete }: { task: Task; checked: boolean; onCheck: () => void; onOpen: () => void; onStatus: (status: TaskStatus) => void; onDelete: () => void }) {
  return <article className={`task-list-row task-status-${task.status}`}><input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Chọn ${task.title}`} /><button className="task-row-main" onClick={onOpen}><span className="task-row-title">{task.title}</span><span className="task-row-meta">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Chưa đặt hạn'} · {priorityLabels[task.priority]}</span></button><Select customMenu value={task.status} onChange={(event) => onStatus(event.target.value as TaskStatus)} aria-label={`Trạng thái ${task.title}`}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><button className="icon-button danger-icon" onClick={onDelete} aria-label={`Xóa ${task.title}`}><Trash2 size={16} /></button></article>
}

function TaskDrawer({ id, onClose, onDelete }: { id: string; onClose: () => void; onDelete: (id: string) => void }) {
  const query = useTaskQuery(id)
  const topics = useTopicsQuery()
  const plans = usePlansQuery({ limit: '100' })
  const subtaskMutation = useSubtaskMutation()
  const duplicate = useTaskDuplicateMutation()
  const update = useTaskUpdateMutation()
  const upload = useTaskAttachmentMutation()
  const [editOpen, setEditOpen] = useState(false)
  const task = query.data
  return <><Drawer open={Boolean(id)} title={task?.title ?? 'Chi tiết công việc'} onClose={onClose}><div className="task-drawer-content">{query.isLoading ? <Skeleton height={300} /> : query.isError || !task ? <EmptyState title="Không thể tải công việc" description="Thử đóng rồi mở lại." /> : <><div className="drawer-task-status"><span className={`status-label task-pill-${task.status}`}>{statusLabels[task.status]}</span><span className={`priority priority-${task.priority}`}>{priorityLabels[task.priority]}</span></div>{task.description && <p className="drawer-description">{task.description}</p>}<div className="drawer-section"><h3>Việc nhỏ</h3>{task.subTasks.length ? task.subTasks.map((subtask) => <Checkbox key={subtask.id} label={subtask.title} checked={subtask.isDone} onChange={(event) => subtaskMutation.mutate({ taskId: task.id, subtaskId: subtask.id, isDone: event.target.checked })} />) : <p className="subtle">Chưa có việc nhỏ.</p>}</div><div className="drawer-section"><div className="drawer-section-heading"><h3>Tệp đính kèm</h3><label className="drawer-upload"><Paperclip size={15} /> Thêm tệp<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; upload.mutate({ taskId: task.id, file }, { onSuccess: () => toast.success('Đã thêm tệp'), onError: () => toast.error('Không thể thêm tệp') }); event.currentTarget.value = '' }} /></label></div>{upload.isPending && <p className="subtle">Đang tải tệp lên...</p>}{task.attachments.length ? task.attachments.map((file) => <a className="drawer-file" href={file.fileUrl} key={file.id} target="_blank" rel="noreferrer">{file.fileName}</a>) : !upload.isPending && <p className="subtle">Chưa có tệp đính kèm.</p>}</div><div className="drawer-actions"><Button variant="secondary" onClick={() => setEditOpen(true)}><Edit3 size={15} /> Chỉnh sửa</Button><Button variant="secondary" onClick={() => duplicate.mutate(task.id, { onSuccess: () => toast.success('Đã nhân bản công việc'), onError: () => toast.error('Không thể nhân bản công việc') })}><Copy size={15} /> Nhân bản</Button><Button variant="danger" onClick={() => onDelete(task.id)}><Trash2 size={15} /> Xóa</Button></div></>}</div></Drawer>{task && <TaskForm open={editOpen} title="Chỉnh sửa công việc" submitLabel="Lưu thay đổi" onClose={() => setEditOpen(false)} initial={task} topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} loading={update.isPending} onSubmit={(input) => update.mutate({ id: task.id, input }, { onSuccess: () => { setEditOpen(false); toast.success('Đã cập nhật công việc') }, onError: () => toast.error('Không thể cập nhật công việc') })} />}</>
}

function TaskForm({ open, title, submitLabel, onClose, onSubmit, loading, initial, topics, plans }: { open: boolean; title: string; submitLabel: string; onClose: () => void; onSubmit: (input: Parameters<typeof import('../features/tasks/tasks.api').createTask>[0]) => void; loading: boolean; initial?: Task; topics: Array<{ id: string; name: string; code: string }>; plans: StudyPlan[] }) {
  return <Modal open={open} title={title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="task-form" loading={loading}>{submitLabel}</Button></>}><form id="task-form" className="modal-form" onSubmit={(event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>; onSubmit({ title: values.title.trim(), description: values.description || null, subjectId: values.subjectId || null, studyPlanId: values.studyPlanId || null, dueDate: values.dueDate || null, priority: values.priority as Priority, status: values.status as TaskStatus }) }}><Input name="title" label="Tên công việc" defaultValue={initial?.title} required /><Input name="description" label="Mô tả (tùy chọn)" defaultValue={initial?.description ?? ''} /><div className="form-grid"><Select name="subjectId" label="Chủ đề (tùy chọn)" customMenu defaultValue={initial?.subjectId ?? ''}><option value="">Không gắn chủ đề</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select><Select name="studyPlanId" label="Kế hoạch (tùy chọn)" customMenu defaultValue={initial?.studyPlanId ?? ''}><option value="">Không gắn kế hoạch</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</Select></div><div className="form-grid"><Input name="dueDate" label="Hạn hoàn thành" type="date" defaultValue={initial?.dueDate?.slice(0, 10) ?? ''} /><Select name="priority" label="Độ ưu tiên" customMenu defaultValue={initial?.priority ?? 'medium'}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><Select name="status" label="Trạng thái" customMenu defaultValue={initial?.status ?? 'todo'}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></form></Modal>
}
