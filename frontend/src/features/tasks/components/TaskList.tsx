import type { Task, TaskStatus } from '../tasks.api'
import { useEffect, useRef, useState } from 'react'
import { TaskRow, type TaskRowMode } from './TaskRow'

type TaskListProps = {
  tasks: Task[]
  subjectById?: ReadonlyMap<string, NonNullable<Task['subject']>>
  planById?: ReadonlyMap<string, NonNullable<Task['studyPlan']>>
  mode?: TaskRowMode
  selectionMode?: boolean
  selectedIds?: string[]
  onSelect?: (id: string) => void
  onOpen?: (id: string) => void
  onEdit?: (task: Task) => void
  onDuplicate?: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete?: (id: string) => void
}

export function TaskList({ tasks, subjectById, planById, mode = 'default', selectionMode = false, selectedIds = [], onSelect, onOpen, onEdit, onDuplicate, onStatusChange, onDelete }: TaskListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const className = mode === 'compact' ? 'topic-task-list' : 'task-list-page'

  useEffect(() => {
    if (!openMenuId) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !listRef.current?.contains(event.target)) setOpenMenuId(null)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [openMenuId])

  return <div ref={listRef} className={className}>{tasks.map((task) => <TaskRow key={task.id} task={task} subject={task.subject ?? (task.subjectId ? subjectById?.get(task.subjectId) : null)} studyPlan={task.studyPlan ?? (task.studyPlanId ? planById?.get(task.studyPlanId) : null)} mode={mode} selectionMode={selectionMode} selected={selectedIds.includes(task.id)} onSelect={onSelect ? () => onSelect(task.id) : undefined} onOpen={onOpen ? () => onOpen(task.id) : undefined} onEdit={onEdit ? () => onEdit(task) : undefined} onDuplicate={onDuplicate ? () => onDuplicate(task) : undefined} menuOpen={openMenuId === task.id} onMenuOpenChange={(open) => setOpenMenuId(open ? task.id : null)} onStatusChange={(status) => onStatusChange(task.id, status)} onDelete={onDelete ? () => onDelete(task.id) : undefined} />)}</div>
}
