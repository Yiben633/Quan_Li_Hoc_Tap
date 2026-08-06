import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Task = { id: string; title: string; description?: string | null; status: TaskStatus; priority: Priority; dueDate?: string | null; startDate?: string | null; estimatedMinutes?: number | null; difficulty?: number | null; subjectId?: string | null; studyPlanId?: string | null; completedAt?: string | null; sortOrder: number }
export type Subtask = { id: string; taskId: string; title: string; isDone: boolean; sortOrder: number }
export type TaskDetail = Task & { subTasks: Subtask[]; attachments: Array<{ id: string; fileName: string; fileUrl: string; fileType?: string | null }> }
export type Page<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type TaskFilters = { subjectId?: string; status?: string; priority?: string; dueDate?: string; search?: string; page?: number; limit?: number; sort?: string; order?: string }
export type StudyPlan = { id: string; title: string; description?: string | null; subjectId?: string | null; status: string; priority: Priority; progressPercent: number; startDate?: string | null; endDate?: string | null; estimatedHours?: number | null; targetGoal?: string | null }

export async function listTasks(params: TaskFilters = {}) { return (await apiClient.get<ApiResponse<Page<Task>>>('/tasks', { params })).data.data }
export async function getTask(id: string) { return (await apiClient.get<ApiResponse<TaskDetail>>(`/tasks/${id}`)).data.data }
export async function updateTaskStatus(id: string, status: TaskStatus) { return (await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status })).data.data }
export async function updateTask(id: string, input: Partial<Task>) { return (await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, input)).data.data }
export async function deleteTask(id: string) { return (await apiClient.delete<ApiResponse<Task>>(`/tasks/${id}`)).data.data }
export async function duplicateTask(id: string) { return (await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/duplicate`)).data.data }
export async function updateSubtask(taskId: string, subtaskId: string, isDone: boolean) { return (await apiClient.patch<ApiResponse<Subtask>>(`/tasks/${taskId}/subtasks/${subtaskId}`, { isDone })).data.data }
export async function listPlans(params: Record<string, string> = {}) { return (await apiClient.get<ApiResponse<Page<StudyPlan>>>('/study-plans', { params })).data.data }
