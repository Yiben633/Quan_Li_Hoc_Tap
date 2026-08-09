import type { AxiosProgressEvent } from 'axios'
import apiClient, { apiBaseUrl } from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type DocumentFileType = 'pdf' | 'word' | 'excel' | 'ppt' | 'image' | 'link' | 'video' | 'code' | 'other'
export type DocumentItem = {
  id: string
  userId: string
  subjectId?: string | null
  taskId?: string | null
  title: string
  fileUrl: string
  fileType: DocumentFileType
  storageProvider: 'local' | 's3' | 'cloudinary' | 'minio'
  sizeBytes?: number | null
  tags: string[]
  createdAt: string
  updatedAt: string
}
export type Page<T> = { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type DocumentFilters = { semesterId?: string; subjectId?: string; taskId?: string; tag?: string; fileType?: DocumentFileType; search?: string; page?: number; limit?: number }
export type DocumentInput = { title?: string; subjectId?: string | null; taskId?: string | null; tags?: string[] }
export type DocumentUploadInput = DocumentInput & { file: File }

function cleanParams(params: DocumentFilters) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

export async function listDocuments(params: DocumentFilters = {}) {
  return (await apiClient.get<ApiResponse<Page<DocumentItem>>>('/documents', { params: cleanParams(params) })).data.data
}

export async function uploadDocument(input: DocumentUploadInput, options: { signal?: AbortSignal; onProgress?: (loaded: number, total: number) => void } = {}) {
  const body = new FormData()
  body.append('file', input.file, input.file.name)
  if (input.title?.trim()) body.append('title', input.title.trim())
  if (input.subjectId) body.append('subjectId', input.subjectId)
  if (input.taskId) body.append('taskId', input.taskId)
  if (input.tags?.length) body.append('tags', input.tags.join(','))
  const response = await apiClient.post<ApiResponse<DocumentItem>>('/documents/upload', body, {
    signal: options.signal,
    onUploadProgress: (event: AxiosProgressEvent) => options.onProgress?.(event.loaded, event.total ?? input.file.size),
  })
  return response.data.data
}

export async function updateDocument(id: string, input: DocumentInput) {
  return (await apiClient.patch<ApiResponse<DocumentItem>>(`/documents/${id}`, input)).data.data
}

export async function deleteDocument(id: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/documents/${id}`)).data.data
}

export function documentDownloadUrl(id: string) {
  return apiClient.getUri({ url: `/documents/${id}/download` })
}

export function documentAssetUrl(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  if (!apiBaseUrl.startsWith('http')) return fileUrl
  return `${apiBaseUrl.replace(/\/api$/, '')}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`
}
