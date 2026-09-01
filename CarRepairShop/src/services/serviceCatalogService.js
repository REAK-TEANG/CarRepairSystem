import { apiClient } from './apiClient'

export const serviceCatalogService = {
  async getAll() {
    return apiClient.get('/services')
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
