import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/services/apiClient'
import { sessionService } from '@/services/sessionService'
import { useToast } from '@/context/ToastContext'

/**
 * Global telemetry hook: sends heartbeats, tracks active route,
 * records session close on pagehide/beforeunload, and catches session revocation.
 */
export function useSessionTracker() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { showToast } = useToast()
  const lastPingRouteRef = useRef(null)

  // 1. Heartbeat on route change and periodic interval (every 45s)
  useEffect(() => {
    if (!user) return

    const sendPing = async () => {
      try {
        const token = apiClient.getToken()
        if (!token) return
        await sessionService.sendHeartbeat(location.pathname)
        lastPingRouteRef.current = location.pathname
      } catch (err) {
        if (err?.status === 401 && err?.data?.code === 'SESSION_REVOKED') {
          showToast?.('Your session was terminated by an administrator', 'error')
          logout?.()
        }
      }
    }

    // Immediate ping on route change if changed
    if (lastPingRouteRef.current !== location.pathname) {
      sendPing()
    }

    const interval = setInterval(sendPing, 45000)
    return () => clearInterval(interval)
  }, [user, location.pathname, logout, showToast])

  // 2. Window unload / close detection using navigator.sendBeacon
  useEffect(() => {
    if (!user) return

    const handleUnload = () => {
      const token = apiClient.getToken()
      if (token) {
        sessionService.closeSessionBeacon(token, 'window_close')
      }
    }

    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('pagehide', handleUnload)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user])

  // 3. Catch global session expiration or revocation event
  useEffect(() => {
    const handleAuthExpired = (e) => {
      const msg = e?.detail?.message || 'Session expired or terminated'
      showToast?.(msg, 'warning')
      logout?.()
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [logout, showToast])
}

