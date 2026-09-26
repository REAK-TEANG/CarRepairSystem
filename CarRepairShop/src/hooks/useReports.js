import { useQuery } from '@tanstack/react-query'
import { reportService } from '../services/reportService'
import { apiClient } from '../services/apiClient'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => reportService.getDashboardMetrics(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export function useReports() {
  return useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => apiClient.get('/reports'),
  })
}
