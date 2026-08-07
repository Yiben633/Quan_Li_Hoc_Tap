import { CalendarDays, Clock3, Copy, Edit3, Gauge, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Button, Drawer, EmptyState, Skeleton } from '../../../components/ui'
import { formatTaskDate, formatTaskDeadline } from '../../../utils/taskDate'
import { useTopicsQuery } from '../../learning/learning.hooks'
import { useCreateSubtaskMutation, useDeleteSubtaskMutation, usePlansQuery, useSubtaskMutation, useTaskAttachmentMutation, useTaskDuplicateMutation, useTaskQuery, useTaskUpdateMutation } from '../tasks.hooks'
import { DIFFICULTY_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '../task.constants'
import { TaskForm } from './TaskForm'

export function TaskDrawer({ id, onClose, onDelete }: { id: string; onClose: () => void; onDelete: (id: string) => void }) {
  const query = useTaskQuery(id)
  const topics = useTopicsQuery()
  const plans = usePlansQuery({ limit: '100' })
  const subtaskMutation = useSubtaskMutation()
  const createSubtaskMutation = useCreateSubtaskMutation()
  const deleteSubtaskMutation = useDeleteSubtaskMutation()
  const duplicate = useTaskDuplicateMutation()
  const update = useTaskUpdateMutation()
  const upload = useTaskAttachmentMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const task = query.data

  const addSubtask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = subtaskTitle.trim()
    if (!task || !title) return
    createSubtaskMutation.mutate({ taskId: task.id, title }, { onSuccess: () => { setSubtaskTitle(''); toast.success('Đã thêm việc nhỏ') }, onError: () => toast.error('Không thể thêm việc nhỏ') })
  }

  return <><Drawer open={Boolean(id)} title={task?.title ?? 'Chi tiết công việc'} onClose={onClose}><div className="task-drawer-content">{query.isLoading ? <Skeleton height={420} /> : query.isError || !task ? <EmptyState title="Không thể tải công việc" description="Thử đóng rồi mở lại." /> : <>
    <div className="drawer-task-status"><span className={`status-label task-pill-${task.status}`}>{TASK_STATUS_LABELS[task.status]}</span><span className={`priority priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></div>
    <section className="drawer-metadata" aria-label="Thông tin công việc">
      {task.subject && <div><span>Môn học</span><Link to={`/topics/${task.subject.id}`} onClick={onClose}>{task.subject.code ? `${task.subject.code} · ${task.subject.name}` : task.subject.name}</Link></div>}
      {task.studyPlan && <div><span>Kế hoạch</span><Link to={`/study-plans/${task.studyPlan.id}`} onClick={onClose}>{task.studyPlan.title}</Link></div>}
      <div><span>Ngày bắt đầu</span><strong><CalendarDays size={14} /> {formatTaskDate(task.startDate)}</strong></div>
      <div><span>Deadline</span><strong><CalendarDays size={14} /> {formatTaskDeadline(task.dueDate)}</strong></div>
      {task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && <div><span>Thời gian dự kiến</span><strong><Clock3 size={14} /> {task.estimatedMinutes} phút</strong></div>}
      {task.difficulty && <div><span>Độ khó</span><strong><Gauge size={14} /> {DIFFICULTY_LABELS[task.difficulty as keyof typeof DIFFICULTY_LABELS]}</strong></div>}
    </section>
    {task.description && <section className="drawer-section"><h3>Mô tả</h3><p className="drawer-description">{task.description}</p></section>}
    <section className="drawer-section"><div className="drawer-section-heading"><div><h3>Checklist</h3><span className="drawer-section-count">{task.subTasks.filter((subtask) => subtask.isDone).length} / {task.subTasks.length}</span></div></div>{task.subTasks.length ? <div className="drawer-subtask-list">{task.subTasks.map((subtask) => <div className="drawer-subtask" key={subtask.id}><label><input type="checkbox" checked={subtask.isDone} onChange={(event) => subtaskMutation.mutate({ taskId: task.id, subtaskId: subtask.id, isDone: event.target.checked })} aria-label={`${subtask.isDone ? 'Bỏ hoàn thành' : 'Hoàn thành'} ${subtask.title}`} /><span>{subtask.title}</span></label><button type="button" className="drawer-subtask-delete" onClick={() => deleteSubtaskMutation.mutate({ taskId: task.id, subtaskId: subtask.id }, { onError: () => toast.error('Không thể xóa việc nhỏ') })} disabled={deleteSubtaskMutation.isPending} aria-label={`Xóa việc nhỏ ${subtask.title}`}><Trash2 size={15} /></button></div>)}</div> : <p className="subtle">Chưa có việc nhỏ.</p>}<form className="drawer-subtask-form" onSubmit={addSubtask}><input value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} placeholder="Thêm việc nhỏ..." aria-label="Tên việc nhỏ" /><Button type="submit" variant="secondary" loading={createSubtaskMutation.isPending} disabled={!subtaskTitle.trim()}><Plus size={15} /> Thêm việc nhỏ</Button></form></section>
    <section className="drawer-section"><div className="drawer-section-heading"><h3>Tệp đính kèm</h3><label className="drawer-upload"><Paperclip size={15} /> Thêm tệp<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; upload.mutate({ taskId: task.id, file }, { onSuccess: () => toast.success('Đã thêm tệp'), onError: () => toast.error('Không thể thêm tệp') }); event.currentTarget.value = '' }} /></label></div>{upload.isPending && <p className="subtle">Đang tải tệp lên...</p>}{task.attachments.length ? <div className="drawer-file-list">{task.attachments.map((file) => <a className="drawer-file" href={file.fileUrl} key={file.id} target="_blank" rel="noreferrer"><Paperclip size={15} /> {file.fileName}</a>)}</div> : !upload.isPending && <p className="subtle">Chưa có tệp đính kèm.</p>}</section>
    <div className="drawer-actions"><Button variant="secondary" onClick={() => setEditOpen(true)}><Edit3 size={15} /> Chỉnh sửa</Button><Button variant="secondary" onClick={() => duplicate.mutate(task.id, { onSuccess: () => toast.success('Đã nhân bản công việc'), onError: () => toast.error('Không thể nhân bản công việc') })}><Copy size={15} /> Nhân bản</Button><Button variant="danger" onClick={() => onDelete(task.id)}><Trash2 size={15} /> Xóa</Button></div>
  </>}</div></Drawer>{task && <TaskForm open={editOpen} title="Chỉnh sửa công việc" submitLabel="Lưu thay đổi" onClose={() => setEditOpen(false)} initial={task} topics={topics.data?.items ?? []} plans={plans.data?.items ?? []} loading={update.isPending} onSubmit={(input) => update.mutate({ id: task.id, input }, { onSuccess: () => { setEditOpen(false); toast.success('Đã cập nhật công việc') }, onError: () => toast.error('Không thể cập nhật công việc') })} />}</>
}
