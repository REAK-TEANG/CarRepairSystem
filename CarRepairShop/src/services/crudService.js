import { apiClient } from '@/services/apiClient'

/**
 * Creates a standard CRUD service for a given API endpoint.
 * Use for resources that only need the standard REST pattern.
 * For resources with extra domain methods, write the service manually.
 *
 * @param {string} endpoint - e.g. '/customers'
 * @returns {{ getAll, getById, create, update, delete }}
 */
export function createCrudService(endpoint) {
  return {
    async getAll(params = {}) {
      return apiClient.get(endpoint, { params })
    },
    async getById(id) {
      return apiClient.get(endpoint + '/' + id)
    },
    async create(payload) {
      return apiClient.post(endpoint, payload)
    },
    async update(id, payload) {
      return apiClient.put(endpoint + '/' + id, payload)
    },
    async delete(id) {
      return apiClient.delete(endpoint + '/' + id)
    },
  }
}