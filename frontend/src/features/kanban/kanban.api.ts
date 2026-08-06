import apiClient from '../../services/apiClient'
import type { Priority, TaskStatus } from '../tasks/tasks.api'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type KanbanTask = { id: string; title: string; status: TaskStatus; priority: Priority; dueDate?: string | null; subjectId?: string | null; subject?: { name: string; colorHex?: string | null } | null; studyPlan?: { title: string } | null; subTasks?: Array<{ id: string; isDone: boolean }> }
export type KanbanBoard = { columns: Record<TaskStatus, KanbanTask[]>; tasks: KanbanTask[]; total: number }
export async function getBoard(params: { subjectId?: string; priority?: string } = {}) { return (await apiClient.get<ApiResponse<KanbanBoard>>('/kanban/board', { params })).data.data }
export async function moveTask(input: { taskId: string; toStatus: TaskStatus; newIndex: number }) { return (await apiClient.patch<ApiResponse<KanbanBoard>>('/kanban/move', input)).data.data }
