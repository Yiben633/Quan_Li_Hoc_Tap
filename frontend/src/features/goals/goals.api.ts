import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type GoalType = 'score' | 'study_time' | 'task_count' | 'course_completion' | 'gpa'
export type GoalStatus = 'in_progress' | 'achieved' | 'failed' | 'archived'

export type Goal = {
  id: string
  name: string
  type: GoalType
  targetValue: number
  currentValue: number
  progressPercent: number
  subjectId?: string | null
  deadline?: string | null
  status: GoalStatus
  createdAt: string
  updatedAt: string
}

export type GoalInput = {
  name: string
  type: GoalType
  targetValue: number
  subjectId?: string | null
  deadline?: string | null
  status?: GoalStatus
}

export type GoalFilters = { status?: GoalStatus; type?: GoalType }

export async function listGoals(params: GoalFilters = {}) {
  return (await apiClient.get<ApiResponse<Goal[]>>('/goals', { params })).data.data
}

export async function createGoal(input: GoalInput) {
  return (await apiClient.post<ApiResponse<Goal>>('/goals', input)).data.data
}

export async function updateGoal(id: string, input: Partial<GoalInput>) {
  return (await apiClient.patch<ApiResponse<Goal>>(`/goals/${id}`, input)).data.data
}

export async function archiveGoal(id: string) {
  return (await apiClient.delete<ApiResponse<Goal>>(`/goals/${id}`)).data.data
}
