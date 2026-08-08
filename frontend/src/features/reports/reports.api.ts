import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type ReportRange = 'weekly' | 'monthly'
export type ReportFilters = { range: ReportRange; semesterId?: string; subjectId?: string }
export type ReportSession = { id: string; startedAt: string; totalMinutes: number; subjectId?: string | null }
export type ReportTask = { id: string; title: string; completedAt: string; subjectId?: string | null }
export type ReportSubject = { id: string; code: string; name: string; credits: number }
export type ReportData = {
  start: string
  end: string
  semesterId?: string | null
  subjectId?: string | null
  taskDone: number
  overdueTasks: number
  totalStudyMinutes: number
  totalStudyHours: number
  sessions: ReportSession[]
  subjects: ReportSubject[]
  tasks: ReportTask[]
}
export type ExportFormat = 'pdf' | 'excel'

function scopeParams(filters: ReportFilters) {
  return { ...(filters.semesterId ? { semesterId: filters.semesterId } : {}), ...(filters.subjectId ? { subjectId: filters.subjectId } : {}) }
}

export async function getReport(filters: ReportFilters) {
  return (await apiClient.get<ApiResponse<ReportData>>(`/reports/${filters.range}`, { params: scopeParams(filters) })).data.data
}

export async function exportReport(input: ReportFilters & { format: ExportFormat }) {
  const response = await apiClient.post<Blob>('/reports/export', null, { params: { type: input.range, format: input.format, ...scopeParams(input) }, responseType: 'blob' })
  const header = String(response.headers['content-disposition'] ?? '')
  const fileName = /filename="?([^";]+)"?/i.exec(header)?.[1] ?? `studyflow-${input.range}.${input.format === 'excel' ? 'xlsx' : 'pdf'}`
  return { blob: response.data, fileName }
}
