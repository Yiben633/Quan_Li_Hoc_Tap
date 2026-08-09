import { VIETNAM_TIME_ZONE } from './vietnamTime'

export function getVietnamDateTimeParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` }
}

export function toVietnamIso(date: string, time: string) {
  return `${date}T${time}:00+07:00`
}
