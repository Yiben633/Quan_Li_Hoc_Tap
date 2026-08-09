import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type FlashcardSet = {
  id: string
  subjectId?: string | null
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count?: { flashcards: number }
}

export type Flashcard = {
  id: string
  flashcardSetId: string
  question: string
  answer: string
  isDifficult: boolean
  correctCount: number
  wrongCount: number
  nextReviewAt?: string | null
  createdAt: string
  updatedAt: string
  flashcardSet?: { id: string; name: string }
}

export type FlashcardSetDetail = FlashcardSet & { flashcards: Flashcard[] }
export type FlashcardSetInput = { subjectId?: string | null; name: string; description?: string | null }
export type FlashcardInput = { question: string; answer: string; isDifficult?: boolean }

export async function listSets() {
  return (await apiClient.get<ApiResponse<FlashcardSet[]>>('/flashcard-sets')).data.data
}

export async function getSet(id: string) {
  return (await apiClient.get<ApiResponse<FlashcardSetDetail>>(`/flashcard-sets/${id}`)).data.data
}

export async function createSet(input: FlashcardSetInput) {
  return (await apiClient.post<ApiResponse<FlashcardSet>>('/flashcard-sets', input)).data.data
}

export async function updateSet(id: string, input: Partial<FlashcardSetInput>) {
  return (await apiClient.patch<ApiResponse<FlashcardSet>>(`/flashcard-sets/${id}`, input)).data.data
}

export async function deleteSet(id: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/flashcard-sets/${id}`)).data.data
}

export async function createCard(setId: string, input: FlashcardInput) {
  return (await apiClient.post<ApiResponse<Flashcard>>(`/flashcard-sets/${setId}/flashcards`, input)).data.data
}

export async function updateCard(id: string, input: Partial<FlashcardInput>) {
  return (await apiClient.patch<ApiResponse<Flashcard>>(`/flashcards/${id}`, input)).data.data
}

export async function deleteCard(id: string) {
  return (await apiClient.delete<ApiResponse<{ id: string }>>(`/flashcards/${id}`)).data.data
}

export async function listDueCards() {
  return (await apiClient.get<ApiResponse<Flashcard[]>>('/flashcards/due')).data.data
}

export async function reviewCard(id: string, correct: boolean) {
  return (await apiClient.post<ApiResponse<Flashcard>>(`/flashcards/${id}/review`, { correct })).data.data
}
