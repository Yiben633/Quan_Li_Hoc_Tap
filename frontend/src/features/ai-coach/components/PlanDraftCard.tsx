import { CalendarRange, CheckCircle2, Clock3, TriangleAlert } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { CoachDraft } from '../aiCoach.types'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
})

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours && minutes) return `${hours} giờ ${minutes} phút`
  if (hours) return `${hours} giờ`
  return `${minutes} phút`
}

function formatDraftRange(draft: CoachDraft) {
  const intervals = draft.moves?.length
    ? draft.moves.map((move) => ({ startAt: move.toStartAt, endAt: move.toEndAt }))
    : draft.sessions
  if (!intervals.length) return 'Chưa xếp được phiên học'
  const start = new Date(Math.min(...intervals.map((session) => new Date(session.startAt).getTime())))
  const end = new Date(Math.max(...intervals.map((session) => new Date(session.endAt).getTime())))
  return `${dateFormatter.format(start)} → ${dateFormatter.format(end)}`
}

type PlanDraftCardProps = {
  draft: CoachDraft
  onViewDetails: () => void
  onApply: () => void
  applying?: boolean
}

export function PlanDraftCard({ draft, onViewDetails, onApply, applying = false }: PlanDraftCardProps) {
  const isApplied = draft.status === 'applied'

  return (
    <section className="ai-coach-plan-draft-card" aria-label={`Kế hoạch đề xuất: ${draft.title}`}>
      <div className="ai-coach-plan-draft-card-head">
        <div>
          <span>Kế hoạch đề xuất</span>
          <h3>{draft.title}</h3>
        </div>
        {isApplied && <span className="ai-coach-plan-draft-applied"><CheckCircle2 size={14} /> Đã áp dụng</span>}
      </div>

      <div className="ai-coach-plan-draft-metrics">
        <span><Clock3 size={15} /> {draft.summary.totalSessions} phiên · {formatDuration(draft.summary.totalMinutes)} · {draft.summary.taskCount} công việc</span>
        <span><CalendarRange size={15} /> {formatDraftRange(draft)}</span>
        {draft.warnings.length > 0 && <span className="ai-coach-plan-draft-warning"><TriangleAlert size={15} /> {draft.warnings.length} cảnh báo</span>}
      </div>

      <footer>
        <Button type="button" variant="secondary" onClick={onViewDetails}>Xem chi tiết</Button>
        <Button type="button" onClick={onApply} disabled={isApplied} loading={applying}>{isApplied ? 'Đã áp dụng' : 'Áp dụng'}</Button>
      </footer>
    </section>
  )
}
