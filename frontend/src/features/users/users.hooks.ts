import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotificationSettings, getProfile, updateNotificationSettings, updatePassword, updateProfile, uploadAvatar } from './users.api'
export const userKeys = { profile: ['user', 'profile'] as const, notifications: ['notification-settings'] as const }
export const useProfileQuery = () => useQuery({ queryKey: userKeys.profile, queryFn: getProfile })
export const useUpdateProfileMutation = () => { const client = useQueryClient(); return useMutation({ mutationFn: updateProfile, onSuccess: (user) => { client.setQueryData(userKeys.profile, user) } }) }
export const useUploadAvatarMutation = () => { const client = useQueryClient(); return useMutation({ mutationFn: uploadAvatar, onSuccess: (user) => { client.setQueryData(userKeys.profile, user) } }) }
export const useUpdatePasswordMutation = () => useMutation({ mutationFn: updatePassword })
export const useNotificationSettingsQuery = () => useQuery({ queryKey: userKeys.notifications, queryFn: getNotificationSettings })
export const useUpdateNotificationSettingsMutation = () => { const client = useQueryClient(); return useMutation({ mutationFn: updateNotificationSettings, onSuccess: (settings) => { client.setQueryData(userKeys.notifications, settings) } }) }
