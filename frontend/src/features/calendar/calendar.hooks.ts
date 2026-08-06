import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './calendar.api'

export const calendarKeys = { all: ['calendar'] as const, view: (view: api.CalendarView, date: string) => ['calendar', view, date] as const }
export function useCalendarQuery(view: api.CalendarView, date: string) { return useQuery({ queryKey: calendarKeys.view(view, date), queryFn: () => api.getCalendar(view, date) }) }
export function useCalendarEventMutation() { const client = useQueryClient(); const refresh = () => client.invalidateQueries({ queryKey: calendarKeys.all }); return { create: useMutation({ mutationFn: api.createEvent, onSuccess: refresh }), update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateEvent>[1] }) => api.updateEvent(id, input), onSuccess: refresh }), remove: useMutation({ mutationFn: api.deleteEvent, onSuccess: refresh }) } }
