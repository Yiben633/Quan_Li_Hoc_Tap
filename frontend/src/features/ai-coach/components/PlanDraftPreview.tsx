import { ArrowDown, CalendarDays, ChevronRight, Clock3, FileText, ListChecks, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui'
import type { CoachDraft } from '../aiCoach.types'

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dayTitleFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

type PlanDraftPreviewProps = {
  draft: CoachDraft
  subjectNames: ReadonlyMap<string, string>
  onDiscard: () => void
  onAdjust: () => void
  onApply: () => void
  applying?: boolean
  discarding?: boolean
  conflictMessage?: string | null
}

function groupedSessions(draft: CoachDraft) {
  const groups = new Map<string, CoachDraft['sessions']>()
  for (const session of [...draft.sessions].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())) {
    const day = dayKeyFormatter.format(new Date(session.startAt))
    groups.set(day, [...(groups.get(day) ?? []), session])
  }
  return [...groups.entries()]
}

export function PlanDraftPreview({ draft, subjectNames, onDiscard, onAdjust, onApply, applying = false, discarding = false, conflictMessage = null }: PlanDraftPreviewProps) {
  const isApplied = draft.status === 'applied'
  const canAdjustSessions = draft.type === 'study_schedule'
  const moves = draft.moves ?? []

  return (
    <section className="ai-coach-plan-preview">
      <div className="ai-coach-plan-preview-intro">
        <span>Kế hoạch đề xuất</span>
        <h3>{draft.title}</h3>
        <p>{draft.summary.totalSessions} phiên · {draft.summary.totalMinutes} phút · {draft.summary.taskCount} công việc</p>
      </div>

      {moves.length > 0 ? (
        <div className="ai-coach-reschedule-preview" aria-label="Các phiên được đề xuất dời lịch">
          {moves.map((move) => (
            <article key={move.id}>
              <strong>{move.title}</strong>
              <div className="ai-coach-reschedule-preview-times">
                <time>{dayTitleFormatter.format(new Date(move.fromStartAt))} · {timeFormatter.format(new Date(move.fromStartAt))}</time>
                <ArrowDown size={16} aria-hidden="true" />
                <time>{dayTitleFormatter.format(new Date(move.toStartAt))} · {timeFormatter.format(new Date(move.toStartAt))}</time>
              </div>
              <span>{move.minutes} phút · Sẽ chỉ thay đổi sau khi bạn áp dụng</span>
            </article>
          ))}
        </div>
      ) : <div className="ai-coach-plan-preview-days">
        {groupedSessions(draft).map(([day, sessions]) => (
          <section key={day} className="ai-coach-plan-preview-day">
            <h4>{dayTitleFormatter.format(new Date(sessions[0]!.startAt)).toLocaleUpperCase('vi-VN')}</h4>
            {sessions.map((session) => {
              const subjectName = session.subjectId ? subjectNames.get(session.subjectId) : undefined
              return (
                <article key={session.id}>
                  <time>{timeFormatter.format(new Date(session.startAt))}–{timeFormatter.format(new Date(session.endAt))}</time>
                  <div>
                    <strong>{session.title}</strong>
                    <span>{subjectName ? `${subjectName} · ` : ''}{session.minutes} phút</span>
                  </div>
                </article>
              )
            })}
          </section>
        ))}
        {!draft.sessions.length && <p className="subtle">Bản nháp này chưa có phiên học để hiển thị.</p>}
      </div>}

      {draft.warnings.length > 0 && <div className="ai-coach-plan-preview-warnings">{draft.warnings.map((warning, index) => <p key={`${warning.code}-${warning.taskId ?? index}`}>{warning.message}</p>)}</div>}
      {conflictMessage && <p className="ai-coach-plan-preview-conflict" role="alert">{conflictMessage}</p>}

      <nav className="ai-coach-plan-preview-links" aria-label="Xem dữ liệu liên quan">
        <Link to="/calendar"><CalendarDays size={14} /> Xem lịch <ChevronRight size={14} /></Link>
        <Link to="/tasks"><ListChecks size={14} /> Xem công việc <ChevronRight size={14} /></Link>
        <Link to="/study-plans"><FileText size={14} /> Xem kế hoạch <ChevronRight size={14} /></Link>
      </nav>

      <footer className="ai-coach-plan-preview-actions">
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={isApplied || applying || discarding}><Trash2 size={15} /> Bỏ kế hoạch</Button>
        {canAdjustSessions && <Button type="button" variant="secondary" onClick={onAdjust} disabled={isApplied || applying || discarding}>Điều chỉnh</Button>}
        <Button type="button" onClick={onApply} disabled={isApplied || discarding} loading={applying}><Clock3 size={15} /> {isApplied ? 'Đã áp dụng' : 'Áp dụng kế hoạch'}</Button>
      </footer>
    </section>
  )
}
