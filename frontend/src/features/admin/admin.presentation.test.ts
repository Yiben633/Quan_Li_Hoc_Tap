import { describe, expect, it } from 'vitest'
import { formatAdminAnalyticsDate, isAdminOverviewData } from './admin.presentation'

describe('admin presentation helpers', () => {
  it('does not throw when a chart label has already been formatted', () => {
    const label = formatAdminAnalyticsDate('2026-08-31')
    expect(label).not.toBe('2026-08-31')
    expect(formatAdminAnalyticsDate(label)).toBe(label)
  })

  it('rejects an incomplete overview payload before rendering it', () => {
    expect(isAdminOverviewData({ totalUsers: 3 })).toBe(false)
  })
})
