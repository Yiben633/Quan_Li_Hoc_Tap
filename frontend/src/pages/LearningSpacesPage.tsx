import { Archive, Copy, Edit3, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useCreateLearningSpaceMutation, useDeleteLearningSpaceMutation, useDuplicateLearningSpaceMutation, useLearningSpacesQuery, useUpdateLearningSpaceMutation } from '../features/learning/learning.hooks'
import type { LearningSpace } from '../features/learning/learning.api'

const initialForm = { name: '', academicYear: String(new Date().getFullYear()), startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31`, status: 'planning' as LearningSpace['status'], note: '' }

export function LearningSpacesPage() {
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<LearningSpace | null>(null)
  const [remove, setRemove] = useState<LearningSpace | null>(null)
  const query = useLearningSpacesQuery(status || undefined)
  const create = useCreateLearningSpaceMutation()
  const update = useUpdateLearningSpaceMutation()
  const removeMutation = useDeleteLearningSpaceMutation()
  const duplicate = useDuplicateLearningSpaceMutation()
  const spaces = query.data?.items ?? []

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    const input = { name: values.name, academicYear: values.academicYear, startDate: values.startDate, endDate: values.endDate, status: values.status as LearningSpace['status'], note: values.note || null }
    const onSuccess = () => { setModal(null); setEditing(null); toast.success(editing ? 'Đã cập nhật không gian học' : 'Đã tạo không gian học') }
    const onError = (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể lưu không gian học'))
    if (editing) update.mutate({ id: editing.id, input }, { onSuccess, onError })
    else create.mutate(input, { onSuccess, onError })
  }
  const confirmDelete = () => { if (!remove) return; removeMutation.mutate(remove.id, { onSuccess: () => { setRemove(null); toast.success('Đã lưu trữ không gian học') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể lưu trữ không gian học')) }) }
  const openEdit = (space: LearningSpace) => { setEditing(space); setModal('edit') }

  return <div className="learning-page"><div className="page-heading"><div><p className="eyebrow">KHÔNG GIAN HỌC TẬP</p><h1>Không gian học</h1><p className="subtle">Tổ chức việc học theo cách phù hợp với bạn.</p></div><div className="page-heading-actions"><Link className="button secondary" to="/topics">Xem chủ đề</Link><Button onClick={() => { setEditing(null); setModal('create') }}><Plus size={16} /> Tạo không gian</Button></div></div><div className="filter-bar"><Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="planning">Đang chuẩn bị</option><option value="active">Đang hoạt động</option><option value="closed">Đã đóng</option><option value="archived">Đã lưu trữ</option></Select></div>{query.isLoading ? <div className="learning-grid">{[1, 2, 3].map((item) => <Skeleton key={item} height={190} className="skeleton-card" />)}</div> : query.isError ? <EmptyState title="Không thể tải không gian học" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : spaces.length === 0 ? <EmptyState icon={<Archive size={24} />} title="Chưa có không gian học" description="Bạn có thể bắt đầu bằng một mục tiêu cá nhân, một kỹ năng hoặc một lộ trình học." action={<Button onClick={() => { setEditing(null); setModal('create') }}><Plus size={16} /> Tạo không gian đầu tiên</Button>} /> : <div className="learning-grid">{spaces.map((space) => <article className="learning-card" key={space.id}><div className="learning-card-top"><span className={`status-dot status-${space.status}`} /><span className="status-label">{statusLabel(space.status)}</span><button className="icon-button" aria-label={`Tùy chọn ${space.name}`} onClick={() => openEdit(space)}><Edit3 size={16} /></button></div><h2>{space.name}</h2><p className="subtle">{space.academicYear} · {formatShortDate(space.startDate)} - {formatShortDate(space.endDate)}</p><div className="learning-card-actions"><Link className="text-link" to={`/topics?semesterId=${space.id}`}>Xem chủ đề</Link><button className="icon-button" aria-label="Sao chép không gian học" onClick={() => duplicate.mutate(space.id, { onSuccess: () => toast.success('Đã sao chép không gian học'), onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể sao chép')) })}><Copy size={15} /></button><button className="icon-button danger-icon" aria-label="Lưu trữ không gian học" onClick={() => setRemove(space)}><Trash2 size={15} /></button></div></article>)}</div>}<Modal open={Boolean(modal)} title={editing ? 'Sửa không gian học' : 'Tạo không gian học'} onClose={() => { setModal(null); setEditing(null) }} footer={<><Button variant="secondary" type="button" onClick={() => { setModal(null); setEditing(null) }}>Hủy</Button><Button type="submit" form="learning-space-form" loading={create.isPending || update.isPending}>Lưu</Button></>}><form id="learning-space-form" className="modal-form" onSubmit={save}><Input name="name" label="Tên không gian" defaultValue={editing?.name ?? ''} placeholder="Ví dụ: Học tiếng Anh, Lộ trình frontend" required /><Input name="academicYear" label="Năm hoặc giai đoạn" defaultValue={editing?.academicYear ?? initialForm.academicYear} required /><div className="form-grid"><Input name="startDate" label="Ngày bắt đầu" type="date" defaultValue={editing?.startDate.slice(0, 10) ?? initialForm.startDate} required /><Input name="endDate" label="Ngày kết thúc" type="date" defaultValue={editing?.endDate.slice(0, 10) ?? initialForm.endDate} required /></div><Select name="status" label="Trạng thái" defaultValue={editing?.status ?? initialForm.status}><option value="planning">Đang chuẩn bị</option><option value="active">Đang hoạt động</option><option value="closed">Đã đóng</option></Select></form></Modal><ConfirmDialog open={Boolean(remove)} title="Lưu trữ không gian học?" description={`Không gian “${remove?.name ?? ''}” sẽ được ẩn khỏi danh sách. Dữ liệu liên quan vẫn được giữ lại.`} onCancel={() => setRemove(null)} onConfirm={confirmDelete} loading={removeMutation.isPending} /></div>
}
function statusLabel(status: LearningSpace['status']) { return ({ planning: 'Đang chuẩn bị', active: 'Đang hoạt động', closed: 'Đã đóng', archived: 'Đã lưu trữ' })[status] }
function formatShortDate(value: string) { return new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }) }
