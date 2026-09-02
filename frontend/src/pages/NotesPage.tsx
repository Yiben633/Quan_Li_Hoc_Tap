import { Bold, CornerDownLeft, FileText, Italic, List, Pin, Plus, Search, Tag, Trash2, Underline } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, Select, Skeleton } from '../components/ui'
import { NatureMascot } from '../components/nature/NatureMascot'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { Note, NoteInput } from '../features/notes/notes.api'
import { useNoteCreateMutation, useNoteDeleteMutation, useNotePinMutation, useNotesQuery, useNoteUpdateMutation } from '../features/notes/notes.hooks'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { useTasksQuery } from '../features/tasks/tasks.hooks'
import { sanitizeNoteHtml } from '../utils/sanitizeNoteHtml'

type NoteDraft = { title: string; contentRichText: string; subjectId: string; taskId: string; tags: string }
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function initialDraft(note?: Note): NoteDraft {
  return { title: note?.title ?? '', contentRichText: note?.contentRichText ?? '', subjectId: note?.subjectId ?? '', taskId: note?.taskId ?? '', tags: note?.tags.join(', ') ?? '' }
}

function toInput(draft: NoteDraft): NoteInput {
  return { title: draft.title.trim(), contentRichText: draft.contentRichText, subjectId: draft.subjectId || null, taskId: draft.taskId || null, tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
}

function notePreview(value: string) {
  const document = new DOMParser().parseFromString(sanitizeNoteHtml(value), 'text/html')
  return document.body.textContent?.trim() ?? ''
}

function NoteEditor({ note, open, onClose }: { note: Note | null; open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<NoteDraft>(() => initialDraft(note ?? undefined))
  const [savedNote, setSavedNote] = useState<Note | null>(note)
  const [changed, setChanged] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const editorRef = useRef<HTMLDivElement>(null)
  const create = useNoteCreateMutation()
  const update = useNoteUpdateMutation()
  const topics = useTopicsQuery()
  const tasks = useTasksQuery({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })

  useEffect(() => {
    if (!open) return
    setDraft(initialDraft(note ?? undefined))
    setSavedNote(note)
    setChanged(false)
    setSaveState('idle')
  }, [note, open])

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = draft.contentRichText
  }, [note, open])

  useEffect(() => {
    if (!open || !changed) return
    if (!draft.title.trim()) { setSaveState('idle'); return }
    const timer = window.setTimeout(() => {
      const input = toInput(draft)
      setSaveState('saving')
      const callbacks = {
        onSuccess: (saved: Note) => { setSavedNote(saved); setChanged(false); setSaveState('saved') },
        onError: (error: unknown) => { setSaveState('error'); toast.error(getApiErrorMessage(error, 'Không thể lưu ghi chú')) },
      }
      if (savedNote) update.mutate({ id: savedNote.id, input }, callbacks)
      else create.mutate(input, callbacks)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [changed, create, draft, open, savedNote, update])

  const set = <Key extends keyof NoteDraft>(key: Key, value: NoteDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setChanged(true)
    setSaveState('idle')
  }

  const applyFormat = (command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList') => {
    editorRef.current?.focus()
    document.execCommand(command)
    set('contentRichText', editorRef.current?.innerHTML ?? '')
  }
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim()) { toast.error('Hãy đặt tên cho ghi chú'); return }
    if (!changed) { onClose(); return }
    const input = toInput(draft)
    setChanged(false)
    setSaveState('saving')
    const callbacks = { onSuccess: (saved: Note) => { setSavedNote(saved); setChanged(false); setSaveState('saved'); toast.success('Đã lưu ghi chú'); onClose() }, onError: (error: unknown) => { setSaveState('error'); toast.error(getApiErrorMessage(error, 'Không thể lưu ghi chú')) } }
    if (savedNote) update.mutate({ id: savedNote.id, input }, callbacks)
    else create.mutate(input, callbacks)
  }
  const saveLabel = saveState === 'saving' ? 'Đang lưu...' : saveState === 'saved' ? 'Đã lưu' : saveState === 'error' ? 'Lỗi lưu' : changed ? 'Có thay đổi chưa lưu' : savedNote ? 'Đã lưu' : 'Bản nháp mới'

  return <Modal open={open} title={savedNote ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'} onClose={onClose} footer={<><span className={`note-save-state ${saveState}`}>{saveLabel}</span><Button variant="secondary" onClick={onClose}>Đóng</Button><Button type="submit" form="note-editor-form" loading={create.isPending || update.isPending}>Lưu ngay</Button></>}>
    <form id="note-editor-form" className="note-editor-form" onSubmit={submit}>
      <Input label="Tiêu đề" value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder="Ví dụ: Ý tưởng cho bài thuyết trình" autoFocus />
      <div className="note-rich-field"><span>Nội dung</span><div className="note-rich-toolbar" role="toolbar" aria-label="Định dạng ghi chú"><button type="button" onClick={() => applyFormat('bold')} aria-label="In đậm"><Bold size={15} /></button><button type="button" onClick={() => applyFormat('italic')} aria-label="In nghiêng"><Italic size={15} /></button><button type="button" onClick={() => applyFormat('underline')} aria-label="Gạch chân"><Underline size={15} /></button><button type="button" onClick={() => applyFormat('insertUnorderedList')} aria-label="Danh sách"><List size={15} /></button></div><div ref={editorRef} className="note-rich-editor" contentEditable role="textbox" aria-multiline="true" aria-label="Nội dung ghi chú" data-placeholder="Viết điều bạn muốn ghi nhớ..." suppressContentEditableWarning onInput={(event) => set('contentRichText', event.currentTarget.innerHTML)} onPaste={(event) => { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); set('contentRichText', editorRef.current?.innerHTML ?? '') }} /></div>
      <div className="note-editor-grid"><Select customMenu label="Môn học (tùy chọn)" value={draft.subjectId} onChange={(event) => set('subjectId', event.target.value)}><option value="">Không gắn môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select><Select customMenu label="Công việc (tùy chọn)" value={draft.taskId} onChange={(event) => set('taskId', event.target.value)}><option value="">Không gắn công việc</option>{tasks.data?.items.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select></div>
      <Input label="Thẻ" value={draft.tags} onChange={(event) => set('tags', event.target.value)} placeholder="Ví dụ: ý-tưởng, cần-xem-lại" hint="Ngăn cách các thẻ bằng dấu phẩy." />
    </form>
  </Modal>
}

function NoteCard({ note, onOpen, onPin, onDelete }: { note: Note; onOpen: () => void; onPin: () => void; onDelete: () => void }) {
  return <article className="note-card"><div className="note-card-head"><button type="button" className="note-card-open" onClick={onOpen}><h2>{note.title}</h2></button><Button variant="ghost" className={note.isPinned ? 'note-pin active' : 'note-pin'} onClick={onPin} aria-label={`${note.isPinned ? 'Bỏ ghim' : 'Ghim'} ghi chú ${note.title}`}><Pin size={16} /></Button></div><button type="button" className="note-card-preview" onClick={onOpen}><span dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.contentRichText) }} />{!notePreview(note.contentRichText) && <em>Chưa có nội dung.</em>}</button><footer><div>{note.tags.slice(0, 3).map((tag) => <span key={tag}><Tag size={10} /> {tag}</span>)}</div><Button variant="ghost" className="note-delete" onClick={onDelete} aria-label={`Xóa ghi chú ${note.title}`}><Trash2 size={16} /></Button></footer></article>
}

