import { apiClient } from '@/services/apiClient'

export const vehicleService = {
  async getAll(params = {}) {
    return apiClient.get('/vehicles', { params })
  },

  async getById(id) {
    return apiClient.get(`/vehicles/${id}`)
  },

  async create(payload) {
    return apiClient.post('/vehicles', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/vehicles/${id}`, payload)
  },

  async delete(id) {
    return apiClient.delete(`/vehicles/${id}`)
  },
}
