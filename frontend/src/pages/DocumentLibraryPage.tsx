import { Eye, FileCode2, FileImage, FileSpreadsheet, FileText, FileType2, Film, FolderOpen, Grid2X2, Link2, List, Pencil, Plus, Search, Tag, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { documentAssetUrl, documentDownloadUrl, type DocumentFileType, type DocumentInput, type DocumentItem } from '../features/documents/documents.api'
import { useDocumentDeleteMutation, useDocumentUpdateMutation, useDocumentUploadMutation, useDocumentsQuery } from '../features/documents/documents.hooks'
import { useLearningSpacesQuery, useTopicsQuery } from '../features/learning/learning.hooks'
import { useTasksQuery } from '../features/tasks/tasks.hooks'

const fileTypeLabels: Record<DocumentFileType, string> = { pdf: 'PDF', word: 'Word', excel: 'Excel', ppt: 'Trình chiếu', image: 'Hình ảnh', link: 'Liên kết', video: 'Video', code: 'Mã nguồn', other: 'Khác' }
const acceptedMimeTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'text/plain', 'text/markdown', 'application/json'])
const maxUploadBytes = Number(import.meta.env.VITE_DOCUMENT_MAX_UPLOAD_BYTES || 20 * 1024 * 1024)

type DocumentDraft = { title: string; subjectId: string; taskId: string; tags: string }
type ViewMode = 'grid' | 'list'

function initialDraft(item?: DocumentItem): DocumentDraft {
  return { title: item?.title ?? '', subjectId: item?.subjectId ?? '', taskId: item?.taskId ?? '', tags: item?.tags.join(', ') ?? '' }
}

