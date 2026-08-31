import apiClient from '../../services/apiClient'

export type CalendarView = 'day' | 'week' | 'month'
export type CalendarScheduleType = 'class' | 'self_study' | 'exam' | 'presentation' | 'group_work' | 'personal'
export type CalendarItem = { type: 'schedule' | 'event' | 'task_due' | 'exam'; scheduleType?: CalendarScheduleType; title: string; startAt: string; endAt: string; colorHex?: string | null; sourceEntity: { type: string; id: string; subjectId?: string | null } }
export type CalendarResponse = { view: CalendarView; start: string; end: string; items: CalendarItem[]; total: number }
type ApiResponse<T> = { success: boolean; message: string; data: T }

export async function getCalendar(view: CalendarView, date: string) { return (await apiClient.get<ApiResponse<CalendarResponse>>('/calendar', { params: { view, date } })).data.data }
export async function createEvent(input: { title: string; startAt: string; endAt?: string | null; isAllDay?: boolean; colorHex?: string | null; reminderBefore?: number | null }) { return (await apiClient.post<ApiResponse<CalendarItem>>('/events', input)).data.data }
export async function updateEvent(id: string, input: { startAt?: string; endAt?: string | null; title?: string }) { return (await apiClient.patch<ApiResponse<CalendarItem>>(`/events/${id}`, input)).data.data }
export async function deleteEvent(id: string) { return (await apiClient.delete<ApiResponse<CalendarItem>>(`/events/${id}`)).data.data }
