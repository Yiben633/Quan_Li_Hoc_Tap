import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './notifications.api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: { isRead?: boolean; page?: number; limit?: number }) => ['notifications', filters] as const,
}

export function useNotificationsQuery(filters: { isRead?: boolean; page?: number; limit?: number }) {
  return useQuery({ queryKey: notificationKeys.list(filters), queryFn: () => api.listNotifications(filters), refetchInterval: 60_000 })
}

export function useMarkNotificationReadMutation() {
  const client = useQueryClient()
  return useMutation({ mutationFn: api.markNotificationRead, onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }) })
}

export function useMarkAllNotificationsReadMutation() {
  const client = useQueryClient()
  return useMutation({ mutationFn: api.markAllNotificationsRead, onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }) })
}
