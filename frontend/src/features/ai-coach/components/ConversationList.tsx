import { MessageSquarePlus, RefreshCw } from 'lucide-react'
import { Button, EmptyState, Skeleton } from '../../../components/ui'
import type { CoachConversation } from '../aiCoach.types'

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
})

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
        {isError && <EmptyState title="Chưa thể tải hội thoại" description="Kiểm tra kết nối rồi thử lại." action={<Button type="button" variant="secondary" onClick={onRetry}><RefreshCw size={15} /> Thử lại</Button>} />}
        {!isLoading && !isError && !conversations.length && <EmptyState title="Chưa có hội thoại" description="Bắt đầu một cuộc trao đổi mới với Trợ lý AI." />}
        {!isLoading && !isError && conversations.map((conversation) => (
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
      </div>
    </section>
  )
}
