import { apiClient } from './apiClient'

export const customerService = {
  async getAll(params = {}) {
    const queryStr = params?.search ? `?search=${encodeURIComponent(params.search)}` : ''
    return apiClient.get(`/customers${queryStr}`)
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
