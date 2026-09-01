import { Check, Copy, Edit3, MoreHorizontal, Paperclip, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dropdown } from '../../../components/ui'
import { formatTaskDeadline, isTaskDeadlineOverdue } from '../../../utils/taskDate'
import type { Task, TaskStatus } from '../tasks.api'
import { DIFFICULTY_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '../task.constants'

export type TaskRowMode = 'default' | 'compact'

type TaskRowProps = {
  task: Task
  subject?: NonNullable<Task['subject']> | null
  studyPlan?: NonNullable<Task['studyPlan']> | null
  mode?: TaskRowMode
  selectionMode?: boolean
  selected?: boolean
  onSelect?: () => void
  onOpen?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
  onStatusChange: (status: TaskStatus) => void
  onDelete?: () => void
}

export function TaskRow({ task, subject, studyPlan, mode = 'default', selectionMode = false, selected = false, onSelect, onOpen, onEdit, onDuplicate, menuOpen, onMenuOpenChange, onStatusChange, onDelete }: TaskRowProps) {
  if (mode === 'compact') return <label className="topic-task-row"><input type="checkbox" checked={task.status === 'done'} onChange={(event) => onStatusChange(event.target.checked ? 'done' : 'todo')} aria-label={`Đánh dấu hoàn thành ${task.title}`} /><span><strong>{task.title}</strong><small>{task.dueDate ? `Hạn ${new Date(task.dueDate).toLocaleDateString('vi-VN')}` : 'Chưa đặt hạn'}</small></span></label>

  const isDone = task.status === 'done'
  const deadline = formatTaskDeadline(task.dueDate)
  const deadlineIsOverdue = !isDone && isTaskDeadlineOverdue(task.dueDate)
  const metadata = [
    task.dueDate && deadline,
    task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && `${task.estimatedMinutes} phút`,
    task.difficulty ? DIFFICULTY_LABELS[task.difficulty as keyof typeof DIFFICULTY_LABELS] : undefined,
    PRIORITY_LABELS[task.priority],
  ].filter(Boolean)
  const progress = task.subTaskProgress
  const progressPercent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return <article className={`task-list-row task-status-${task.status} task-priority-${task.priority}`}>
    {selectionMode
      ? <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Chọn ${task.title} để thao tác hàng loạt`} />
      : <button type="button" className={`task-complete-toggle${isDone ? ' is-done' : ''}`} onClick={() => { if (!isDone) onStatusChange('done') }} disabled={isDone} aria-label={isDone ? `${task.title} đã hoàn thành` : `Đánh dấu hoàn thành ${task.title}`} title={isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}><Check size={13} /></button>}
    <div className="task-row-content">
      <div className="task-row-primary"><button type="button" className="task-row-main" onClick={onOpen}><span className="task-row-title">{task.title}</span></button></div>
      {(subject || studyPlan) && <p className="task-row-context">{subject && <Link to={`/topics/${subject.id}`}><i className="task-subject-dot" style={{ background: subject.colorHex }} aria-hidden="true" />{subject.code ? `${subject.code} · ${subject.name}` : subject.name}</Link>}{subject && studyPlan && <span aria-hidden="true"> · </span>}{studyPlan && <Link to={`/study-plans/${studyPlan.id}`}>{studyPlan.title}</Link>}</p>}
      {metadata.length > 0 && <p className="task-row-meta">{task.dueDate && <span className={deadlineIsOverdue ? 'task-deadline-overdue' : undefined}>{deadline}</span>}{task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && <span> · {task.estimatedMinutes} phút</span>}{task.difficulty && <span> · {DIFFICULTY_LABELS[task.difficulty as keyof typeof DIFFICULTY_LABELS]}</span>}<span> · {PRIORITY_LABELS[task.priority]}</span></p>}
      <span className={`status-label task-row-status task-pill-${task.status}`} aria-label={`Trạng thái: ${TASK_STATUS_LABELS[task.status]}`}>{TASK_STATUS_LABELS[task.status]}</span>
      {progress && progress.total > 0 && <div className="task-row-progress" aria-label={`Checklist ${progress.done}/${progress.total}, ${progressPercent}% hoàn thành`}><span>Checklist {progress.done}/{progress.total}</span><div><i style={{ width: `${progressPercent}%` }} /></div><strong>{progressPercent}%</strong></div>}
      {task.attachmentCount && task.attachmentCount > 0 && <button type="button" className="task-attachment-link" onClick={onOpen} aria-label={`Xem ${task.attachmentCount} tệp đính kèm của ${task.title}`}><Paperclip size={13} /> {task.attachmentCount} tệp đính kèm</button>}
    </div>
    <Dropdown ariaLabel={`Thao tác với ${task.title}`} label={<><MoreHorizontal size={18} /><span className="sr-only">Thao tác với {task.title}</span></>} open={menuOpen} onOpenChange={onMenuOpenChange} showChevron={false}>
      <button type="button" className="menu-item" onClick={onOpen}>Mở chi tiết</button>
      {onEdit && <button type="button" className="menu-item" onClick={onEdit}><Edit3 size={15} /> Chỉnh sửa</button>}
      {onDuplicate && <button type="button" className="menu-item" onClick={onDuplicate}><Copy size={15} /> Nhân bản</button>}
      {onDelete && <button type="button" className="menu-item danger-text" onClick={onDelete}><Trash2 size={15} /> Xóa</button>}
    </Dropdown>
  </article>
}
