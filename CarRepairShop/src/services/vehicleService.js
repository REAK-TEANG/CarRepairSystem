import { apiClient } from './apiClient'

export const vehicleService = {
  async getAll(params = {}) {
    const queryStr = params?.customerId ? `?customerId=${encodeURIComponent(params.customerId)}` : ''
    return apiClient.get(`/vehicles${queryStr}`)
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
