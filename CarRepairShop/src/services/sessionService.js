import { apiClient } from './apiClient'

export const sessionService = {
  /**
   * Fetch all currently active and idle user sessions
   */
  async getActiveSessions() {
    const res = await apiClient.get('/sessions/active')
    return Array.isArray(res) ? res : (res?.data || [])
  },

  /**
   * Fetch paginated session history
   */
  async getSessionHistory(params = {}) {
    const res = await apiClient.get('/sessions/history', { params })
    return res || { sessions: [], pagination: {} }
  },

  /**
   * Send heartbeat telemetry ping
   */
  async sendHeartbeat(currentRoute = '/') {
    return await apiClient.post('/sessions/heartbeat', { currentRoute })
  },

  /**
   * Terminate/Revoke an active user session (Admin Kill Switch)
   */
  async revokeSession(sessionId) {
    return await apiClient.post('/sessions/revoke', { sessionId })
  },

  /**
   * Close session via beacon or keepalive fetch on page close
   */
  closeSessionBeacon(token, reason = 'window_close') {
    if (!token) return
    try {
      const url = `${apiClient.config.BASE_URL}/sessions/close`
      const data = JSON.stringify({ token, reason })
      
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' })
        const sent = navigator.sendBeacon(url, blob)
        if (sent) return
      }

      // Fallback to fetch with keepalive
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: data,
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Non-blocking cleanup
    }
  },
}

