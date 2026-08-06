import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getProgressChart } from './dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  chart: (range: 'week' | 'month') => [...dashboardKeys.all, 'chart', range] as const,
}

export function useDashboardSummaryQuery() {
  return useQuery({ queryKey: dashboardKeys.summary(), queryFn: getDashboardSummary, staleTime: 30_000 })
}

export function useProgressChartQuery(range: 'week' | 'month') {
  return useQuery({ queryKey: dashboardKeys.chart(range), queryFn: () => getProgressChart(range), staleTime: 30_000 })
}
