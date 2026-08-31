import { MessageSquarePlus, RefreshCw } from 'lucide-react'
import { Button, EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import type { CoachConversation } from '../aiCoach.types'

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
})

const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type ConversationGroupKey = 'today' | 'recent' | 'older'

const conversationGroupLabels: Record<ConversationGroupKey, string> = {
  today: 'Hôm nay',
  recent: '7 ngày qua',
  older: 'Trước đó',
}

function vietnamDayNumber(value: Date) {
  const parts = vietnamDateFormatter.formatToParts(value)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

function conversationGroup(updatedAt: string): ConversationGroupKey {
  const updatedDay = vietnamDayNumber(new Date(updatedAt))
  const currentDay = vietnamDayNumber(new Date())
  const elapsedDays = currentDay - updatedDay

  if (elapsedDays <= 0) return 'today'
  if (elapsedDays <= 7) return 'recent'
  return 'older'
}

type ConversationListProps = {
  conversations: CoachConversation[]
  activeConversationId?: string
  isLoading: boolean
  isError: boolean
  disabled?: boolean
  onSelect: (conversationId: string) => void
  onNew: () => void
  onRetry: () => void
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  isError,
  disabled = false,
  onSelect,
  onNew,
  onRetry,
}: ConversationListProps) {
  const groupedConversations = conversations.reduce<Record<ConversationGroupKey, CoachConversation[]>>((groups, conversation) => {
    groups[conversationGroup(conversation.updatedAt)].push(conversation)
    return groups
  }, { today: [], recent: [], older: [] })

  return (
    <section className="ai-conversation-list" aria-label="Cuộc trò chuyện">
      <div className="ai-conversation-list-head">
        <strong>Cuộc trò chuyện</strong>
        <Button type="button" variant="ghost" onClick={onNew} disabled={disabled}>
          <MessageSquarePlus size={15} /> Mới
        </Button>
      </div>
      <div className="ai-conversation-list-body">
        {isLoading && <div className="ai-conversation-skeletons"><Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} /></div>}
        {isError && <ErrorState compact title="Không thể tải hội thoại." action={<Button type="button" variant="secondary" onClick={onRetry}><RefreshCw size={15} /> Thử lại</Button>} />}
        {!isLoading && !isError && !conversations.length && <EmptyState title="Chưa có hội thoại" description="Bắt đầu một cuộc trao đổi mới với Trợ lý AI." />}
        {!isLoading && !isError && (Object.keys(conversationGroupLabels) as ConversationGroupKey[]).map((group) => groupedConversations[group].length > 0 && (
          <section key={group} className="ai-conversation-group" aria-label={conversationGroupLabels[group]}>
            <p>{conversationGroupLabels[group]}</p>
            {groupedConversations[group].map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`ai-conversation-item ${activeConversationId === conversation.id ? 'active' : ''}`}
                onClick={() => onSelect(conversation.id)}
                aria-current={activeConversationId === conversation.id ? 'page' : undefined}
                disabled={disabled}
              >
                <strong>{conversation.title || 'Cuộc trò chuyện mới'}</strong>
                <span>{conversation._count.messages} tin nhắn · {timeFormatter.format(new Date(conversation.updatedAt))}</span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}
