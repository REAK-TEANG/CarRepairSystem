import { apiClient } from '@/services/apiClient'

export const mechanicService = {
  async getAll(params = {}) {
    return apiClient.get('/mechanics', { params })
  },

  async getById(id) {
    return apiClient.get(`/mechanics/${id}`)
  },

  async create(payload) {
    return apiClient.post('/mechanics', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/mechanics/${id}`, payload)
  },

  async delete(id) {
    return apiClient.delete(`/mechanics/${id}`)
  },
}
