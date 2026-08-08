import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './goals.api'

export const goalKeys = {
  all: ['goals'] as const,
  list: (filters: api.GoalFilters) => ['goals', filters] as const,
}

function useInvalidateGoals() {
  const client = useQueryClient()
  return (subjectId?: string | null) => {
    const invalidations = [
      client.invalidateQueries({ queryKey: goalKeys.all }),
      client.invalidateQueries({ queryKey: ['dashboard'] }),
    ]
    if (subjectId) invalidations.push(client.invalidateQueries({ queryKey: ['subject', subjectId] }))
    return Promise.all(invalidations)
  }
}

export function useGoalsQuery(filters: api.GoalFilters) {
  return useQuery({ queryKey: goalKeys.list(filters), queryFn: () => api.listGoals(filters) })
}

export function useGoalCreateMutation() {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: api.createGoal, onSuccess: (goal) => invalidate(goal.subjectId) })
}

export function useGoalUpdateMutation() {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<api.GoalInput> }) => api.updateGoal(id, input), onSuccess: (goal) => invalidate(goal.subjectId) })
}

export function useGoalArchiveMutation() {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: api.archiveGoal, onSuccess: (goal) => invalidate(goal.subjectId) })
}
