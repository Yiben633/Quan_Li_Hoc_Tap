import { ArrowRight, CalendarClock, Clock3, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CoachChatResponse } from '../aiCoach.types'

type TaskPriorityCardsProps = {
  priority: NonNullable<CoachChatResponse['taskPriority']>
  suggestions: NonNullable<CoachChatResponse['suggestions']>
}

const dueFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function dueLabel(value: string | null) {
  if (!value) return 'Chưa đặt hạn'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? `Hạn ${dueFormatter.format(date)}` : 'Chưa đặt hạn'
}

export function TaskPriorityCards({ priority, suggestions }: TaskPriorityCardsProps) {
  const suggestionById = new Map(suggestions.map((suggestion) => [suggestion.taskId, suggestion]))
  const rankedTasks = priority.taskIds.flatMap((taskId) => {
    const suggestion = suggestionById.get(taskId)
    return suggestion ? [suggestion] : []
  })

  if (!rankedTasks.length) return null

  return (
    <section className="ai-coach-task-priority" aria-label="Việc nên ưu tiên">
      <header><ListChecks size={16} /><div><span>VIỆC NÊN ƯU TIÊN</span><strong>Thứ tự từ dữ liệu công việc hiện tại</strong></div></header>
      <div>
        {rankedTasks.map((task, index) => (
          <Link key={task.taskId} to={`/tasks?taskId=${encodeURIComponent(task.taskId)}`} aria-label={`Mở công việc ưu tiên ${index + 1}: ${task.title}`}>
            <span className="ai-coach-task-priority-rank">{index + 1}</span>
            <span className="ai-coach-task-priority-copy"><strong>{task.title}</strong><small><CalendarClock size={13} /> {dueLabel(task.dueDate)}{task.estimatedMinutes ? <><span>·</span><Clock3 size={13} /> {task.estimatedMinutes} phút</> : null}</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