export function NotesPage() {
  const [params] = useSearchParams()
  const requestedSearch = params.get('search') ?? ''
  const [search, setSearch] = useState(requestedSearch)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subjectId, setSubjectId] = useState(params.get('subjectId') ?? '')
  const [taskId, setTaskId] = useState(params.get('taskId') ?? '')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Note | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const topics = useTopicsQuery()
  const tasks = useTasksQuery({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
  const filters = useMemo(() => ({ subjectId: subjectId || undefined, taskId: taskId || undefined, search: debouncedSearch || undefined, page, limit: 18 }), [subjectId, taskId, debouncedSearch, page])
  const query = useNotesQuery(filters)
  const pin = useNotePinMutation()
  const remove = useNoteDeleteMutation()
  useEffect(() => { setSearch(requestedSearch); setPage(1) }, [requestedSearch])
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 300); return () => window.clearTimeout(timer) }, [search])
  const setFilter = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(1) }
  const openNew = () => { setEditing(null); setEditorOpen(true) }
  const openEdit = (note: Note) => { setEditing(note); setEditorOpen(true) }

  return <div className="notes-page">
    <div className="page-heading notes-heading"><div><p className="eyebrow">KHÔNG GIAN Ý TƯỞNG</p><h1>Ghi chú</h1><p className="subtle">Ghi lại điều quan trọng, gắn vào môn học hoặc công việc khi cần.</p></div><div className="notes-heading-actions"><Button onClick={openNew}><Plus size={17} /> Ghi chú mới</Button><NatureMascot animal="hedgehog" motion="float" size={104} className="notes-heading-hedgehog" /></div></div>
    <section className="notes-toolbar" aria-label="Tìm và lọc ghi chú"><Input className="notes-search" aria-label="Tìm ghi chú" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ghi chú..." /><Select customMenu aria-label="Lọc môn học ghi chú" value={subjectId} onChange={(event) => setFilter(setSubjectId, event.target.value)}><option value="">Mọi môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select><Select customMenu aria-label="Lọc công việc ghi chú" value={taskId} onChange={(event) => setFilter(setTaskId, event.target.value)}><option value="">Mọi công việc</option>{tasks.data?.items.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select></section>
    {query.isLoading && <div className="note-grid">{Array.from({ length: 6 }, (_, index) => <article className="note-card" key={index}><Skeleton height={18} width="62%" /><Skeleton height={66} /><Skeleton height={14} width="35%" /></article>)}</div>}
    {query.isError && <EmptyState icon={<FileText size={24} />} title="Chưa thể tải ghi chú" description="Kiểm tra kết nối rồi thử lại nhé." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />}
    {!query.isLoading && !query.isError && query.data?.items.length === 0 && <EmptyState icon={<FileText size={24} />} title="Chưa có ghi chú phù hợp" description="Bạn có thể bắt đầu bằng vài dòng ngắn cho điều đang nghĩ tới." action={<Button onClick={openNew}><Plus size={16} /> Ghi chú mới</Button>} />}
    {!query.isLoading && !query.isError && Boolean(query.data?.items.length) && <><div className="note-grid">{query.data?.items.map((note) => <NoteCard key={note.id} note={note} onOpen={() => openEdit(note)} onPin={() => pin.mutate({ id: note.id, isPinned: !note.isPinned }, { onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật ghim')) })} onDelete={() => setDeleting(note)} />)}</div>{query.data && query.data.pagination.totalPages > 1 && <Pagination page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} onChange={setPage} />}</>}
    <NoteEditor note={editing} open={editorOpen} onClose={() => setEditorOpen(false)} />
    <ConfirmDialog open={Boolean(deleting)} title="Xóa ghi chú" description={`Xóa “${deleting?.title ?? ''}”? Ghi chú sẽ không còn xuất hiện trong thư viện.`} onCancel={() => setDeleting(null)} onConfirm={() => { if (!deleting) return; remove.mutate({ id: deleting.id, subjectId: deleting.subjectId, taskId: deleting.taskId }, { onSuccess: () => { toast.success('Đã xóa ghi chú'); setDeleting(null) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa ghi chú')) }) }} loading={remove.isPending} />
  </div>
}
