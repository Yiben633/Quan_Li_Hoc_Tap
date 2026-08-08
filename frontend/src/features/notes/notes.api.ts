import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type Note = {
  id: string
  userId: string
  subjectId?: string | null
  taskId?: string | null
  title: string
  contentRichText: string
  isPinned: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}
export type Page<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type NoteFilters = { subjectId?: string; taskId?: string; search?: string; page?: number; limit?: number }
export type NoteInput = { title: string; contentRichText: string; subjectId?: string | null; taskId?: string | null; tags?: string[] }

function cleanParams(params: NoteFilters) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

export async function listNotes(params: NoteFilters = {}) {
  return (await apiClient.get<ApiResponse<Page<Note>>>('/notes', { params: cleanParams(params) })).data.data
}

export async function createNote(input: NoteInput) {
  return (await apiClient.post<ApiResponse<Note>>('/notes', input)).data.data
}

export async function updateNote(id: string, input: Partial<NoteInput>) {
  return (await apiClient.patch<ApiResponse<Note>>(`/notes/${id}`, input)).data.data
}

export async function pinNote(id: string, isPinned: boolean) {
  return (await apiClient.patch<ApiResponse<Note>>(`/notes/${id}/pin`, { isPinned })).data.data
}

export async function deleteNote(id: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/notes/${id}`)).data.data
}
