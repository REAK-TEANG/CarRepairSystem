import { apiClient } from '@/services/apiClient'

export const serviceCatalogService = {
  async getAll(params = {}) {
    return apiClient.get('/services', { params })
  },

  async getById(id) {
    return apiClient.get(`/services/${id}`)
  },

  async create(payload) {
    return apiClient.post('/services', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/services/${id}`, payload)
  },

  async delete(id) {
    return apiClient.delete(`/services/${id}`)
  },
}
