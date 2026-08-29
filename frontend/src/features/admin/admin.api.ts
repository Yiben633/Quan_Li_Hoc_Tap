import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type PaginationData = { page: number; limit: number; total: number; totalPages: number }
export type PageFilters = { search?: string; page: number; limit: number }

export type AdminUser = {
  id: string
  fullName: string
  email: string
  isEmailVerified: boolean
  deletedAt?: string | null
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
  roles: Array<{ role: { name: string } }>
}

export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type AdminFeedback = {
  id: string
  type: 'bug' | 'feature_request' | 'question'
  title: string
  content: string
  status: FeedbackStatus
  adminReply?: string | null
  createdAt: string
  resolvedAt?: string | null
  user: { id: string; fullName: string; email: string }
}

export type ActivityLog = {
  id: string
  action: string
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
  metadata?: unknown
  createdAt: string
  user?: { id: string; fullName: string; email: string } | null
}

export type AdminStatisticsRange = '7d' | '30d' | '90d'
export type AdminRecentActivity = {
  id: string
  action: string
  entityType?: string | null
  entityId?: string | null
  createdAt: string
  actor?: { id: string; fullName: string; email: string } | null
}
export type AdminStatistics = {
  range: { key: AdminStatisticsRange; days: number; from: string; to: string }
  activeUsers: number
  newUsers: number
  disabledUsers: number
  studyGroups: number
  openFeedback: number
  tasks: number
  completedTasks: number
  studyPlans: number
  studySessions: number
  totalStudyMinutes: number
  recentAdminActivity: AdminRecentActivity[]
}
export type TopicTemplate = { code: string; name: string; credits: number }
export type TemplateImportResult = { imported: number; templates: TopicTemplate[] }

export async function listAdminUsers(params: PageFilters) { return (await apiClient.get<ApiResponse<{ items: AdminUser[]; pagination: PaginationData }>>('/admin/users', { params })).data.data }
export async function updateAdminUser(id: string, input: { deletedAt?: string | null; isEmailVerified?: boolean }) { return (await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, input)).data.data }
export async function listAdminFeedback(params: PageFilters & { status?: FeedbackStatus }) { return (await apiClient.get<ApiResponse<{ items: AdminFeedback[]; pagination: PaginationData }>>('/admin/feedback', { params })).data.data }
export async function updateAdminFeedback(id: string, input: { status: FeedbackStatus; adminReply?: string | null }) { return (await apiClient.patch<ApiResponse<AdminFeedback>>(`/admin/feedback/${id}`, input)).data.data }
export async function listActivityLogs(params: PageFilters) { return (await apiClient.get<ApiResponse<{ items: ActivityLog[]; pagination: PaginationData }>>('/admin/activity-logs', { params })).data.data }
export async function getAdminStatistics(range: AdminStatisticsRange = '30d') { return (await apiClient.get<ApiResponse<AdminStatistics>>('/admin/statistics', { params: { range } })).data.data }
export async function importTopicTemplates(file: File) { const body = new FormData(); body.append('file', file); return (await apiClient.post<ApiResponse<TemplateImportResult>>('/admin/subject-templates/import', body)).data.data }
export async function getSystemContentSupport() { return (await apiClient.get<ApiResponse<{ supported: boolean; message: string }>>('/admin/system-content')).data.data }
