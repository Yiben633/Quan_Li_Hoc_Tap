import apiClient from '../../services/apiClient'
import type { AuthUser } from '../../types/auth'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type ProfileUpdate = Pick<AuthUser, 'fullName' | 'school' | 'major' | 'courseYear'> & { timezone: string; language: string; themeMode: 'light' | 'dark' }
export type NotificationSettings = { reminderMinutesBefore: number; emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean }
export async function getProfile() { const response = await apiClient.get<ApiResponse<AuthUser>>('/users/me'); return response.data.data }
export async function updateProfile(input: ProfileUpdate) { const response = await apiClient.patch<ApiResponse<AuthUser>>('/users/me', input); return response.data.data }
export async function uploadAvatar(file: File) { const body = new FormData(); body.append('avatar', file); const response = await apiClient.patch<ApiResponse<AuthUser>>('/users/me/avatar', body); return response.data.data }
export async function updatePassword(input: { currentPassword: string; newPassword: string }) { return apiClient.patch<ApiResponse<null>>('/users/me/password', input) }
export async function getNotificationSettings() { const response = await apiClient.get<ApiResponse<NotificationSettings>>('/notification-settings'); return response.data.data }
export async function updateNotificationSettings(input: Partial<NotificationSettings>) { const response = await apiClient.patch<ApiResponse<NotificationSettings>>('/notification-settings', input); return response.data.data }
