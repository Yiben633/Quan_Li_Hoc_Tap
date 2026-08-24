import { Bot, List, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { Button, ConfirmDialog, Drawer, EmptyState, IconButton, Modal, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { CoachStreamingResponseError, CoachStreamingUnavailableError } from '../features/ai-coach/aiCoach.api'
import { ChatComposer } from '../features/ai-coach/components/ChatComposer'
import { ChatMessage } from '../features/ai-coach/components/ChatMessage'
import { ConversationList } from '../features/ai-coach/components/ConversationList'
import { FocusProposalCard } from '../features/ai-coach/components/FocusProposalCard'
import { GoalDraftCard } from '../features/ai-coach/components/GoalDraftCard'
import { GoalDraftPreview } from '../features/ai-coach/components/GoalDraftPreview'
import { AnalyticsSummaryCard } from '../features/ai-coach/components/AnalyticsSummaryCard'
import { PlanDraftCard } from '../features/ai-coach/components/PlanDraftCard'
import { PlanDraftEditor } from '../features/ai-coach/components/PlanDraftEditor'
import { PlanDraftPreview } from '../features/ai-coach/components/PlanDraftPreview'
import { SuggestionChips } from '../features/ai-coach/components/SuggestionChips'
import { TaskPriorityCards } from '../features/ai-coach/components/TaskPriorityCards'
import { useApplyCoachDraftMutation, useCoachChatMutation, useCoachChatStreamMutation, useCoachConversationsQuery, useCoachMessagesQuery, useDiscardCoachDraftMutation, useUpdateCoachDraftMutation } from '../features/ai-coach/aiCoach.hooks'
import type { CoachChatInput, CoachChatResponse, CoachDraft, CoachMessage } from '../features/ai-coach/aiCoach.types'
import { useTopicsQuery } from '../features/learning/learning.hooks'

const promptSuggestions = [
  'Hôm nay tôi nên học gì?',
  'Tuần này tôi học thế nào?',
  'Lập kế hoạch cho tuần này',
  'Sắp xếp lại các việc quá hạn',
  'Tạo lịch ôn thi',
  'Tôi có 2 tiếng tối nay',
]

type PendingMessage = Pick<CoachMessage, 'id' | 'role' | 'content'>
type CoachPageContext = NonNullable<CoachChatInput['context']>

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function coachContextFromSearchParams(searchParams: URLSearchParams): CoachPageContext {
  const readId = (key: keyof CoachPageContext) => {
    const value = searchParams.get(key)
    return value && uuidPattern.test(value) ? value : undefined
  }
  const subjectId = readId('subjectId')
  const studyPlanId = readId('studyPlanId')
  const taskId = readId('taskId')

  return {
    ...(subjectId ? { subjectId } : {}),
    ...(studyPlanId ? { studyPlanId } : {}),
    ...(taskId ? { taskId } : {}),
  }
}

function coachContextLabel(context: CoachPageContext) {
  if (context.taskId) return 'Đang ưu tiên công việc bạn vừa mở.'
  if (context.studyPlanId) return 'Đang ưu tiên kế hoạch bạn vừa mở.'
  if (context.subjectId) return 'Đang ưu tiên môn học bạn vừa mở.'
  return null
}

function isNearBottom(element: HTMLDivElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96
}

function statusFromError(error: unknown) {
  const response = error as { response?: { status?: number } }
  return response.response?.status
}

export function AICoachPage() {
  const [searchParams] = useSearchParams()
  const promptFromSearch = searchParams.get('prompt')?.trim().slice(0, 500) ?? ''
  const coachContext = useMemo(() => coachContextFromSearchParams(searchParams), [searchParams])
  const coachContextKey = `${coachContext.subjectId ?? ''}:${coachContext.studyPlanId ?? ''}:${coachContext.taskId ?? ''}`
  const contextLabel = coachContextLabel(coachContext)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null | undefined>()
  const [composerValue, setComposerValue] = useState('')
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null)
  const [streamingAssistantText, setStreamingAssistantText] = useState<string | null>(null)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [latestDraft, setLatestDraft] = useState<CoachChatResponse | null>(null)
  const [latestTaskPriority, setLatestTaskPriority] = useState<CoachChatResponse | null>(null)
  const [latestFocusProposal, setLatestFocusProposal] = useState<CoachChatResponse | null>(null)
  const [latestAnalytics, setLatestAnalytics] = useState<CoachChatResponse | null>(null)
  const [draftPreview, setDraftPreview] = useState<CoachDraft | null>(null)
  const [draftToApply, setDraftToApply] = useState<CoachDraft | null>(null)
  const [draftToDiscard, setDraftToDiscard] = useState<CoachDraft | null>(null)
  const [draftToEdit, setDraftToEdit] = useState<CoachDraft | null>(null)
  const [draftConflictMessage, setDraftConflictMessage] = useState<string | null>(null)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const conversationsQuery = useCoachConversationsQuery()
  const fallbackConversationId = conversationsQuery.data?.items[0]?.id
  const activeConversationId = selectedConversationId === undefined ? fallbackConversationId : selectedConversationId
  const messagesQuery = useCoachMessagesQuery(activeConversationId ?? undefined)
  const chat = useCoachChatMutation()
  const streamChat = useCoachChatStreamMutation()
  const applyDraft = useApplyCoachDraftMutation()
  const discardDraft = useDiscardCoachDraftMutation()
  const updateDraft = useUpdateCoachDraftMutation()
  const topicsQuery = useTopicsQuery()
  const messages = useMemo(() => messagesQuery.data?.items ?? [], [messagesQuery.data])
  const subjectNames = useMemo(() => new Map((topicsQuery.data?.items ?? []).map((topic) => [topic.id, topic.name])), [topicsQuery.data])

  useEffect(() => {
    if (coachContextKey === '::') return
    setSelectedConversationId(null)
    setLatestDraft(null)
    setLatestTaskPriority(null)
    setLatestFocusProposal(null)
    setLatestAnalytics(null)
    setDraftPreview(null)
    setDraftConflictMessage(null)
  }, [coachContextKey])

  useEffect(() => {
    if (!promptFromSearch) return
    setSelectedConversationId(null)
    setLatestDraft(null)
    setLatestTaskPriority(null)
    setLatestFocusProposal(null)
    setLatestAnalytics(null)
    setComposerValue(promptFromSearch)
  }, [promptFromSearch])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !shouldAutoScrollRef.current) return
    container.scrollTo({ top: container.scrollHeight, behavior: pendingMessage ? 'smooth' : 'auto' })
  }, [activeConversationId, messages, pendingMessage, streamingAssistantText])

  const beginNewConversation = () => {
    setSelectedConversationId(null)
    setFailedMessage(null)
    setLatestDraft(null)
    setLatestTaskPriority(null)
    setLatestFocusProposal(null)
    setLatestAnalytics(null)
    setDraftPreview(null)
    setDraftConflictMessage(null)
    setComposerValue('')
    shouldAutoScrollRef.current = true
    setMobileListOpen(false)
  }

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setFailedMessage(null)
    setLatestTaskPriority(null)
    setLatestFocusProposal(null)
    setLatestAnalytics(null)
    shouldAutoScrollRef.current = true
    setMobileListOpen(false)
  }

  const sendMessage = (retryMessage?: string) => {
    const message = (retryMessage ?? composerValue).trim()
    if (!message || chat.isPending || streamChat.isPending) return

    setPendingMessage({ id: `pending-${crypto.randomUUID()}`, role: 'user', content: message })
    setComposerValue('')
    setFailedMessage(null)
    setStreamingAssistantText('')
    shouldAutoScrollRef.current = true

    const input: CoachChatInput = {
      conversationId: activeConversationId ?? undefined,
      message,
      ...(contextLabel ? { context: coachContext } : {}),
    }
    const handleSuccess = (response: CoachChatResponse) => {
      setSelectedConversationId(response.conversationId)
      setPendingMessage(null)
      setStreamingAssistantText(null)
      setLatestDraft(response.draft ? response : null)
      setLatestTaskPriority(response.taskPriority && response.suggestions ? response : null)
      setLatestFocusProposal(response.focusProposal ? response : null)
      setLatestAnalytics(response.analytics ? response : null)
    }
    const handleError = (error: unknown) => {
      setPendingMessage(null)
      setStreamingAssistantText(null)
      setComposerValue(message)
      setFailedMessage(error instanceof CoachStreamingResponseError
        ? error.message
        : getApiErrorMessage(error, 'Chưa thể gửi tin nhắn. Hãy thử lại nhé.'))
    }
    const sendNonStreaming = () => chat.mutate(input, { onSuccess: handleSuccess, onError: handleError })

    streamChat.mutate({
      input,
      onTextDelta: (text) => setStreamingAssistantText((current) => `${current ?? ''}${text}`),
    }, {
      onSuccess: handleSuccess,
      onError: (error) => {
        if (error instanceof CoachStreamingUnavailableError) {
          setStreamingAssistantText(null)
          sendNonStreaming()
          return
        }
        handleError(error)
      },
    })
  }

  const conversationList = (
    <ConversationList
      conversations={conversationsQuery.data?.items ?? []}
      activeConversationId={activeConversationId ?? undefined}
      isLoading={conversationsQuery.isLoading}
      isError={conversationsQuery.isError}
      disabled={chat.isPending || streamChat.isPending}
      onSelect={selectConversation}
      onNew={beginNewConversation}
      onRetry={() => void conversationsQuery.refetch()}
    />
  )

  const showEmptyChat = !activeConversationId && !pendingMessage
  const showMessageLoading = Boolean(activeConversationId && messagesQuery.isLoading)
  const showMessageError = Boolean(activeConversationId && messagesQuery.isError)

  const confirmApplyDraft = () => {
    if (!draftToApply) return
    const draft = draftToApply
    applyDraft.mutate(draft.id, {
      onSuccess: (result) => {
        setLatestDraft((current) => current?.draft?.id === result.draftId && current.draft
          ? { ...current, draft: { ...current.draft, status: 'applied' } }
          : current)
        setDraftPreview((current) => current?.id === result.draftId ? { ...current, status: 'applied' } : current)
        setDraftConflictMessage(null)
        setDraftToApply(null)
        toast.success(result.alreadyApplied ? 'Kế hoạch này đã được áp dụng trước đó' : 'Đã áp dụng kế hoạch vào lịch của bạn')
      },
      onError: (error) => {
        if (statusFromError(error) === 409) {
          const message = 'Lịch của bạn đã thay đổi và đang xung đột với kế hoạch này. Hãy điều chỉnh hoặc tạo đề xuất mới.'
          setDraftToApply(null)
          setDraftPreview(draft)
          setDraftConflictMessage(message)
          toast.error(message)
          return
        }
        toast.error(getApiErrorMessage(error, 'Không thể áp dụng kế hoạch. Hãy kiểm tra lại lịch của bạn.'))
      },
    })
  }

  const confirmDiscardDraft = () => {
    if (!draftToDiscard) return
    const draft = draftToDiscard
    discardDraft.mutate(draft.id, {
      onSuccess: () => {
        setLatestDraft((current) => current?.draft?.id === draft.id ? null : current)
        setDraftPreview(null)
        setDraftToDiscard(null)
        setDraftConflictMessage(null)
        toast.success('Đã bỏ kế hoạch đề xuất')
      },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể bỏ kế hoạch đề xuất')),
    })
  }

  const adjustDraft = (draft: CoachDraft) => {
    setDraftPreview(null)
    setDraftConflictMessage(null)
    setDraftToEdit(draft)
  }

  const saveDraftEdits = (sessions: CoachDraft['sessions']) => {
    if (!draftToEdit) return
    updateDraft.mutate({ id: draftToEdit.id, sessions }, {
      onSuccess: (updatedDraft) => {
        setLatestDraft((current) => current?.draft?.id === updatedDraft.id ? { ...current, draft: updatedDraft } : current)
        setDraftPreview(updatedDraft)
        setDraftToEdit(null)
        setDraftConflictMessage(null)
        toast.success('Đã cập nhật bản nháp kế hoạch')
      },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật bản nháp. Hãy kiểm tra lại thời gian các phiên học.')),
    })
  }

  return (
    <main className="ai-coach-page">
      <header className="page-heading ai-coach-heading">
        <div>
          <p className="eyebrow">AI COACH</p>
          <h1>Trợ lý AI</h1>
          <p className="subtle">{contextLabel ?? 'Tập trung vào việc cần làm, rồi xem trước mọi kế hoạch trước khi áp dụng.'}</p>
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
            {streamingAssistantText !== null && <ChatMessage message={{ id: 'assistant-streaming', role: 'assistant', content: streamingAssistantText || 'Đang chuẩn bị phản hồi...' }} pending={streamChat.isPending} />}
            {chat.isPending && <ChatMessage message={{ id: 'assistant-pending', role: 'assistant', content: 'Đang chuẩn bị phản hồi...' }} pending />}
            {latestDraft && latestDraft.conversationId === activeConversationId && latestDraft.draft && (
              latestDraft.draft.type === 'goal' && latestDraft.draft.goal
                ? <GoalDraftCard
                    draft={latestDraft.draft}
                    subjectName={latestDraft.draft.goal.subjectId ? subjectNames.get(latestDraft.draft.goal.subjectId) : undefined}
                    applying={applyDraft.isPending}
                    onViewDetails={() => { setDraftPreview(latestDraft.draft); setDraftConflictMessage(null) }}
                    onApply={() => setDraftToApply(latestDraft.draft)}
                  />
                : <PlanDraftCard draft={latestDraft.draft} applying={applyDraft.isPending} onViewDetails={() => { setDraftPreview(latestDraft.draft); setDraftConflictMessage(null) }} onApply={() => setDraftToApply(latestDraft.draft)} />
            )}
            {latestTaskPriority && latestTaskPriority.conversationId === activeConversationId && latestTaskPriority.taskPriority && latestTaskPriority.suggestions && <TaskPriorityCards priority={latestTaskPriority.taskPriority} suggestions={latestTaskPriority.suggestions} />}
            {latestFocusProposal && latestFocusProposal.conversationId === activeConversationId && latestFocusProposal.focusProposal && <FocusProposalCard proposal={latestFocusProposal.focusProposal} />}
            {latestAnalytics && latestAnalytics.conversationId === activeConversationId && latestAnalytics.analytics && <AnalyticsSummaryCard analytics={latestAnalytics.analytics} />}
          </div>

          {showEmptyChat && <SuggestionChips items={promptSuggestions} disabled={chat.isPending || streamChat.isPending} onSelect={(value) => sendMessage(value)} />}
          <ChatComposer
            value={composerValue}
            sending={chat.isPending || streamChat.isPending}
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
      <ConfirmDialog
        open={Boolean(draftToApply)}
        title={draftToApply?.type === 'goal' ? 'Áp dụng mục tiêu đề xuất' : 'Áp dụng kế hoạch đề xuất'}
        description={draftToApply?.type === 'goal'
          ? `Tạo mục tiêu “${draftToApply.title}”? Mục tiêu sẽ chỉ được lưu sau khi máy chủ kiểm tra lại dữ liệu liên quan.`
          : `Áp dụng “${draftToApply?.title ?? ''}” vào lịch của bạn? Các phiên học và công việc trong bản nháp sẽ được tạo sau khi máy chủ kiểm tra lại xung đột.`}
        onCancel={() => { if (!applyDraft.isPending) setDraftToApply(null) }}
        onConfirm={confirmApplyDraft}
        loading={applyDraft.isPending}
      />
      <ConfirmDialog
        open={Boolean(draftToDiscard)}
        title={draftToDiscard?.type === 'goal' ? 'Bỏ mục tiêu đề xuất' : 'Bỏ kế hoạch đề xuất'}
        description={draftToDiscard?.type === 'goal'
          ? `Bỏ “${draftToDiscard.title}”? Mục tiêu này sẽ không được tạo.`
          : `Bỏ “${draftToDiscard?.title ?? ''}”? Kế hoạch này sẽ không tạo lịch hay công việc nào.`}
        onCancel={() => { if (!discardDraft.isPending) setDraftToDiscard(null) }}
        onConfirm={confirmDiscardDraft}
        loading={discardDraft.isPending}
      />
      <Modal open={Boolean(draftPreview)} title={draftPreview?.type === 'goal' ? 'Chi tiết mục tiêu đề xuất' : 'Chi tiết kế hoạch đề xuất'} onClose={() => { if (!applyDraft.isPending && !discardDraft.isPending) setDraftPreview(null) }}>
        {draftPreview?.type === 'goal' && draftPreview.goal ? <GoalDraftPreview
          draft={draftPreview}
          subjectName={draftPreview.goal.subjectId ? subjectNames.get(draftPreview.goal.subjectId) : undefined}
          applying={applyDraft.isPending}
          discarding={discardDraft.isPending}
          onApply={() => setDraftToApply(draftPreview)}
          onDiscard={() => setDraftToDiscard(draftPreview)}
        /> : draftPreview && <PlanDraftPreview
          draft={draftPreview}
          subjectNames={subjectNames}
          applying={applyDraft.isPending}
          discarding={discardDraft.isPending}
          conflictMessage={draftConflictMessage}
          onApply={() => setDraftToApply(draftPreview)}
          onDiscard={() => setDraftToDiscard(draftPreview)}
          onAdjust={() => adjustDraft(draftPreview)}
        />}
      </Modal>
      <Modal open={Boolean(draftToEdit)} title="Điều chỉnh kế hoạch" onClose={() => { if (!updateDraft.isPending) setDraftToEdit(null) }}>
        {draftToEdit && <PlanDraftEditor
          draft={draftToEdit}
          saving={updateDraft.isPending}
          onCancel={() => { if (!updateDraft.isPending) setDraftToEdit(null) }}
          onSave={saveDraftEdits}
        />}
      </Modal>
    </main>
  )
}
