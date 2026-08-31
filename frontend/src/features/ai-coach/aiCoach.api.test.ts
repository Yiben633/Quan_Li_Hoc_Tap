import { describe, expect, it } from 'vitest'
import { canFallbackToNonStreaming, CoachStreamingResponseError, CoachStreamingUnavailableError, isCoachProviderUnavailableMessage } from './aiCoach.api'

describe('AI Coach streaming fallback', () => {
  it('only permits a non-streaming retry before a stream response is accepted', () => {
    expect(canFallbackToNonStreaming(new CoachStreamingUnavailableError('Route unavailable', true))).toBe(true)
    expect(canFallbackToNonStreaming(new CoachStreamingUnavailableError('Response body was interrupted'))).toBe(false)
    expect(canFallbackToNonStreaming(new CoachStreamingResponseError('Stream ended before final response'))).toBe(false)
  })

  it('recognizes the provider unavailable message returned by the coach API', () => {
    expect(isCoachProviderUnavailableMessage('Trợ lý AI đang tạm thời không phản hồi. Các chức năng StudyFlow khác vẫn hoạt động bình thường.')).toBe(true)
    expect(isCoachProviderUnavailableMessage('Không thể tải cuộc trò chuyện.')).toBe(false)
  })
})
