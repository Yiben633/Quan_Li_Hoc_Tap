export function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const remaining = minutes % 60; return hours ? `${hours}h ${remaining}m` : `${remaining}m` }
