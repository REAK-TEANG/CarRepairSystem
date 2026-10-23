import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/services/apiClient'

/**
 * Universal Real-Time Synchronization Hook
 * Provides seamless real-time cache synchronization across authorized browser clients.
 * - Connects to WebSocket only when VITE_WS_URL is explicitly defined.
 * - Otherwise uses lightweight, non-blocking REST event polling (/api/events/poll)
 *   to avoid single-threaded PHP web server hangs and ERR_CONNECTION_REFUSED console noise.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('disconnected') // 'websocket' | 'poll' | 'disconnected'
  const [lastEvent, setLastEvent] = useState(null)

  const wsRef = useRef(null)
  const pollTimerRef = useRef(null)
  const lastEventIdRef = useRef(0)

  // Invalidate relevant TanStack queries on events
  const handleIncomingEvent = useCallback((eventData) => {
    if (!eventData || !eventData.topic) return
    setLastEvent(eventData)

    const topic = eventData.topic.toLowerCase()

    switch (topic) {
      case 'repair_jobs':
      case 'repairjobs':
        queryClient.invalidateQueries({ queryKey: ['repair_jobs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
        queryClient.invalidateQueries({ queryKey: ['reports_summary'] })
        break

      case 'inventory':
      case 'spare_parts':
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] })
        break

      case 'appointments':
        queryClient.invalidateQueries({ queryKey: ['appointments'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
        break

      case 'invoices':
      case 'payments':
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
        queryClient.invalidateQueries({ queryKey: ['reports_summary'] })
        break

      case 'customers':
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        break

      case 'vehicles':
        queryClient.invalidateQueries({ queryKey: ['vehicles'] })
        break

      default:
        queryClient.invalidateQueries({ queryKey: [topic] })
        break
    }
  }, [queryClient])

  useEffect(() => {
    const token = apiClient.getToken()
    if (!token || !user) {
      return
    }

    let isUnmounted = false

    // Fallback: Non-blocking REST polling
    const startPolling = () => {
      if (isUnmounted) return
      setTransport('poll')
      setIsConnected(true)

      const poll = async () => {
        if (isUnmounted) return
        try {
          const res = await apiClient.get('/events/poll', {
            params: { afterId: lastEventIdRef.current }
          })
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            res.data.forEach((evt) => handleIncomingEvent(evt))
          }
          if (res?.latestId) {
            lastEventIdRef.current = res.latestId
          }
        } catch {
          // Non-blocking catch
        } finally {
          if (!isUnmounted) {
            pollTimerRef.current = setTimeout(poll, 15000)
          }
        }
      }

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
          ws.send(JSON.stringify({
            type: 'subscribe',
            topics: ['repair_jobs', 'inventory', 'appointments', 'invoices', 'customers', 'vehicles']
          }))
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
      // In local dev without standalone WebSocket daemon, use REST polling directly
      startPolling()
    }

    return () => {
      isUnmounted = true
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [user, handleIncomingEvent])

  return { isConnected, transport, lastEvent }
}
