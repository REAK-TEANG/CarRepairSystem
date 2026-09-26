import { apiClient } from './apiClient'

export const reportService = {
  async getDashboardMetrics() {
    return apiClient.get('/reports/dashboard-metrics')
  },

  async getRevenueReport(period = 'monthly') {
    return apiClient.get(`/reports/revenue?period=${period}`)
  },
}
