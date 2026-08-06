import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }
export type LearningSpace = { id: string; name: string; academicYear: string; startDate: string; endDate: string; status: 'planning' | 'active' | 'closed' | 'archived'; targetGpa?: number | null; note?: string | null }
export type Topic = { id: string; semesterId: string; code: string; name: string; credits: number; colorHex: string; targetGrade?: number | null; status: 'in_progress' | 'completed' | 'dropped' | 'archived'; lecturer?: string | null; note?: string | null }
export type TopicDetail = Topic & { statistics: { taskTotal: number; taskDone: number; totalStudyMinutes: number; currentAverage: number | null } }
export type Paginated<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export async function listLearningSpaces(params?: { status?: string }) { const response = await apiClient.get<ApiResponse<Paginated<LearningSpace>>>('/semesters', { params }); return response.data.data }
export async function createLearningSpace(input: { name: string; academicYear: string; startDate: string; endDate: string; status?: LearningSpace['status']; note?: string | null }) { const response = await apiClient.post<ApiResponse<LearningSpace>>('/semesters', input); return response.data.data }
export async function updateLearningSpace(id: string, input: Partial<LearningSpace>) { const response = await apiClient.patch<ApiResponse<LearningSpace>>(`/semesters/${id}`, input); return response.data.data }
export async function deleteLearningSpace(id: string) { const response = await apiClient.delete<ApiResponse<LearningSpace>>(`/semesters/${id}`); return response.data.data }
export async function duplicateLearningSpace(id: string) { const response = await apiClient.post<ApiResponse<LearningSpace>>(`/semesters/${id}/duplicate`); return response.data.data }

export async function listTopics(params?: { semesterId?: string; search?: string; status?: string }) { const response = await apiClient.get<ApiResponse<Paginated<Topic>>>('/subjects', { params }); return response.data.data }
export async function createTopic(input: { semesterId: string; code: string; name: string; credits: number; colorHex: string; targetGrade?: number | null; note?: string | null }) { const response = await apiClient.post<ApiResponse<Topic>>('/subjects', input); return response.data.data }
export async function updateTopic(id: string, input: Partial<Topic>) { const response = await apiClient.patch<ApiResponse<Topic>>(`/subjects/${id}`, input); return response.data.data }
export async function deleteTopic(id: string) { const response = await apiClient.delete<ApiResponse<Topic>>(`/subjects/${id}`); return response.data.data }
export async function getTopic(id: string) { const response = await apiClient.get<ApiResponse<TopicDetail>>(`/subjects/${id}`); return response.data.data }
