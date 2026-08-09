import apiClient from '../../services/apiClient'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type GroupTaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'
export type GroupMemberStatus = 'pending' | 'accepted' | 'rejected'

export type StudyGroupListItem = {
  id: string
  ownerId: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count: { members: number; tasks: number }
}

export type GroupMember = {
  id: string
  role: 'leader' | 'member'
  status: GroupMemberStatus
  joinedAt?: string | null
  user: { id: string; fullName: string; avatarUrl?: string | null }
}

export type GroupTask = {
  id: string
  studyGroupId: string
  assignedUserId?: string | null
  title: string
  description?: string | null
  dueDate?: string | null
  status: GroupTaskStatus
  createdAt: string
  updatedAt: string
}

export type StudyGroupDetail = Omit<StudyGroupListItem, '_count'> & { members: GroupMember[]; tasks: GroupTask[] }
export type GroupProgress = { groupId: string; totalTasks: number; doneTasks: number; progressPercent: number }
export type GroupInvitation = {
  id: string
  role: 'leader' | 'member'
  status: 'pending'
  studyGroup: { id: string; name: string; description?: string | null; owner: { id: string; fullName: string; avatarUrl?: string | null } }
}

export type GroupInput = { name: string; description?: string | null }
export type GroupTaskInput = { title: string; description?: string | null; assignedUserId?: string | null; dueDate?: string | null; status?: GroupTaskStatus }

export async function listGroups() { return (await apiClient.get<ApiResponse<StudyGroupListItem[]>>('/study-groups')).data.data }
export async function listInvitations() { return (await apiClient.get<ApiResponse<GroupInvitation[]>>('/study-groups/invitations')).data.data }
export async function getGroup(id: string) { return (await apiClient.get<ApiResponse<StudyGroupDetail>>(`/study-groups/${id}`)).data.data }
export async function getGroupProgress(id: string) { return (await apiClient.get<ApiResponse<GroupProgress>>(`/study-groups/${id}/progress`)).data.data }
export async function createGroup(input: GroupInput) { return (await apiClient.post<ApiResponse<StudyGroupDetail>>('/study-groups', input)).data.data }
export async function updateGroup(id: string, input: Partial<GroupInput>) { return (await apiClient.patch<ApiResponse<StudyGroupDetail>>(`/study-groups/${id}`, input)).data.data }
export async function deleteGroup(id: string) { return (await apiClient.delete<ApiResponse<{ id: string }>>(`/study-groups/${id}`)).data.data }
export async function inviteMember(id: string, email: string) { return (await apiClient.post<ApiResponse<GroupMember>>(`/study-groups/${id}/members`, { email })).data.data }
export async function acceptInvitation(groupId: string, memberId: string) { return (await apiClient.post<ApiResponse<GroupMember>>(`/study-groups/${groupId}/members/${memberId}/accept`)).data.data }
export async function rejectInvitation(groupId: string, memberId: string) { return (await apiClient.post<ApiResponse<GroupMember>>(`/study-groups/${groupId}/members/${memberId}/reject`)).data.data }
export async function createGroupTask(groupId: string, input: GroupTaskInput) { return (await apiClient.post<ApiResponse<GroupTask>>(`/study-groups/${groupId}/tasks`, input)).data.data }
export async function updateGroupTask(groupId: string, taskId: string, input: Partial<GroupTaskInput>) { return (await apiClient.patch<ApiResponse<GroupTask>>(`/study-groups/${groupId}/tasks/${taskId}`, input)).data.data }
