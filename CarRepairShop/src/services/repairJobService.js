import { apiClient } from '@/services/apiClient'

export const repairJobService = {
  async getAll(params = {}) {
    return apiClient.get('/repair-orders', { params })
  },

  async getById(id) {
    return apiClient.get(`/repair-orders/${id}`)
  },

  async create(payload) {
    return apiClient.post('/repair-orders', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/repair-orders/${id}`, payload)
  },

  async updateStatus(id, status) {
    return apiClient.patch(`/repair-orders/${id}/status`, { status })
  },

  async delete(id) {
    return apiClient.delete(`/repair-orders/${id}`)
  },
}
