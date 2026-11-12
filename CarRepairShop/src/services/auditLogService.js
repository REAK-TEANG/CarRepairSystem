import { apiClient } from './apiClient'

export const auditLogService = {
  /**
   * Fetch paginated and filtered audit logs
   */
  async getLogs(params = {}) {
    const res = await apiClient.get('/audit-logs', { params })
    return res || { logs: [], pagination: {} }
  },

  /**
   * Fetch summary statistics for audit activity
   */
  async getStats() {
    const res = await apiClient.get('/audit-logs/stats')
    return res?.data || res || {}
  },

  /**
   * Trigger direct CSV or JSON export download
   */
  exportLogs(format = 'csv', filters = {}) {
    const token = apiClient.getToken()
    const searchParams = new URLSearchParams()
    searchParams.append('format', format)

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        searchParams.append(k, v)
      }
    })

    const url = `${apiClient.config.BASE_URL}/audit-logs/export?${searchParams.toString()}`

    // Fetch blob with Authorization header to trigger secure download
    fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to export audit logs')
        return res.blob()
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)
      })
      .catch((err) => {
        console.error('Export audit logs failed:', err)
      })
  },
}

