import { CalendarDays, CheckCircle2, Target } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { CoachDraft } from '../aiCoach.types'

type GoalDraftCardProps = {
  draft: CoachDraft
  subjectName?: string
  onViewDetails: () => void
  onApply: () => void
  applying?: boolean
}

const goalTypeLabels = {
  score: 'Điểm số',
  study_time: 'Thời gian học',
  task_count: 'Số công việc',
  course_completion: 'Hoàn thành môn học',
  gpa: 'GPA',
} as const

const deadlineFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function formatGoalValue(value: number, type: NonNullable<CoachDraft['goal']>['type']) {
  if (type === 'study_time' && value % 60 === 0) return `${value / 60} giờ`
  if (type === 'study_time') return `${value} phút`
  if (type === 'course_completion') return `${value}%`
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

export function GoalDraftCard({ draft, subjectName, onViewDetails, onApply, applying = false }: GoalDraftCardProps) {
  const goal = draft.goal
  if (!goal) return null
  const isApplied = draft.status === 'applied'
  const deadline = goal.deadline ? new Date(`${goal.deadline}T00:00:00.000Z`) : null

  return (
    <section className="ai-coach-goal-draft-card" aria-label={`Mục tiêu đề xuất: ${goal.name}`}>
      <header>
        <span className="ai-coach-goal-draft-icon"><Target size={18} /></span>
        <div><span>MỤC TIÊU ĐỀ XUẤT</span><h3>{goal.name}</h3></div>
        {isApplied && <span className="ai-coach-goal-draft-applied"><CheckCircle2 size={14} /> Đã áp dụng</span>}
      </header>
      <div className="ai-coach-goal-draft-details">
        <span>{goalTypeLabels[goal.type]}</span>
        <strong>{formatGoalValue(goal.targetValue, goal.type)}</strong>
        {subjectName && <small>{subjectName}</small>}
        {deadline && <small><CalendarDays size={13} /> Hạn {deadlineFormatter.format(deadline)}</small>}
      </div>
      <footer>
        <Button type="button" variant="secondary" onClick={onViewDetails}>Xem chi tiết</Button>
        <Button type="button" onClick={onApply} disabled={isApplied} loading={applying}>{isApplied ? 'Đã áp dụng' : 'Áp dụng mục tiêu'}</Button>
      </footer>
    </section>
  )
}
