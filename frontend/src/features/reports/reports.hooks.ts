import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from './reports.api'

export const reportKeys = {
  all: ['reports'] as const,
  detail: (filters: api.ReportFilters) => ['reports', filters] as const,
}

export function useReportQuery(filters: api.ReportFilters) {
  return useQuery({ queryKey: reportKeys.detail(filters), queryFn: () => api.getReport(filters) })
}

export function useReportExportMutation() {
  return useMutation({ mutationFn: api.exportReport })
}
