export function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const remaining = minutes % 60; return hours ? `${hours}h ${remaining}m` : `${remaining}m` }
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatDate(value: string) { return new Date(value).toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }) }
export function formatDayMonth(value: string) { return new Date(value).toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIME_ZONE, day: '2-digit', month: '2-digit' }) }
export function formatTime(value: string) { return new Date(value).toLocaleTimeString('vi-VN', { timeZone: VIETNAM_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }) }
