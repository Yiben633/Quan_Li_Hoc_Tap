import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../components/ui'
import type { CalendarItem } from '../calendar/calendar.api'
import { useCalendarQuery } from '../calendar/calendar.hooks'
import { getVietnamDateTimeParts } from '../../utils/calendarTime'
import { getVietnamTodayKey } from '../../utils/vietnamTime'

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function weekDays(todayKey: string) {
  const [year, month, day] = todayKey.split('-').map(Number)
  const anchor = new Date(Date.UTC(year, month - 1, day, 12))
  const weekday = anchor.getUTCDay()
  const mondayOffset = weekday === 0 ? 6 : weekday - 1

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor)
    date.setUTCDate(anchor.getUTCDate() - mondayOffset + index)
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  })
}

function calendarItemTone(item: CalendarItem) {
  if (item.type === 'task_due') return 'deadline'
  if (item.type === 'exam') return 'exam'
  if (item.type === 'event') return 'event'
  return 'schedule'
}

function calendarItemTime(item: CalendarItem) {
  if (item.type === 'task_due') return null
  return getVietnamDateTimeParts(item.startAt).time
}

function calendarItemLabel(item: CalendarItem) {
  const labels: Record<CalendarItem['type'], string> = {
    schedule: 'Lịch học',
    event: 'Sự kiện',
    task_due: 'Hạn công việc',
    exam: 'Kỳ thi',
  }
  return labels[item.type]
}

export function DashboardWeeklyCalendar() {
  const todayKey = getVietnamTodayKey()
  const days = weekDays(todayKey)
  const calendar = useCalendarQuery('week', todayKey)
  const itemsByDay = new Map<string, CalendarItem[]>()

  for (const item of calendar.data?.items ?? []) {
    const itemDay = getVietnamDateTimeParts(item.startAt).date
    itemsByDay.set(itemDay, [...(itemsByDay.get(itemDay) ?? []), item])
  }

  return <section className="panel dashboard-weekly-calendar" aria-labelledby="dashboard-weekly-calendar-title">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">LỊCH TUẦN NÀY</p>
        <h2 id="dashboard-weekly-calendar-title">Lịch học và hạn cần nhớ</h2>
      </div>
      <Link className="text-link" to={`/calendar?date=${todayKey}`}>Xem lịch <ArrowUpRight size={15} /></Link>
    </div>
    {calendar.isLoading ? <div className="dashboard-weekly-calendar-skeleton">{days.map((day) => <Skeleton key={day} height={148} />)}</div> : calendar.isError ? <ErrorState compact title="Không thể tải lịch tuần này." action={<button className="button secondary" onClick={() => calendar.refetch()}>Thử lại</button>} /> : <div className="dashboard-weekly-calendar-scroll"><div className="dashboard-weekly-calendar-grid">
      {days.map((day, index) => {
        const items = itemsByDay.get(day) ?? []
        const visibleItems = items.slice(0, 3)
        const hiddenCount = items.length - visibleItems.length
        const dayDate = new Date(`${day}T12:00:00Z`)
        const dayNumber = new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', day: 'numeric' }).format(dayDate)
        const dayLabel = new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(dayDate)

        return <Link key={day} className={`dashboard-weekly-calendar-day${day === todayKey ? ' is-today' : ''}`} to={`/calendar?date=${day}`} aria-label={`Mở lịch ngày ${dayLabel}${items.length ? `, ${items.length} sự kiện` : ''}`}>
          <span className="dashboard-weekly-calendar-day-head"><small>{weekdayLabels[index]}</small><strong>{dayNumber}</strong></span>
          <span className="dashboard-weekly-calendar-events">
            {visibleItems.map((item) => {
              const time = calendarItemTime(item)
              return <span key={`${item.type}-${item.sourceEntity.id}-${item.startAt}`} className={`dashboard-weekly-calendar-event tone-${calendarItemTone(item)}`} title={`${calendarItemLabel(item)}: ${item.title}${time ? `, ${time}` : ''}`}>
                {time && <i>{time}</i>}<b>{item.title}</b>
              </span>
            })}
            {hiddenCount > 0 && <span className="dashboard-weekly-calendar-more">+{hiddenCount}</span>}
          </span>
        </Link>
      })}
    </div></div>}
    <CalendarDays className="dashboard-weekly-calendar-icon" size={17} aria-hidden="true" />
  </section>
}
