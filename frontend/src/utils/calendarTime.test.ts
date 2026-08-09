import { describe, expect, it } from 'vitest'
import { getVietnamDateTimeParts, toVietnamIso } from './calendarTime'

describe('Calendar timezone helpers', () => {
  it('hiển thị thời điểm UTC theo ngày giờ Việt Nam', () => {
    expect(getVietnamDateTimeParts('2026-08-08T17:30:00.000Z')).toEqual({ date: '2026-08-09', time: '00:30' })
  })

  it('tạo ISO có offset Việt Nam từ form lịch', () => {
    expect(toVietnamIso('2026-08-09', '09:15')).toBe('2026-08-09T09:15:00+07:00')
  })
})
