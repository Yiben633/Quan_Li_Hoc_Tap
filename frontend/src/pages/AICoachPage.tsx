import { Bot, List, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Drawer, EmptyState, IconButton, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { ChatComposer } from '../features/ai-coach/components/ChatComposer'
import { ChatMessage } from '../features/ai-coach/components/ChatMessage'
import { ConversationList } from '../features/ai-coach/components/ConversationList'
import { SuggestionChips } from '../features/ai-coach/components/SuggestionChips'
import { useCoachChatMutation, useCoachConversationsQuery, useCoachMessagesQuery } from '../features/ai-coach/aiCoach.hooks'
import type { CoachChatResponse, CoachMessage } from '../features/ai-coach/aiCoach.types'

const promptSuggestions = [
  'Hôm nay tôi nên làm việc nào trước?',
  'Lập kế hoạch học cho tôi trong 7 ngày.',
  'Tuần này tôi có những việc nào cần ưu tiên?',
]

type PendingMessage = Pick<CoachMessage, 'id' | 'role' | 'content'>

function isNearBottom(element: HTMLDivElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96
}

export function AICoachPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null | undefined>()
  const [composerValue, setComposerValue] = useState('')
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [latestDraft, setLatestDraft] = useState<CoachChatResponse | null>(null)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const conversationsQuery = useCoachConversationsQuery()
  const fallbackConversationId = conversationsQuery.data?.items[0]?.id
  const activeConversationId = selectedConversationId === undefined ? fallbackConversationId : selectedConversationId
  const messagesQuery = useCoachMessagesQuery(activeConversationId ?? undefined)
  const chat = useCoachChatMutation()
  const messages = useMemo(() => messagesQuery.data?.items ?? [], [messagesQuery.data])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !shouldAutoScrollRef.current) return
    container.scrollTo({ top: container.scrollHeight, behavior: pendingMessage ? 'smooth' : 'auto' })
  }, [activeConversationId, messages, pendingMessage])

  const beginNewConversation = () => {
    setSelectedConversationId(null)
    setFailedMessage(null)
    setLatestDraft(null)
    setComposerValue('')
    shouldAutoScrollRef.current = true
    setMobileListOpen(false)
  }

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setFailedMessage(null)
    shouldAutoScrollRef.current = true
    setMobileListOpen(false)
  }

  const sendMessage = (retryMessage?: string) => {
    const message = (retryMessage ?? composerValue).trim()
    if (!message || chat.isPending) return

    setPendingMessage({ id: `pending-${crypto.randomUUID()}`, role: 'user', content: message })
    setComposerValue('')
    setFailedMessage(null)
    shouldAutoScrollRef.current = true

    chat.mutate({ conversationId: activeConversationId ?? undefined, message }, {
      onSuccess: (response) => {
        setSelectedConversationId(response.conversationId)
        setPendingMessage(null)
        setLatestDraft(response.draft ? response : null)
      },
      onError: (error) => {
        setPendingMessage(null)
        setComposerValue(message)
        setFailedMessage(getApiErrorMessage(error, 'Chưa thể gửi tin nhắn. Hãy thử lại nhé.'))
      },
    })
  }

  const conversationList = (
    <ConversationList
      conversations={conversationsQuery.data?.items ?? []}
      activeConversationId={activeConversationId ?? undefined}
      isLoading={conversationsQuery.isLoading}
      isError={conversationsQuery.isError}
      disabled={chat.isPending}
      onSelect={selectConversation}
      onNew={beginNewConversation}
      onRetry={() => void conversationsQuery.refetch()}
    />
  )

  const showEmptyChat = !activeConversationId && !pendingMessage
  const showMessageLoading = Boolean(activeConversationId && messagesQuery.isLoading)
  const showMessageError = Boolean(activeConversationId && messagesQuery.isError)

  return (
    <main className="ai-coach-page">
      <header className="page-heading ai-coach-heading">
        <div>
          <p className="eyebrow">AI COACH</p>
          <h1>Trợ lý AI</h1>
          <p className="subtle">Tập trung vào việc cần làm, rồi xem trước mọi kế hoạch trước khi áp dụng.</p>
        </div>
        <div className="ai-coach-heading-actions">
          <IconButton label="Mở danh sách hội thoại" className="ai-coach-mobile-list-button" onClick={() => setMobileListOpen(true)}><List size={19} /></IconButton>
          <div className="ai-coach-heading-icon" aria-hidden="true"><Sparkles size={21} /></div>
        </div>
      </header>

      <section className="ai-coach-shell" aria-label="Trợ lý AI">
        <aside className="ai-coach-sidebar">{conversationList}</aside>
        <section className="ai-coach-chat" aria-label="Cuộc trò chuyện với Trợ lý AI">
          <div
            ref={messagesContainerRef}
            className="ai-coach-messages"
            aria-live="polite"
            onScroll={(event) => { shouldAutoScrollRef.current = isNearBottom(event.currentTarget) }}
          >
            {showMessageLoading && <div className="ai-coach-message-skeletons"><Skeleton height={68} width="68%" /><Skeleton height={82} width="76%" /><Skeleton height={62} width="58%" /></div>}
            {showMessageError && <EmptyState icon={<Bot size={25} />} title="Chưa thể tải tin nhắn" description="Kiểm tra kết nối rồi thử lại." action={<Button type="button" variant="secondary" onClick={() => void messagesQuery.refetch()}>Thử lại</Button>} />}
            {showEmptyChat && <EmptyState icon={<Bot size={27} />} title="Bạn muốn bắt đầu từ đâu?" description="Hãy hỏi về việc cần làm, tiến độ hoặc một kế hoạch bạn muốn xem trước." />}
            {!showMessageLoading && !showMessageError && messages.map((message) => <ChatMessage key={message.id} message={message} />)}
            {pendingMessage && <ChatMessage message={pendingMessage} pending />}
            {chat.isPending && <ChatMessage message={{ id: 'assistant-pending', role: 'assistant', content: 'Đang chuẩn bị phản hồi...' }} pending />}
            {latestDraft && latestDraft.conversationId === activeConversationId && latestDraft.draft && (
              <section className="ai-coach-plan-draft" aria-label="Bản nháp kế hoạch">
                <span>Bản nháp kế hoạch</span>
                <strong>{latestDraft.draft.title}</strong>
                <p>{latestDraft.draft.summary.totalSessions} phiên · {latestDraft.draft.summary.totalMinutes} phút · {latestDraft.draft.summary.taskCount} công việc</p>
                {latestDraft.draft.warnings.length > 0 && <small>{latestDraft.draft.warnings.map((warning) => warning.message).join(' ')}</small>}
              </section>
            )}
          </div>

          {showEmptyChat && <SuggestionChips items={promptSuggestions} disabled={chat.isPending} onSelect={(value) => sendMessage(value)} />}
          <ChatComposer
            value={composerValue}
            sending={chat.isPending}
            error={failedMessage ?? undefined}
            onChange={(value) => { setComposerValue(value); if (failedMessage) setFailedMessage(null) }}
            onSend={() => sendMessage()}
            onRetry={() => sendMessage()}
          />
        </section>
      </section>

      <Drawer open={mobileListOpen} title="Cuộc trò chuyện" side="left" onClose={() => setMobileListOpen(false)}>
        <div className="ai-coach-mobile-list">{conversationList}</div>
      </Drawer>
    </main>
  )
}
