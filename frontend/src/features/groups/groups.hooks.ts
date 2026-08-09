import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './groups.api'

export const groupKeys = {
  all: ['study-groups'] as const,
  invitations: ['study-groups', 'invitations'] as const,
  detail: (id: string) => ['study-groups', id] as const,
  progress: (id: string) => ['study-groups', id, 'progress'] as const,
}

export function useGroupsQuery() { return useQuery({ queryKey: groupKeys.all, queryFn: api.listGroups }) }
export function useGroupInvitationsQuery() { return useQuery({ queryKey: groupKeys.invitations, queryFn: api.listInvitations, refetchInterval: 15_000, refetchOnWindowFocus: true }) }
export function useGroupQuery(id: string) { return useQuery({ queryKey: groupKeys.detail(id), queryFn: () => api.getGroup(id), enabled: Boolean(id) }) }
export function useGroupProgressQuery(id: string) { return useQuery({ queryKey: groupKeys.progress(id), queryFn: () => api.getGroupProgress(id), enabled: Boolean(id) }) }

function useInvalidateGroup() {
  const client = useQueryClient()
  return (id?: string) => Promise.all([
    client.invalidateQueries({ queryKey: groupKeys.all }),
    client.invalidateQueries({ queryKey: groupKeys.invitations }),
    client.invalidateQueries({ queryKey: ['notifications'] }),
    ...(id ? [client.invalidateQueries({ queryKey: groupKeys.detail(id) }), client.invalidateQueries({ queryKey: groupKeys.progress(id) })] : []),
  ])
}

export function useGroupCreateMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: api.createGroup, onSuccess: () => invalidate() }) }
export function useGroupUpdateMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.GroupInput> }) => api.updateGroup(id, input), onSuccess: (group) => invalidate(group.id) }) }
export function useGroupDeleteMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: api.deleteGroup, onSuccess: () => invalidate() }) }
export function useGroupInviteMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ id, email }: { id: string; email: string }) => api.inviteMember(id, email), onSuccess: (_member, variables) => invalidate(variables.id) }) }
export function useInvitationAcceptMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) => api.acceptInvitation(groupId, memberId), onSuccess: (_member, variables) => invalidate(variables.groupId) }) }
export function useInvitationRejectMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) => api.rejectInvitation(groupId, memberId), onSuccess: (_member, variables) => invalidate(variables.groupId) }) }
export function useGroupTaskCreateMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ groupId, input }: { groupId: string; input: api.GroupTaskInput }) => api.createGroupTask(groupId, input), onSuccess: (_task, variables) => invalidate(variables.groupId) }) }
export function useGroupTaskUpdateMutation() { const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: ({ groupId, taskId, input }: { groupId: string; taskId: string; input: Partial<api.GroupTaskInput> }) => api.updateGroupTask(groupId, taskId, input), onSuccess: (_task, variables) => invalidate(variables.groupId) }) }
