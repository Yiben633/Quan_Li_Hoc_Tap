import type { CoachDraft, CoachMessage as CoachMessageType } from '../aiCoach.types'

type ChatMessageProps = {
  message: Pick<CoachMessageType, 'id' | 'role' | 'content'>
  draft?: CoachDraft | null
  pending?: boolean
}

function messageLabel(role: CoachMessageType['role']) {
  if (role === 'user') return 'Bạn'
  if (role === 'system') return 'StudyFlow'
  return 'Trợ lý AI'
}

export function ChatMessage({ message, draft, pending = false }: ChatMessageProps) {
  const role = message.role === 'user' ? 'user' : 'assistant'
  return (
    <article className={`ai-coach-message ${role}${pending ? ' pending' : ''}`}>
      <strong>{messageLabel(message.role)}</strong>
      <p>{message.content}</p>
      {draft && (
        <div className="ai-coach-draft-summary" aria-label="Tóm tắt bản nháp kế hoạch">
          <span>Bản nháp cần xác nhận</span>
          <strong>{draft.summary.totalSessions} phiên · {draft.summary.totalMinutes} phút · {draft.summary.taskCount} công việc</strong>
        </div>
      )}
    </article>
  )
}
