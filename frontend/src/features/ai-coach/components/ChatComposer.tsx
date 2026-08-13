import { Send } from 'lucide-react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Button, Textarea } from '../../../components/ui'

type ChatComposerProps = {
  value: string
  sending: boolean
  error?: string
  onChange: (value: string) => void
  onSend: () => void
  onRetry?: () => void
}

export function ChatComposer({ value, sending, error, onChange, onSend, onRetry }: ChatComposerProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSend()
  }

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  return (
    <form className="ai-coach-composer" onSubmit={submit} noValidate>
      <Textarea
        aria-label="Tin nhắn cho Trợ lý AI"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={keyDown}
        placeholder="Hỏi StudyFlow..."
        rows={3}
        maxLength={6000}
        disabled={sending}
      />
      <div className="ai-coach-composer-foot">
        <span className={error ? 'is-error' : undefined}>{error ?? 'Enter để gửi · Shift + Enter để xuống dòng'}</span>
        <div>
          {error && onRetry && <Button type="button" variant="secondary" onClick={onRetry} disabled={sending}>Thử lại</Button>}
          <Button type="submit" disabled={!value.trim()} loading={sending}>
            <Send size={16} /> Gửi
          </Button>
        </div>
      </div>
    </form>
  )
}
