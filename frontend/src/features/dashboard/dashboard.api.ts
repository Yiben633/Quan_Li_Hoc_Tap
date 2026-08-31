import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type DashboardTask = {
  id: string
  title: string
  status: string
  dueDate?: string | null
  subjectId?: string | null
  estimatedMinutes?: number | null
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null
}

export type DashboardSubject = {
  id: string
  name: string
  code?: string | null
  colorHex?: string | null
  taskProgress?: {
    taskTotal: number
    taskDone: number
    progressPercent: number
  } | null
}

export type DashboardSchedule = {
  id: string
  title: string
  type?: string
  startDate?: string | null
  startTime: string
  endTime?: string | null
}

export type DashboardGoal = {
  id: string
  name: string
  currentValue: number | string
  targetValue: number | string
  deadline?: string | null
  progressPercent?: number
}

export type DashboardSummary = {
  tasksToday: DashboardTask[]
  taskDone: number
  taskOverdue: number
  studyMinutesThisWeek: number
  studyHoursThisWeek: number
  activeSubjects: DashboardSubject[]
  upcomingSchedules: DashboardSchedule[]
  activeGoals: DashboardGoal[]
  dailyBriefing?: {
    openTaskCount: number
    dueTodayCount: number
    availableSlot: { startTime: string; endTime: string } | null
  }
}

export type ProgressPoint = { date: string; taskDone: number; studyMinutes: number }
export type ProgressChart = { range: 'week' | 'month'; points: ProgressPoint[] }

export async function getDashboardSummary() {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary')
  return response.data.data
}

export async function getProgressChart(range: 'week' | 'month') {
  const response = await apiClient.get<ApiResponse<ProgressChart>>('/dashboard/progress-chart', { params: { range } })
  return response.data.data
}
