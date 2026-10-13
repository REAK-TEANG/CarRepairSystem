import { apiClient } from '@/services/apiClient'

export const appointmentService = {
  async getAll(params = {}) {
    return apiClient.get('/appointments', { params })
  },

  async getById(id) {
    return apiClient.get(`/appointments/${id}`)
  },

  async create(payload) {
    return apiClient.post('/appointments', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/appointments/${id}`, payload)
  },

  async updateStatus(id, status) {
    return apiClient.patch(`/appointments/${id}/status`, { status })
  },

  async delete(id) {
    return apiClient.delete(`/appointments/${id}`)
  },
}
