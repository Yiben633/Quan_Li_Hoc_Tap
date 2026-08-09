export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

function parts(value: Date, options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: VIETNAM_TIME_ZONE, ...options }).formatToParts(value).map((part) => [part.type, part.value]))
}

export function getVietnamGreeting(value = new Date()) {
  const hour = Number(parts(value, { hour: '2-digit', hourCycle: 'h23' }).hour)
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function getVietnamTodayKey(value = new Date()) {
  const values = parts(value, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${values.year}-${values.month}-${values.day}`
}
