import { apiClient } from './apiClient'

export const inventoryService = {
  async getAll() {
    return apiClient.get('/spare-parts')
  },

  async getTransactions() {
    return apiClient.get('/spare-parts/transactions')
  },

  async getById(id) {
    return apiClient.get(`/spare-parts/${id}`)
  },

  async create(payload) {
    return apiClient.post('/spare-parts', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/spare-parts/${id}`, payload)
  },

  async adjustStock(id, { quantity, type, notes }) {
    return apiClient.post(`/spare-parts/${id}/adjust`, { quantity, type, notes })
  },

  async delete(id) {
    return apiClient.delete(`/spare-parts/${id}`)
  },
}
