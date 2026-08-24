import { CalendarDays, Flag, Target, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui'
import type { CoachDraft } from '../aiCoach.types'

type GoalDraftPreviewProps = {
  draft: CoachDraft
  subjectName?: string
  onDiscard: () => void
  onApply: () => void
  applying?: boolean
  discarding?: boolean
}

const goalTypeLabels = {
  score: 'Điểm số',
  study_time: 'Thời gian học',
  task_count: 'Số công việc',
  course_completion: 'Hoàn thành môn học',
  gpa: 'GPA',
} as const

function goalValue(value: number, type: NonNullable<CoachDraft['goal']>['type']) {
  if (type === 'study_time' && value % 60 === 0) return `${value / 60} giờ (${value} phút)`
  if (type === 'study_time') return `${value} phút`
  if (type === 'course_completion') return `${value}%`
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

export function GoalDraftPreview({ draft, subjectName, onDiscard, onApply, applying = false, discarding = false }: GoalDraftPreviewProps) {
  const goal = draft.goal
  if (!goal) return null
  const isApplied = draft.status === 'applied'

  return (
    <section className="ai-coach-goal-draft-preview">
      <header><span>MỤC TIÊU ĐỀ XUẤT</span><h3>{goal.name}</h3><p>Mục tiêu này chưa được tạo cho đến khi bạn xác nhận áp dụng.</p></header>
      <dl>
        <div><dt><Target size={15} /> Loại</dt><dd>{goalTypeLabels[goal.type]}</dd></div>
        <div><dt><Flag size={15} /> Cần đạt</dt><dd>{goalValue(goal.targetValue, goal.type)}</dd></div>
        {subjectName && <div><dt>Môn học</dt><dd>{subjectName}</dd></div>}
        {goal.deadline && <div><dt><CalendarDays size={15} /> Hạn hoàn thành</dt><dd>{new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${goal.deadline}T00:00:00.000Z`))}</dd></div>}
      </dl>
      <Link className="ai-coach-goal-draft-link" to="/goals"><Target size={14} /> Xem mục tiêu hiện có</Link>
      <footer>
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={isApplied || applying || discarding}><Trash2 size={15} /> Bỏ mục tiêu</Button>
        <Button type="button" onClick={onApply} disabled={isApplied || discarding} loading={applying}>{isApplied ? 'Đã áp dụng' : 'Áp dụng mục tiêu'}</Button>
      </footer>
    </section>
  )
}
