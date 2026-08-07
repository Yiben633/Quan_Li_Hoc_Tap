import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type StudyPlanStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'overdue'
export type Task = { id: string; title: string; description?: string | null; status: TaskStatus; priority: Priority; dueDate?: string | null; startDate?: string | null; estimatedMinutes?: number | null; difficulty?: number | null; subjectId?: string | null; studyPlanId?: string | null; completedAt?: string | null; sortOrder: number; attachmentCount?: number; subject?: { id: string; code: string; name: string; colorHex: string } | null; studyPlan?: { id: string; title: string } | null; subTaskProgress?: { total: number; done: number } }
export type TaskInput = { title: string; description?: string | null; startDate?: string | null; dueDate?: string | null; estimatedMinutes?: number | null; difficulty?: number | null; priority?: Priority; status?: TaskStatus; subjectId?: string | null; studyPlanId?: string | null }
export type Subtask = { id: string; taskId: string; title: string; isDone: boolean; sortOrder: number }
export type TaskDetail = Task & { subTasks: Subtask[]; attachments: Array<{ id: string; fileName: string; fileUrl: string; fileType?: string | null }> }
export type Page<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type TaskFilters = { subjectId?: string; studyPlanId?: string; status?: string; priority?: string; difficulty?: string; dueDate?: string; dueFrom?: string; dueTo?: string; search?: string; page?: number; limit?: number; sort?: string; order?: string }
export type StudyPlan = { id: string; title: string; description?: string | null; subjectId?: string | null; status: StudyPlanStatus; priority: Priority; progressPercent: number; startDate?: string | null; endDate?: string | null; estimatedHours?: number | null; targetGoal?: string | null }
export type StudyPlanInput = { title: string; description?: string | null; subjectId?: string | null; startDate?: string | null; endDate?: string | null; targetGoal?: string | null; estimatedHours?: number | null; priority?: Priority; status?: StudyPlanStatus }

export async function listTasks(params: TaskFilters = {}) { const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)); return (await apiClient.get<ApiResponse<Page<Task>>>('/tasks', { params: cleanParams })).data.data }
export async function listTodayTasks() { return (await apiClient.get<ApiResponse<Task[]>>('/tasks/today')).data.data }
export async function listOverdueTasks() { return (await apiClient.get<ApiResponse<Task[]>>('/tasks/overdue')).data.data }
export async function createTask(input: TaskInput) { return (await apiClient.post<ApiResponse<Task>>('/tasks', input)).data.data }
export async function listTaskDocuments(taskId: string) { return (await apiClient.get<ApiResponse<Page<{ id: string; title?: string; fileName?: string; fileUrl: string; fileType?: string | null }>>>('/documents', { params: { taskId, page: 1, limit: 100 } })).data.data.items }
export async function getTask(id: string) { const [taskResponse, documents] = await Promise.all([apiClient.get<ApiResponse<TaskDetail>>(`/tasks/${id}`), listTaskDocuments(id)]); const task = taskResponse.data.data; const existingIds = new Set(task.attachments.map((file) => file.id)); const documentAttachments = documents.filter((document) => !existingIds.has(document.id)).map((document) => ({ id: document.id, fileName: document.fileName ?? document.title ?? 'Tệp đính kèm', fileUrl: document.fileUrl, fileType: document.fileType })); return { ...task, attachments: [...task.attachments, ...documentAttachments] } }
export async function updateTaskStatus(id: string, status: TaskStatus) { return (await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status })).data.data }
export async function updateTask(id: string, input: Partial<TaskInput>) { return (await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, input)).data.data }
export async function uploadTaskAttachment(taskId: string, file: File) { const body = new FormData(); body.append('file', file, file.name); body.append('title', file.name); body.append('taskId', taskId); const item = (await apiClient.post<ApiResponse<{ id: string; title?: string; fileName?: string; fileUrl: string; fileType?: string | null }>>('/documents/upload', body, { headers: { 'Content-Type': undefined } })).data.data; return { id: item.id, fileName: item.fileName ?? item.title ?? file.name, fileUrl: item.fileUrl, fileType: item.fileType ?? file.type }; }
export async function deleteTask(id: string) { return (await apiClient.delete<ApiResponse<Task>>(`/tasks/${id}`)).data.data }
export async function duplicateTask(id: string) { return (await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/duplicate`)).data.data }
export async function updateSubtask(taskId: string, subtaskId: string, isDone: boolean) { return (await apiClient.patch<ApiResponse<Subtask>>(`/tasks/${taskId}/subtasks/${subtaskId}`, { isDone })).data.data }
export async function createSubtask(taskId: string, title: string) { return (await apiClient.post<ApiResponse<Subtask>>(`/tasks/${taskId}/subtasks`, { title })).data.data }
export async function listPlans(params: Record<string, string> = {}) { return (await apiClient.get<ApiResponse<Page<StudyPlan>>>('/study-plans', { params })).data.data }
export async function getPlan(id: string) { return (await apiClient.get<ApiResponse<StudyPlan>>(`/study-plans/${id}`)).data.data }
export async function createPlan(input: StudyPlanInput) { return (await apiClient.post<ApiResponse<StudyPlan>>('/study-plans', input)).data.data }
export async function updatePlan(id: string, input: Partial<StudyPlanInput>) { return (await apiClient.patch<ApiResponse<StudyPlan>>(`/study-plans/${id}`, input)).data.data }
export async function deletePlan(id: string) { return (await apiClient.delete<ApiResponse<StudyPlan>>(`/study-plans/${id}`)).data.data }
