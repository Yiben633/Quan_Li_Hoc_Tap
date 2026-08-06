import { BookOpen, Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useCreateTopicMutation, useDeleteTopicMutation, useLearningSpacesQuery, useTopicsQuery, useUpdateTopicMutation } from '../features/learning/learning.hooks'
import type { Topic } from '../features/learning/learning.api'

const statusOptions = [
  { value: 'in_progress', label: 'Đang học' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'dropped', label: 'Tạm dừng' },
] as const

export function TopicsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [remove, setRemove] = useState<Topic | null>(null)
  const semesterId = params.get('semesterId') ?? ''
  const status = params.get('status') ?? ''
  const spaces = useLearningSpacesQuery()
  const query = useTopicsQuery({ semesterId: semesterId || undefined, search: search || undefined, status: status || undefined })
  const create = useCreateTopicMutation()
  const update = useUpdateTopicMutation()
  const removeMutation = useDeleteTopicMutation()
  const topics = query.data?.items ?? []

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    const input = {
      semesterId: values.semesterId,
      code: values.code,
      name: values.name,
      credits: Number(values.credits),
      colorHex: values.colorHex,
      targetGrade: values.targetGrade ? Number(values.targetGrade) : null,
      status: (values.status || 'in_progress') as Topic['status'],
      note: values.note || null,
    }
    const onSuccess = () => { setModal(false); setEditing(null); toast.success(editing ? 'Đã cập nhật chủ đề' : 'Đã tạo chủ đề') }
    const onError = (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể lưu chủ đề'))
    if (editing) {
      const { semesterId: _semesterId, ...updateInput } = input
      update.mutate({ id: editing.id, input: updateInput }, { onSuccess, onError })
    } else create.mutate(input, { onSuccess, onError })
  }

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }

  return <div className="learning-page">
    <div className="page-heading"><div><p className="eyebrow">CHỦ ĐỀ HỌC TẬP</p><h1>Chủ đề</h1><p className="subtle">Theo dõi từng chủ đề, kỹ năng hoặc lĩnh vực bạn đang học.</p></div><Button disabled={!spaces.data?.items.length} onClick={() => { setEditing(null); setModal(true) }}><Plus size={16} /> Tạo chủ đề</Button></div>
    <div className="filter-bar topic-filters"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm chủ đề..." aria-label="Tìm chủ đề" /></label><Select value={semesterId} onChange={(event) => updateFilter('semesterId', event.target.value)} aria-label="Lọc không gian học"><option value="">Tất cả không gian</option>{spaces.data?.items.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</Select><Select value={status} onChange={(event) => updateFilter('status', event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>
    {query.isLoading ? <div className="topic-grid">{[1, 2, 3, 4].map((item) => <Skeleton key={item} height={210} className="skeleton-card" />)}</div> : query.isError ? <EmptyState title="Không thể tải chủ đề" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : topics.length === 0 ? <EmptyState icon={<BookOpen size={24} />} title="Chưa có chủ đề" description={spaces.data?.items.length ? 'Tạo một chủ đề để bắt đầu theo dõi tiến độ.' : 'Hãy tạo không gian học trước, hoặc dùng task và mục tiêu độc lập.'} action={spaces.data?.items.length ? <Button onClick={() => setModal(true)}><Plus size={16} /> Tạo chủ đề</Button> : <Link className="button secondary" to="/subjects">Tạo không gian học</Link>} /> : <div className="topic-grid">{topics.map((topic) => <article className="topic-card" key={topic.id} style={{ borderTopColor: topic.colorHex }}><div className="topic-card-head"><span className={`status-label topic-${topic.status}`}>{statusOptions.find((option) => option.value === topic.status)?.label ?? 'Tạm dừng'}</span><div><button className="icon-button" aria-label={`Sửa ${topic.name}`} onClick={() => { setEditing(topic); setModal(true) }}><Edit3 size={15} /></button><button className="icon-button danger-icon" aria-label={`Xóa ${topic.name}`} onClick={() => setRemove(topic)}><Trash2 size={15} /></button></div></div><h2>{topic.name}</h2><p className="subtle">{topic.code} · {topic.credits} tín chỉ</p><div className="topic-card-foot"><span className="topic-color" style={{ background: topic.colorHex }} /><Link className="text-link" to={`/topics/${topic.id}`}>Mở chi tiết</Link></div></article>)}</div>}
    <Modal open={modal} title={editing ? 'Sửa chủ đề' : 'Tạo chủ đề'} onClose={() => { setModal(false); setEditing(null) }} footer={<><Button variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null) }}>Hủy</Button><Button type="submit" form="topic-form" loading={create.isPending || update.isPending}>Lưu</Button></>}><form id="topic-form" className="modal-form" onSubmit={save}><Select name="semesterId" label="Không gian học" defaultValue={editing?.semesterId ?? semesterId} required disabled={Boolean(editing)}><option value="">Chọn không gian học</option>{spaces.data?.items.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</Select><div className="form-grid"><Input name="code" label="Mã hoặc ký hiệu" defaultValue={editing?.code ?? ''} placeholder="Ví dụ: EN, JS, DESIGN" required /><Input name="name" label="Tên chủ đề" defaultValue={editing?.name ?? ''} placeholder="Ví dụ: Tiếng Anh giao tiếp" required /></div><div className="form-grid"><Input name="credits" label="Đơn vị theo dõi" type="number" min="0" defaultValue={editing?.credits ?? 0} /><Input name="targetGrade" label="Mục tiêu điểm (tùy chọn)" type="number" min="0" max="10" step="0.1" defaultValue={editing?.targetGrade ?? ''} /></div><Select name="status" label="Trạng thái" defaultValue={editing?.status ?? 'in_progress'}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select><label className="field"><span>Màu chủ đề</span><input name="colorHex" type="color" defaultValue={editing?.colorHex ?? '#3867e8'} /></label></form></Modal>
    <ConfirmDialog open={Boolean(remove)} title="Xóa chủ đề?" description={`Chủ đề “${remove?.name ?? ''}” sẽ được ẩn khỏi danh sách.`} onCancel={() => setRemove(null)} onConfirm={() => { if (!remove) return; removeMutation.mutate(remove.id, { onSuccess: () => { setRemove(null); toast.success('Đã xóa chủ đề') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa chủ đề')) }) }} loading={removeMutation.isPending} />
  </div>
}