function toInput(draft: DocumentDraft): DocumentInput {
  return { title: draft.title.trim() || undefined, subjectId: draft.subjectId || null, taskId: draft.taskId || null, tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
}

function fileSize(value?: number | null) {
  if (!value) return ''
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
}

function documentIcon(type: DocumentFileType) {
  const Icon = type === 'image' ? FileImage : type === 'excel' ? FileSpreadsheet : type === 'video' ? Film : type === 'code' ? FileCode2 : type === 'link' ? Link2 : type === 'word' || type === 'ppt' ? FileType2 : FileText
  return <Icon size={20} />
}

function DocumentFields({ draft, onChange }: { draft: DocumentDraft; onChange: (draft: DocumentDraft) => void }) {
  const topics = useTopicsQuery()
  const tasks = useTasksQuery({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
  const set = (key: keyof DocumentDraft, value: string) => onChange({ ...draft, [key]: value })
  const topicOptions = topics.data?.items ?? []
  const taskOptions = tasks.data?.items ?? []
  return <div className="document-fields">
    <Input label="Tên hiển thị" value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder="Dùng tên tệp nếu để trống" />
    <Select customMenu label="Môn học (tùy chọn)" value={draft.subjectId} onChange={(event) => set('subjectId', event.target.value)}>
      <option value="">Không gắn môn học</option>
      {topicOptions.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}
    </Select>
    <Select customMenu label="Công việc (tùy chọn)" value={draft.taskId} onChange={(event) => set('taskId', event.target.value)}>
      <option value="">Không gắn công việc</option>
      {taskOptions.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
    </Select>
    <Input label="Thẻ" value={draft.tags} onChange={(event) => set('tags', event.target.value)} placeholder="Ví dụ: tham-khảo, quan-trọng" hint="Ngăn cách các thẻ bằng dấu phẩy." />
  </div>
}

function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<DocumentDraft>(() => initialDraft())
  const [progress, setProgress] = useState<number | null>(null)
  const controller = useRef<AbortController | null>(null)
  const upload = useDocumentUploadMutation()

  useEffect(() => {
    if (!open) { setFile(null); setDraft(initialDraft()); setProgress(null); controller.current?.abort(); controller.current = null }
  }, [open])

  const chooseFile = (selected: File | null) => {
    if (!selected) return
    if (selected.size > maxUploadBytes) { toast.error(`Tệp vượt quá giới hạn ${(maxUploadBytes / 1024 / 1024).toLocaleString('vi-VN')} MB`); return }
    if (selected.type && !acceptedMimeTypes.has(selected.type)) { toast.error('Loại tệp này chưa được hỗ trợ'); return }
    setFile(selected)
    setDraft((current) => ({ ...current, title: current.title || selected.name }))
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) { toast.error('Hãy chọn một tệp để tải lên'); return }
    controller.current = new AbortController()
    setProgress(0)
    upload.mutate({ input: { file, ...toInput(draft) }, options: { signal: controller.current.signal, onProgress: (loaded, total) => setProgress(Math.min(100, Math.round((loaded / Math.max(total, 1)) * 100))) } }, {
      onSuccess: () => { toast.success('Đã tải tài liệu lên'); onClose() },
      onError: (error) => { if (getApiErrorMessage(error).toLowerCase().includes('canceled')) toast('Đã hủy tải tệp'); else toast.error(getApiErrorMessage(error, 'Không thể tải tài liệu lên')); setProgress(null) },
    })
  }

  return <Modal open={open} title="Tải tài liệu lên" onClose={() => !upload.isPending && onClose()} footer={<><Button variant="secondary" type="button" onClick={() => upload.isPending ? controller.current?.abort() : onClose()}>{upload.isPending ? 'Hủy tải' : 'Hủy'}</Button><Button type="submit" form="document-upload-form" loading={upload.isPending} disabled={!file}>Tải lên</Button></>}>
    <form id="document-upload-form" className="document-form" onSubmit={submit}>
      <label className="document-dropzone"><Upload size={22} /><strong>{file ? file.name : 'Chọn tệp để tải lên'}</strong><span>{file ? fileSize(file.size) : 'PDF, Office, hình ảnh, video hoặc tệp văn bản. Tối đa 20 MB.'}</span><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.txt,.md,.json" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} /></label>
      {progress !== null && <div className="document-upload-progress"><div><span>Đang tải lên</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i></div>}
      <DocumentFields draft={draft} onChange={setDraft} />
    </form>
  </Modal>
}

function DocumentEditorModal({ item, open, onClose }: { item: DocumentItem | null; open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<DocumentDraft>(() => initialDraft(item ?? undefined))
  const update = useDocumentUpdateMutation()
  useEffect(() => { if (open) setDraft(initialDraft(item ?? undefined)) }, [item, open])
  if (!item) return null
  return <Modal open={open} title="Chỉnh sửa tài liệu" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="document-edit-form" loading={update.isPending}>Lưu thay đổi</Button></>}>
    <form id="document-edit-form" className="document-form" onSubmit={(event) => { event.preventDefault(); update.mutate({ id: item.id, input: toInput(draft) }, { onSuccess: () => { toast.success('Đã cập nhật tài liệu'); onClose() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật tài liệu')) }) }}><DocumentFields draft={draft} onChange={setDraft} /></form>
  </Modal>
}

function DocumentPreview({ item, onClose }: { item: DocumentItem | null; onClose: () => void }) {
  if (!item) return null
  const assetUrl = documentAssetUrl(item.fileUrl)
  const canPreview = item.fileType === 'pdf' || item.fileType === 'image'
  return <Modal open={Boolean(item)} title={item.title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Đóng</Button><a className="button primary" href={documentDownloadUrl(item.id)}>Tải xuống</a></>}>
    {canPreview ? <div className="document-preview">{item.fileType === 'image' ? <img src={assetUrl} alt={item.title} /> : <iframe title={`Xem trước ${item.title}`} src={assetUrl} />}</div> : <EmptyState icon={<FolderOpen size={24} />} title="Chưa hỗ trợ xem trước" description="Bạn vẫn có thể tải tệp về để xem bằng ứng dụng phù hợp." />}
  </Modal>
}

function DocumentCard({ item, mode, onPreview, onEdit, onDelete }: { item: DocumentItem; mode: ViewMode; onPreview: () => void; onEdit: () => void; onDelete: () => void }) {
  return <article className={`document-card ${mode === 'list' ? 'document-card-list' : ''}`}>
    <span className={`document-type-icon document-type-${item.fileType}`}>{documentIcon(item.fileType)}</span>
    <div className="document-card-copy"><h2 title={item.title}>{item.title}</h2><p>{fileTypeLabels[item.fileType]}{item.sizeBytes ? ` · ${fileSize(item.sizeBytes)}` : ''}</p>{item.tags.length > 0 && <div className="document-tags">{item.tags.map((tag) => <span key={tag}><Tag size={11} /> {tag}</span>)}</div>}</div>
    <div className="document-card-actions"><Button variant="ghost" onClick={onPreview} aria-label={`Xem ${item.title}`}><Eye size={16} /></Button><a className="button ghost" href={documentDownloadUrl(item.id)} aria-label={`Tải ${item.title}`}><FolderOpen size={16} /></a><Button variant="ghost" onClick={onEdit} aria-label={`Chỉnh sửa ${item.title}`}><Pencil size={16} /></Button><Button variant="ghost" className="document-delete" onClick={onDelete} aria-label={`Xóa ${item.title}`}><Trash2 size={16} /></Button></div>
  </article>
}

export function DocumentLibraryPage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [semesterId, setSemesterId] = useState(params.get('semesterId') ?? '')
  const [subjectId, setSubjectId] = useState(params.get('subjectId') ?? '')
  const [taskId, setTaskId] = useState(params.get('taskId') ?? '')
  const [tag, setTag] = useState(params.get('tag') ?? '')
  const [fileType, setFileType] = useState<DocumentFileType | ''>('')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<ViewMode>('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<DocumentItem | null>(null)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [deleting, setDeleting] = useState<DocumentItem | null>(null)
  const spaces = useLearningSpacesQuery()
  const topics = useTopicsQuery()
  const tasks = useTasksQuery({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
  const filters = useMemo(() => ({ semesterId: semesterId || undefined, subjectId: subjectId || undefined, taskId: taskId || undefined, tag: tag || undefined, fileType: fileType || undefined, search: debouncedSearch || undefined, page, limit: 18 }), [semesterId, subjectId, taskId, tag, fileType, debouncedSearch, page])
  const query = useDocumentsQuery(filters)
  const remove = useDocumentDeleteMutation()
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 300); return () => window.clearTimeout(timer) }, [search])
  const resetPage = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(1) }

  return <div className="documents-page">
    <div className="page-heading documents-heading"><div><p className="eyebrow">THƯ VIỆN CỦA BẠN</p><h1>Tài liệu</h1><p className="subtle">Lưu và tìm lại những tệp hữu ích cho việc học hoặc dự án cá nhân.</p></div><Button onClick={() => setUploadOpen(true)}><Upload size={17} /> Tải tài liệu lên</Button></div>
    <section className="documents-toolbar" aria-label="Tìm và lọc tài liệu">
      <Input className="documents-search" aria-label="Tìm tài liệu" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tài liệu..." />
      <Select customMenu aria-label="Lọc không gian học" value={semesterId} onChange={(event) => resetPage(setSemesterId, event.target.value)}><option value="">Mọi không gian</option>{spaces.data?.items.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</Select>
      <Select customMenu aria-label="Lọc môn học" value={subjectId} onChange={(event) => resetPage(setSubjectId, event.target.value)}><option value="">Mọi môn học</option>{topics.data?.items.filter((topic) => !semesterId || topic.semesterId === semesterId).map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select>
      <Select customMenu aria-label="Lọc công việc" value={taskId} onChange={(event) => resetPage(setTaskId, event.target.value)}><option value="">Mọi công việc</option>{tasks.data?.items.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select>
      <Select customMenu aria-label="Lọc loại tệp" value={fileType} onChange={(event) => resetPage(setFileType, event.target.value as DocumentFileType | '')}><option value="">Mọi loại tệp</option>{Object.entries(fileTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Input className="documents-tag-filter" aria-label="Lọc theo thẻ" value={tag} onChange={(event) => resetPage(setTag, event.target.value.trim())} placeholder="Thẻ chính xác" />
      <div className="documents-view-toggle" role="group" aria-label="Kiểu hiển thị"><Button variant="ghost" className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')} aria-label="Dạng lưới"><Grid2X2 size={17} /></Button><Button variant="ghost" className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')} aria-label="Dạng danh sách"><List size={17} /></Button></div>
    </section>
    {query.isLoading && <div className={`document-results ${mode}`}>{Array.from({ length: 6 }, (_, index) => <article className="document-card" key={index}><Skeleton width={42} height={42} /><div><Skeleton width="70%" height={18} /><Skeleton width="45%" height={13} /></div></article>)}</div>}
    {query.isError && <EmptyState icon={<FolderOpen size={24} />} title="Chưa thể tải tài liệu" description="Kiểm tra kết nối rồi thử lại nhé." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />}
    {!query.isLoading && !query.isError && query.data?.items.length === 0 && <EmptyState icon={<FolderOpen size={24} />} title="Chưa có tài liệu phù hợp" description="Bạn có thể tải một tệp lên hoặc thay đổi bộ lọc." action={<Button onClick={() => setUploadOpen(true)}><Plus size={16} /> Tải tài liệu lên</Button>} />}
    {!query.isLoading && !query.isError && Boolean(query.data?.items.length) && <><div className={`document-results ${mode}`}>{query.data?.items.map((item) => <DocumentCard key={item.id} item={item} mode={mode} onPreview={() => setPreview(item)} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />)}</div>{query.data && query.data.pagination.totalPages > 1 && <Pagination page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} onChange={setPage} />}</>}
    <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    <DocumentEditorModal item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} />
    <DocumentPreview item={preview} onClose={() => setPreview(null)} />
    <ConfirmDialog open={Boolean(deleting)} title="Xóa tài liệu" description={`Xóa “${deleting?.title ?? ''}”? Tệp này cũng sẽ bị xóa khỏi nơi lưu trữ.`} onCancel={() => setDeleting(null)} onConfirm={() => { if (!deleting) return; remove.mutate({ id: deleting.id, subjectId: deleting.subjectId, taskId: deleting.taskId }, { onSuccess: () => { toast.success('Đã xóa tài liệu'); setDeleting(null) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa tài liệu')) }) }} loading={remove.isPending} />
  </div>
}
