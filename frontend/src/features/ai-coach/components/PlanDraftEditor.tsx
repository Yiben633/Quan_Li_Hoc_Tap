import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, IconButton } from '../../../components/ui'
import type { CoachDraft } from '../aiCoach.types'

const vietnamDateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function toInputValue(value: string) {
  const parts = Object.fromEntries(vietnamDateParts.formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function toVietnamIso(value: string) {
  return `${value}:00+07:00`
}

function sessionDurationMinutes(session: CoachDraft['sessions'][number]) {
  return Math.round((new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / 60_000)
}

function draftValidationMessage(sessions: CoachDraft['sessions'], draft: CoachDraft) {
  const rangeStart = draft.range?.startAt ? new Date(draft.range.startAt).getTime() : null
  const rangeEnd = draft.range?.endAt ? new Date(draft.range.endAt).getTime() : null
  const sorted = [...sessions].sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())

  for (const [index, session] of sorted.entries()) {
    const startAt = new Date(session.startAt).getTime()
    const endAt = new Date(session.endAt).getTime()
    if (endAt <= startAt) return `Phiên ${index + 1} cần kết thúc sau thời điểm bắt đầu.`
    if (rangeStart !== null && startAt < rangeStart) return `Phiên ${index + 1} nằm ngoài khoảng thời gian của bản nháp.`
    if (rangeEnd !== null && endAt > rangeEnd) return `Phiên ${index + 1} nằm ngoài khoảng thời gian của bản nháp.`
    if (index > 0 && startAt < new Date(sorted[index - 1]!.endAt).getTime()) return 'Các phiên học không được chồng lên nhau.'
  }

  return null
}

type PlanDraftEditorProps = {
  draft: CoachDraft
  saving?: boolean
  onCancel: () => void
  onSave: (sessions: CoachDraft['sessions']) => void
}

export function PlanDraftEditor({ draft, saving = false, onCancel, onSave }: PlanDraftEditorProps) {
  const [sessions, setSessions] = useState(() => draft.sessions.map((session) => ({ ...session })))
  const validationMessage = useMemo(() => draftValidationMessage(sessions, draft), [draft, sessions])
  const rangeMin = draft.range?.startAt ? toInputValue(draft.range.startAt) : undefined
  const rangeMax = draft.range?.endAt ? toInputValue(draft.range.endAt) : undefined

  const updateTime = (sessionId: string, field: 'startAt' | 'endAt', value: string) => {
    if (!value) return
    setSessions((current) => current.map((session) => {
      if (session.id !== sessionId) return session
      const updated = { ...session, [field]: toVietnamIso(value) }
      return { ...updated, minutes: sessionDurationMinutes(updated) }
    }))
  }

  const removeSession = (sessionId: string) => {
    setSessions((current) => current.filter((session) => session.id !== sessionId).map((session, index) => ({ ...session, sequence: index + 1 })))
  }

  return (
    <form className="ai-coach-plan-editor" onSubmit={(event) => { event.preventDefault(); if (!validationMessage) onSave(sessions) }}>
      <div className="ai-coach-plan-editor-intro">
        <p>Chỉ thay đổi các phiên trong bản nháp. Lịch và công việc thật sẽ chỉ được cập nhật sau khi bạn áp dụng kế hoạch.</p>
      </div>

      {sessions.length > 0 ? (
        <div className="ai-coach-plan-editor-sessions">
          {sessions.map((session, index) => (
            <article key={session.id}>
              <div className="ai-coach-plan-editor-session-head">
                <div>
                  <span>Phiên {index + 1}</span>
                  <strong>{session.title}</strong>
                </div>
                <IconButton type="button" label={`Bỏ phiên ${index + 1}: ${session.title}`} onClick={() => removeSession(session.id)} disabled={saving}><Trash2 size={16} /></IconButton>
              </div>
              <div className="ai-coach-plan-editor-times">
                <label>
                  <span>Bắt đầu</span>
                  <input type="datetime-local" value={toInputValue(session.startAt)} min={rangeMin} max={rangeMax} onChange={(event) => updateTime(session.id, 'startAt', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Kết thúc</span>
                  <input type="datetime-local" value={toInputValue(session.endAt)} min={rangeMin} max={rangeMax} onChange={(event) => updateTime(session.id, 'endAt', event.target.value)} disabled={saving} />
                </label>
                <span className="ai-coach-plan-editor-duration">{session.minutes} phút</span>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="subtle">Bản nháp không còn phiên học nào. Bạn vẫn có thể lưu để giữ lại bản nháp trống.</p>}

      {validationMessage && <p className="ai-coach-plan-editor-error" role="alert">{validationMessage}</p>}

      <footer className="ai-coach-plan-editor-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Hủy</Button>
        <Button type="submit" loading={saving} disabled={Boolean(validationMessage)}>Lưu thay đổi</Button>
      </footer>
    </form>
  )
}
