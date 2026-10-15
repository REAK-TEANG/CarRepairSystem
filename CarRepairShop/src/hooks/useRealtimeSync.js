import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

/**
 * Universal Real-Time Synchronization Hook
 * Provides seamless real-time cache synchronization across authorized browser clients.
 * Tier 1: WebSockets (Ratchet PHP daemon on port 8080 / WS proxy)
 * Tier 2: Server-Sent Events (SSE streaming at /api/events)
 * Tier 3: Resilient automatic reconnection with exponential backoff
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('disconnected') // 'websocket' | 'sse' | 'disconnected'
  const [lastEvent, setLastEvent] = useState(null)

  const wsRef = useRef(null)
  const sseRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)

  // Handle incoming event and invalidate relevant TanStack queries
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
    const token = localStorage.getItem('token') || ''
    if (!token) {
      return
    }

    let isUnmounted = false

    const connectSSE = () => {
      if (isUnmounted) return
      try {
        const sseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/events?token=${encodeURIComponent(token)}`
        const eventSource = new EventSource(sseUrl)
        sseRef.current = eventSource

        eventSource.onopen = () => {
          if (isUnmounted) return
          setIsConnected(true)
          setTransport('sse')
          reconnectAttemptsRef.current = 0
        }

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            handleIncomingEvent(data)
          } catch {
            // Heartbeats or comments
          }
        }

        // Specific named event listeners
        const topics = ['repair_jobs', 'inventory', 'appointments', 'invoices', 'customers', 'vehicles']
        topics.forEach((t) => {
          eventSource.addEventListener(t, (e) => {
            try {
              const data = JSON.parse(e.data)
              handleIncomingEvent(data)
            } catch {
              // Ignore parse error
            }
          })
        })

        eventSource.onerror = () => {
          eventSource.close()
          if (isUnmounted) return
          setIsConnected(false)
          setTransport('disconnected')
          // Retry SSE after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connectSSE, 5000)
        }
      } catch (err) {
        console.warn('[Realtime] SSE fallback error:', err)
      }
    }

    const connectWebSocket = () => {
      if (isUnmounted) return

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.hostname || 'localhost'
      const wsPort = import.meta.env.VITE_WS_PORT || 8080
      const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${wsHost}:${wsPort}?token=${encodeURIComponent(token)}`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (isUnmounted) return
          setIsConnected(true)
          setTransport('websocket')
          reconnectAttemptsRef.current = 0

          // Send auth & subscribe
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
            // Ignore non-json messages
          }
        }

        ws.onerror = () => {
          ws.close()
        }

        ws.onclose = () => {
          if (isUnmounted) return
          setIsConnected(false)
          setTransport('disconnected')

          reconnectAttemptsRef.current += 1
          if (reconnectAttemptsRef.current > 2) {
            connectSSE()
          } else {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 5000)
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay)
          }
        }
      } catch {
        connectSSE()
      }
    }

    // Initiate primary WebSocket connection
    connectWebSocket()

    return () => {
      isUnmounted = true
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [user, handleIncomingEvent])

  return { isConnected, transport, lastEvent }
}
