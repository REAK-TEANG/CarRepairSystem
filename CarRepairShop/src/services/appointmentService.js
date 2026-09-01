import { apiClient } from './apiClient'

export const appointmentService = {
  async getAll(params = {}) {
    const queryStr = params?.date ? `?date=${encodeURIComponent(params.date)}` : ''
    return apiClient.get(`/appointments${queryStr}`)
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
