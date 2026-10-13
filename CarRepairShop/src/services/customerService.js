import { apiClient } from '@/services/apiClient'

export const customerService = {
  async getAll(params = {}) {
    return apiClient.get('/customers', { params })
  },

  async getById(id) {
    return apiClient.get(`/customers/${id}`)
  },

  async create(payload) {
    return apiClient.post('/customers', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/customers/${id}`, payload)
  },

  async delete(id) {
    return apiClient.delete(`/customers/${id}`)
  },
}
