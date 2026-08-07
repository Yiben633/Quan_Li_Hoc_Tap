const DAY_IN_MS = 86_400_000
const RELATIVE_DAY_LIMIT = 6

function toLocalDay(value: string | Date) {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }

  const date = value instanceof Date ? new Date(value) : new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayDifference(value: string | Date, now: Date) {
  return Math.round((toLocalDay(value).getTime() - toLocalDay(now).getTime()) / DAY_IN_MS)
}

export function formatTaskDeadline(value?: string | null, now = new Date()) {
  if (!value) return 'Chưa đặt hạn'

  const dueDate = toLocalDay(value)
  if (Number.isNaN(dueDate.getTime())) return 'Chưa đặt hạn'

  const days = dayDifference(value, now)
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  if (days > 1 && days <= RELATIVE_DAY_LIMIT) return `Còn ${days} ngày`
  if (days < 0 && days >= -RELATIVE_DAY_LIMIT) return `Quá hạn ${Math.abs(days)} ngày`

  return dueDate.toLocaleDateString('vi-VN')
}

export function formatTaskDate(value?: string | null) {
  if (!value) return 'Chưa đặt'
  const date = toLocalDay(value)
  return Number.isNaN(date.getTime()) ? 'Chưa đặt' : date.toLocaleDateString('vi-VN')
}

export function isTaskDeadlineOverdue(value?: string | null, now = new Date()) {
  if (!value) return false
  return dayDifference(value, now) < 0
}
