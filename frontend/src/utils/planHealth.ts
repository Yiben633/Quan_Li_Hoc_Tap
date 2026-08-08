export type PlanHealthStatus = 'on_track' | 'attention' | 'at_risk'

export type PlanHealth = {
  status: PlanHealthStatus
  label: 'Đúng tiến độ' | 'Cần chú ý' | 'Có nguy cơ trễ'
  elapsedPercent: number
  gap: number
}

const dayMilliseconds = 86_400_000

function localDay(value: string | Date) {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getPlanHealth(startDate?: string | null, endDate?: string | null, progressPercent = 0, now = new Date()): PlanHealth | null {
  if (!startDate || !endDate) return null

  const start = localDay(startDate)
  const end = localDay(endDate)
  const current = localDay(now)
  if (!start || !end || !current || end.getTime() <= start.getTime()) return null

  const elapsedPercent = Math.min(100, Math.max(0, ((current.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100))
  const gap = elapsedPercent - Math.min(100, Math.max(0, progressPercent))

  if (gap <= 10) return { status: 'on_track', label: 'Đúng tiến độ', elapsedPercent, gap }
  if (gap <= 25) return { status: 'attention', label: 'Cần chú ý', elapsedPercent, gap }
  return { status: 'at_risk', label: 'Có nguy cơ trễ', elapsedPercent, gap }
}
