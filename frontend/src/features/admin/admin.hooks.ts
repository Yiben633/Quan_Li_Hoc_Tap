import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './admin.api'

export const adminKeys = {
  all: ['admin'] as const,
  users: (filters: api.PageFilters) => ['admin', 'users', filters] as const,
  feedback: (filters: api.PageFilters & { status?: api.FeedbackStatus }) => ['admin', 'feedback', filters] as const,
  logs: (filters: api.PageFilters) => ['admin', 'activity-logs', filters] as const,
  statistics: (range: api.AdminStatisticsRange) => ['admin', 'statistics', range] as const,
  content: ['admin', 'system-content'] as const,
}

export function useAdminUsersQuery(filters: api.PageFilters, enabled = true) { return useQuery({ queryKey: adminKeys.users(filters), queryFn: () => api.listAdminUsers(filters), enabled }) }
export function useAdminFeedbackQuery(filters: api.PageFilters & { status?: api.FeedbackStatus }, enabled = true) { return useQuery({ queryKey: adminKeys.feedback(filters), queryFn: () => api.listAdminFeedback(filters), enabled }) }
export function useActivityLogsQuery(filters: api.PageFilters, enabled = true) { return useQuery({ queryKey: adminKeys.logs(filters), queryFn: () => api.listActivityLogs(filters), enabled }) }
export function useAdminStatisticsQuery(range: api.AdminStatisticsRange = '30d', enabled = true) { return useQuery({ queryKey: adminKeys.statistics(range), queryFn: () => api.getAdminStatistics(range), enabled }) }
export function useSystemContentSupportQuery(enabled = true) { return useQuery({ queryKey: adminKeys.content, queryFn: api.getSystemContentSupport, enabled }) }
export function useAdminUserUpdateMutation() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: { deletedAt?: string | null; isEmailVerified?: boolean } }) => api.updateAdminUser(id, input), onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }) }) }
export function useAdminFeedbackUpdateMutation() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: { status: api.FeedbackStatus; adminReply?: string | null } }) => api.updateAdminFeedback(id, input), onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }) }) }
export function useTopicTemplateImportMutation() { const client = useQueryClient(); return useMutation({ mutationFn: api.importTopicTemplates, onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.logs({ page: 1, limit: 20 }) }) }) }
