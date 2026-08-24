import apiClient, { apiBaseUrl } from '../../services/apiClient'
import { useAuthStore } from '../../stores/authStore'
import type { CoachChatInput, CoachChatResponse, CoachConversation, CoachDraft, CoachMessage, CoachPage } from './aiCoach.types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export async function sendCoachMessage(input: CoachChatInput) {
  return (await apiClient.post<ApiResponse<CoachChatResponse>>('/ai/coach/chat', input)).data.data
}

export class CoachStreamingUnavailableError extends Error {
  constructor(message = 'Không thể dùng phản hồi theo thời gian thực.') {
    super(message)
    this.name = 'CoachStreamingUnavailableError'
  }
}

export class CoachStreamingResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CoachStreamingResponseError'
  }
}

type CoachStreamEvent = 'ready' | 'delta' | 'final' | 'error' | 'done'

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent.split(/\r?\n/)
  const event = (lines.find((line) => line.startsWith('event:'))?.slice(6).trim() || 'message') as CoachStreamEvent
  const data = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
  return { event, data }
}

async function responseMessage(response: Response) {
  try {
    const body = await response.json() as { message?: string }
    return body.message || 'Không thể kết nối Trợ lý AI.'
  } catch {
    return 'Không thể kết nối Trợ lý AI.'
  }
}

export async function streamCoachMessage(
  input: CoachChatInput,
  onTextDelta: (text: string) => void,
): Promise<CoachChatResponse> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${apiBaseUrl}/ai/coach/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) throw new CoachStreamingUnavailableError(await responseMessage(response))
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
    throw new CoachStreamingUnavailableError()
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedEvent = false
  let finalResponse: CoachChatResponse | null = null

  const processEvent = (rawEvent: string) => {
    if (!rawEvent.trim()) return
    const { event, data } = parseSseEvent(rawEvent)
    receivedEvent = true
    const payload = data ? JSON.parse(data) as { text?: string; message?: string; data?: CoachChatResponse } : {}

    if (event === 'delta' && payload.text) onTextDelta(payload.text)
    if (event === 'final' && payload.data) finalResponse = payload.data
    if (event === 'error') throw new CoachStreamingResponseError(payload.message || 'Không thể nhận phản hồi từ Trợ lý AI.')
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const separator = /\r?\n\r?\n/
      let match = separator.exec(buffer)
      while (match) {
        const rawEvent = buffer.slice(0, match.index)
        buffer = buffer.slice(match.index + match[0].length)
        processEvent(rawEvent)
        match = separator.exec(buffer)
      }

      if (done) break
    }
  } finally {
    reader.releaseLock()
  }

  if (!finalResponse) {
    throw receivedEvent
      ? new CoachStreamingResponseError('Phản hồi theo thời gian thực đã kết thúc trước khi hoàn tất.')
      : new CoachStreamingUnavailableError()
  }
  return finalResponse
}

export async function getCoachConversations() {
  return (await apiClient.get<ApiResponse<CoachPage<CoachConversation>>>('/ai/coach/conversations', {
    params: { page: 1, limit: 30, status: 'active' },
  })).data.data
}

export async function getCoachMessages(conversationId: string) {
  return (await apiClient.get<ApiResponse<CoachPage<CoachMessage>>>(`/ai/coach/conversations/${conversationId}/messages`, {
    params: { page: 1, limit: 100 },
  })).data.data
}

export async function deleteCoachConversation(conversationId: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/ai/coach/conversations/${conversationId}`)).data.data
}

export type ApplyCoachDraftResult = {
  draftId: string
  status: 'applied'
  alreadyApplied: boolean
  createdStudyPlanId: string | null
  createdEventIds: string[]
  createdTaskIds: string[]
  updatedEventIds: string[]
  createdGoalId?: string
}

export async function applyCoachDraft(draftId: string) {
  return (await apiClient.post<ApiResponse<ApplyCoachDraftResult>>(`/ai/coach/drafts/${draftId}/apply`)).data.data
}

export async function discardCoachDraft(draftId: string) {
  return (await apiClient.post<ApiResponse<{ id: string; status: 'discarded' }>>(`/ai/coach/drafts/${draftId}/discard`)).data.data
}

export async function updateCoachDraft(input: Pick<CoachDraft, 'id' | 'sessions'>) {
  return (await apiClient.patch<ApiResponse<CoachDraft>>(`/ai/coach/drafts/${input.id}`, { sessions: input.sessions })).data.data
}
