import { describe, expect, it } from 'vitest'
import { formatStudyClock } from './useStudySessionClock'

describe('formatStudyClock', () => {
  it('formats a Pomodoro countdown without an unnecessary hour segment', () => {
    expect(formatStudyClock(25 * 60, false)).toBe('25:00')
  })

  it('preserves hours for an active study session', () => {
    expect(formatStudyClock(3_661)).toBe('01:01:01')
  })
})
