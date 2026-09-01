import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COACH_PROVIDER_UNAVAILABLE_MESSAGE } from '../features/ai-coach/aiCoach.api'
import type { CoachChatResponse, CoachConversation } from '../features/ai-coach/aiCoach.types'

const coachState = vi.hoisted(() => ({
  conversations: [] as CoachConversation[],
  messages: [] as Array<{ id: string; conversationId: string; role: 'user' | 'assistant'; content: string; metadata: Record<string, unknown> | null; createdAt: string }>,
  conversationsRefetch: vi.fn(),
  streamMutate: vi.fn(),
  chatMutate: vi.fn(),
}))

vi.mock('../hooks/useMediaQuery', () => ({ useMediaQuery: () => false }))
vi.mock('../components/nature', () => ({
  NatureEmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  NatureMascot: () => null,
}))
vi.mock('../features/learning/learning.hooks', () => ({
  useTopicsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
}))
vi.mock('../features/ai-coach/aiCoach.hooks', () => ({
  useCoachConversationsQuery: () => ({ data: { items: coachState.conversations }, isLoading: false, isError: false, refetch: coachState.conversationsRefetch }),
  useCoachMessagesQuery: () => ({ data: { items: coachState.messages }, isLoading: false, isError: false, refetch: vi.fn() }),
  useCoachChatMutation: () => ({ mutate: coachState.chatMutate, isPending: false }),
  useCoachChatStreamMutation: () => ({ mutate: coachState.streamMutate, isPending: false }),
  useApplyCoachDraftMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDiscardCoachDraftMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCoachDraftMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { AICoachPage } from './AICoachPage'

Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() })

function response(conversationId: string, message = 'Coach response'): CoachChatResponse {
  return {
    conversationId,
    message,
    intent: 'question',
    needsConfirmation: false,
    draft: null,
    provider: 'test',
  }
}

function conversation(id: string, title = 'Existing conversation'): CoachConversation {
  return {
    id,
    title,
    status: 'active',
    createdAt: '2030-01-01T09:00:00.000Z',
    updatedAt: '2030-01-01T09:00:00.000Z',
    _count: { messages: 1, drafts: 0 },
  }
}

function setStreamResponses(responses: CoachChatResponse[]) {
  const queue = [...responses]
  coachState.streamMutate.mockImplementation((_request, callbacks) => callbacks.onSuccess(queue.shift()))
}

function renderCoach() {
  return render(<MemoryRouter initialEntries={['/ai-coach']}><AICoachPage /></MemoryRouter>)
}

async function sendComposerMessage(user: ReturnType<typeof userEvent.setup>, message: string) {
  await user.type(screen.getByLabelText('Tin nhắn cho Trợ lý AI'), message)
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
}

describe('AICoachPage conversation lifecycle', () => {
  beforeEach(() => {
    coachState.conversations = []
    coachState.messages = []
    coachState.conversationsRefetch.mockReset()
    coachState.streamMutate.mockReset()
    coachState.chatMutate.mockReset()
  })

  it('creates one conversation for the first message and reuses it for the second', async () => {
    setStreamResponses([response('conversation-1'), response('conversation-1')])
    const user = userEvent.setup()
    renderCoach()

    await sendComposerMessage(user, 'First message')
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(1))
    expect(coachState.streamMutate.mock.calls[0][0].input).toMatchObject({ conversationId: undefined, message: 'First message' })

    await sendComposerMessage(user, 'Second message')
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(2))
    expect(coachState.streamMutate.mock.calls[1][0].input).toMatchObject({ conversationId: 'conversation-1', message: 'Second message' })
  })

  it('uses a starter prompt only once and keeps its returned conversation for follow-up', async () => {
    setStreamResponses([response('conversation-1'), response('conversation-1')])
    const user = userEvent.setup()
    renderCoach()

    await user.click(screen.getByRole('button', { name: 'Hôm nay nên học gì?' }))
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(1))
    expect(coachState.streamMutate.mock.calls[0][0].input).toMatchObject({ conversationId: undefined, message: 'Hôm nay nên học gì?' })

    await sendComposerMessage(user, 'Follow-up message')
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(2))
    expect(coachState.streamMutate.mock.calls[1][0].input).toMatchObject({ conversationId: 'conversation-1', message: 'Follow-up message' })
  })

  it('starts another conversation only after Mới resets the active conversation', async () => {
    coachState.conversations = [conversation('conversation-1')]
    setStreamResponses([response('conversation-2')])
    const user = userEvent.setup()
    renderCoach()

    await user.click(screen.getByRole('button', { name: 'Mới' }))
    await sendComposerMessage(user, 'New conversation message')
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(1))
    expect(coachState.streamMutate.mock.calls[0][0].input).toMatchObject({ conversationId: undefined, message: 'New conversation message' })
  })

  it('shows the provider unavailable state and retries in the same conversation', async () => {
    setStreamResponses([
      response('conversation-1', COACH_PROVIDER_UNAVAILABLE_MESSAGE),
      response('conversation-1', 'Provider recovered'),
    ])
    const user = userEvent.setup()
    renderCoach()

    await sendComposerMessage(user, 'Plan my week')
    expect(await screen.findByRole('alert')).toHaveTextContent('Trợ lý AI đang tạm thời không phản hồi.')

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(coachState.streamMutate).toHaveBeenCalledTimes(2))
    expect(coachState.streamMutate.mock.calls[1][0].input).toMatchObject({ conversationId: 'conversation-1', message: 'Plan my week' })
  })
})
