import { apiClient } from './apiClient'

export const mechanicService = {
  async getAll() {
    return apiClient.get('/mechanics')
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
