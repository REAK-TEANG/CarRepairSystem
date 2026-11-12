import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '@/services/sessionService'
import { useToast } from '@/context/ToastContext'

export const SESSION_KEYS = {
  all: ['user-sessions'],
  active: () => [...SESSION_KEYS.all, 'active'],
  history: (params) => [...SESSION_KEYS.all, 'history', params],
}

/**
 * Fetch all currently active and idle user sessions
 */
export function useActiveSessions(options = {}) {
  return useQuery({
    queryKey: SESSION_KEYS.active(),
    queryFn: () => sessionService.getActiveSessions(),
    refetchInterval: 30000, // React Query pauses this while the tab is hidden
    staleTime: 15000,
    ...options,
  })
}

/**
 * Fetch paginated session history
 */
export function useSessionHistory(params = {}, options = {}) {
  return useQuery({
    queryKey: SESSION_KEYS.history(params),
    queryFn: () => sessionService.getSessionHistory(params),
    staleTime: 10000,
    ...options,
  })
}

/**
 * Revoke an active user session (Admin Kill Switch)
 */
export function useRevokeSession() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (sessionId) => sessionService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all })
      showToast('Session terminated successfully', 'success')
    },
    onError: (err) => {
      const msg = err?.data?.message || err.message || 'Failed to terminate session'
      showToast(msg, 'error')
    },
  })
}

