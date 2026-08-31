import type { AdminStatistics } from './admin.api'

const analyticsDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

export function formatAdminAnalyticsDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`)
  return Number.isNaN(date.getTime()) ? value : analyticsDateFormatter.format(date)
}

export function isAdminOverviewData(value: unknown): value is AdminStatistics {
  if (!value || typeof value !== 'object') return false

  const data = value as Partial<AdminStatistics>
  const overduePlans = data.attention?.overduePlans
  return Number.isFinite(data.totalUsers)
    && Number.isFinite(data.activityToday)
    && Number.isFinite(data.openTasks)
    && Number.isFinite(data.activeStudyPlans)
    && Array.isArray(data.analytics)
    && Array.isArray(data.plansRequiringAttention)
    && Array.isArray(data.recentAdminActivity)
    && Number.isFinite(overduePlans)
}
