import { apiClient, API_CONFIG } from './apiClient'

export const reportService = {
  async getDashboardMetrics() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/reports/dashboard-metrics')
    }
    return Promise.resolve({
      netRevenue: '$3,131,021',
      monthlyArr: '$1,511,121',
      quarterlyGoal: '71%',
      newOrders: '18,221',
      weeklyVisits: '102k',
      totalProfit: '$136,755.77',
    })
  },

  async getRevenueReport(period = 'monthly') {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get(`/reports/revenue?period=${period}`)
    }
    return Promise.resolve([
      { month: 'Jan', revenue: 45000, profit: 18000 },
      { month: 'Feb', revenue: 52000, profit: 21000 },
      { month: 'Mar', revenue: 61000, profit: 27000 },
      { month: 'Apr', revenue: 58000, profit: 24000 },
      { month: 'May', revenue: 72000, profit: 33000 },
      { month: 'Jun', revenue: 84000, profit: 39000 },
    ])
  },
}
