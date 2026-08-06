export function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const remaining = minutes % 60; return hours ? `${hours}h ${remaining}m` : `${remaining}m` }
export function formatDate(value: string) { return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }
