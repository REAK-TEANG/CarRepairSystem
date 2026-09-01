import { apiClient } from './apiClient'

export const supplierService = {
  async getAll() {
    return apiClient.get('/suppliers')
  },

  async getById(id) {
    return apiClient.get(`/suppliers/${id}`)
  },

  async create(payload) {
    return apiClient.post('/suppliers', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/suppliers/${id}`, payload)
  },

  async delete(id) {
    return apiClient.delete(`/suppliers/${id}`)
  },
}
