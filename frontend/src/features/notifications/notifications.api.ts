import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  createdAt: string
}

export type NotificationPage = {
  items: NotificationItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function listNotifications(params: { isRead?: boolean; page?: number; limit?: number } = {}) {
  return (await apiClient.get<ApiResponse<NotificationPage>>('/notifications', { params })).data.data
}

export async function markNotificationRead(id: string) {
  return (await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`)).data.data
}

export async function markAllNotificationsRead() {
  return (await apiClient.patch<ApiResponse<{ updated: number }>>('/notifications/read-all')).data.data
}

export function notificationRoute(item: NotificationItem) {
  if (item.relatedEntityType === 'study_plan' && item.relatedEntityId) return `/study-plans/${item.relatedEntityId}`
  return null
}
