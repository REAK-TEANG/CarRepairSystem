import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/services/apiClient'

/**
 * Universal Real-Time Synchronization Hook
 * Provides seamless real-time cache synchronization across authorized browser clients.
 * - Connects to WebSocket only when VITE_WS_URL is explicitly defined.
 * - Otherwise uses lightweight, non-blocking REST event polling (/api/events/poll):
 *   every 4s while events are flowing, backing off to 16s when idle, paused while the
 *   tab is hidden, and run immediately when the tab becomes visible again.
 */
const POLL_MIN_MS = 4000
const POLL_MAX_MS = 16000

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('disconnected') // 'websocket' | 'poll' | 'disconnected'
  const [lastEvent, setLastEvent] = useState(null)

  const wsRef = useRef(null)
  const pollTimerRef = useRef(null)
  const lastEventIdRef = useRef(0)
  const isPollingRef = useRef(false)
  const pollDelayRef = useRef(POLL_MIN_MS)

  // Invalidate relevant TanStack queries on events
  const handleIncomingEvent = useCallback(
    (eventData) => {
      if (!eventData || !eventData.topic) return
      setLastEvent(eventData)

      const topic = eventData.topic.toLowerCase()

      switch (topic) {
        case 'repair_jobs':
        case 'repairjobs':
          queryClient.invalidateQueries({ queryKey: ['repair_jobs'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['reports-summary'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['reports_summary'], exact: false })
          break

        case 'inventory':
        case 'spare_parts':
          queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['inventory_transactions'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
          break

        case 'appointments':
          queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
          break

        case 'invoices':
        case 'payments':
          queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['reports-summary'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['reports_summary'], exact: false })
          break

        case 'customers':
          queryClient.invalidateQueries({ queryKey: ['customers'], exact: false, refetchType: 'active' })
          break

        case 'vehicles':
          queryClient.invalidateQueries({ queryKey: ['vehicles'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['service_reminders'], exact: false })
          break

        case 'services':
        case 'services_catalog':
          queryClient.invalidateQueries({ queryKey: ['services'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['services_catalog'], exact: false })
          break

        case 'employees':
        case 'mechanics':
          queryClient.invalidateQueries({ queryKey: ['employees'], exact: false, refetchType: 'active' })
          queryClient.invalidateQueries({ queryKey: ['mechanics'], exact: false, refetchType: 'active' })
          break

        default:
          queryClient.invalidateQueries({ queryKey: [topic], exact: false, refetchType: 'active' })
          break
      }
    },
    [queryClient]
  )

  useEffect(() => {
    const token = apiClient.getToken()
    if (!token || !user) {
      return
    }

    let isUnmounted = false

    const poll = async () => {
      if (isUnmounted || isPollingRef.current) return
      isPollingRef.current = true
      try {
        const res = await apiClient.get('/events/poll', {
          params: { afterId: lastEventIdRef.current },
        })
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach((evt) => handleIncomingEvent(evt))
          pollDelayRef.current = POLL_MIN_MS
        } else {
          pollDelayRef.current = Math.min(Math.round(pollDelayRef.current * 1.5), POLL_MAX_MS)
        }
        if (res?.latestId) {
          lastEventIdRef.current = res.latestId
        }
      } catch {
        // Non-blocking catch
      } finally {
        isPollingRef.current = false
        // Hidden tabs stop polling; the visibility handler restarts it on return
        if (!isUnmounted && document.visibilityState === 'visible') {
          if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
          pollTimerRef.current = setTimeout(poll, pollDelayRef.current)
        }
      }
    }

    // Trigger immediate poll on window focus or tab visibility restore
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && !isUnmounted) {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        pollDelayRef.current = POLL_MIN_MS
        poll() // missed events invalidate exactly the queries they affect; stale data refetches on focus
      }
    }

    window.addEventListener('focus', handleFocusOrVisible)
    document.addEventListener('visibilitychange', handleFocusOrVisible)

    // Fallback: Non-blocking REST polling
    const startPolling = () => {
      if (isUnmounted) return
      setTransport('poll')
      setIsConnected(true)
      poll()
    }

    // Only attempt WebSocket if an explicit VITE_WS_URL is provided in environment
    const explicitWsUrl = import.meta.env.VITE_WS_URL
    if (explicitWsUrl) {
      try {
        const ws = new WebSocket(`${explicitWsUrl}?token=${encodeURIComponent(token)}`)
        wsRef.current = ws

        ws.onopen = () => {
          if (isUnmounted) return
          setIsConnected(true)
          setTransport('websocket')

          ws.send(JSON.stringify({ type: 'auth', token }))
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              topics: ['repair_jobs', 'inventory', 'appointments', 'invoices', 'customers', 'vehicles'],
            })
          )
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'event') {
              handleIncomingEvent(msg)
            }
          } catch {
            // ignore non-json
          }
        }

        ws.onerror = () => {
          ws.close()
        }

        ws.onclose = () => {
          if (isUnmounted) return
          setIsConnected(false)
          setTransport('disconnected')
          startPolling()
        }
      } catch {
        startPolling()
      }
    } else {
      startPolling()
    }

    return () => {
      isUnmounted = true
      window.removeEventListener('focus', handleFocusOrVisible)
      document.removeEventListener('visibilitychange', handleFocusOrVisible)
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [user, handleIncomingEvent, queryClient])

  return { isConnected, transport, lastEvent }
}
