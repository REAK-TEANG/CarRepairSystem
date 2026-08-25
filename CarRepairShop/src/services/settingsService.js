import { apiClient, API_CONFIG } from './apiClient'

export const initialWorkshopSettings = {
  shopName: 'Pro Auto Repair Workshop',
  taxRate: 8.5,
  currency: 'USD ($)',
  businessHours: 'Mon-Sat: 08:00 - 18:00',
  contactPhone: '+1 (555) 019-2834',
  contactEmail: 'contact@autorepairpro.com',
  address: '742 Evergreen Terrace, Springfield',
  autoBackupDaily: true,
}

export const settingsService = {
  async getSettings() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/settings')
    }
    return Promise.resolve(initialWorkshopSettings)
  },

  async updateSettings(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put('/settings', payload)
    }
    return Promise.resolve({ ...initialWorkshopSettings, ...payload })
  },

  async getPermissionsMatrix() {
    if (API_CONFIG.USE_REAL_API) {
      const res = await apiClient.get('/settings/permissions')
      return res?.data || res
    }
    return Promise.resolve(null)
  },

  async updatePermissionsMatrix(matrix) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put('/settings/permissions', matrix)
    }
    return Promise.resolve({ success: true, data: matrix })
  },
}

