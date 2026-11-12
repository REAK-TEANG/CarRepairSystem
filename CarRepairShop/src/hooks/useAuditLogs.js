import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/auditLogService'

export const AUDIT_KEYS = {
  all: ['audit-logs'],
  list: (filters) => [...AUDIT_KEYS.all, 'list', filters],
  stats: () => [...AUDIT_KEYS.all, 'stats'],
}

/**
 * Fetch paginated audit logs with search, user, module, and date filters
 */
export function useAuditLogs(filters = {}, options = {}) {
  return useQuery({
    queryKey: AUDIT_KEYS.list(filters),
    queryFn: () => auditLogService.getLogs(filters),
    staleTime: 10000,
    ...options,
  })
}

/**
 * Fetch summary stats for audit logs
 */
export function useAuditStats(options = {}) {
  return useQuery({
    queryKey: AUDIT_KEYS.stats(),
    queryFn: () => auditLogService.getStats(),
    staleTime: 30000,
    ...options,
  })
}

