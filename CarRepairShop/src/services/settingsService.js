import { apiClient } from './apiClient'

export const settingsService = {
  async getSettings() {
    return apiClient.get('/settings')
  },

  async updateSettings(payload) {
    return apiClient.put('/settings', payload)
  },

  async getPermissionsMatrix() {
    const res = await apiClient.get('/settings/permissions')
    return res?.data || res
  },

  async updatePermissionsMatrix(matrix) {
    return apiClient.put('/settings/permissions', matrix)
  },
}
