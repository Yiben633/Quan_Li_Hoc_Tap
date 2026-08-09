import { describe, expect, it } from 'vitest'
import { getVietnamGreeting, getVietnamTodayKey } from './vietnamTime'

describe('Vietnam time helpers', () => {
  it('chào đúng theo giờ tại Việt Nam', () => {
    expect(getVietnamGreeting(new Date('2026-08-08T01:00:00.000Z'))).toBe('Chào buổi sáng')
    expect(getVietnamGreeting(new Date('2026-08-08T08:00:00.000Z'))).toBe('Chào buổi chiều')
    expect(getVietnamGreeting(new Date('2026-08-08T13:00:00.000Z'))).toBe('Chào buổi tối')
  })

  it('tạo khóa ngày theo Asia/Ho_Chi_Minh thay vì múi giờ máy', () => {
    expect(getVietnamTodayKey(new Date('2026-08-08T17:30:00.000Z'))).toBe('2026-08-09')
  })
})
