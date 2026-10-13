import { apiClient } from '@/services/apiClient'

export const employeeService = {
  async getAll(params = {}) {
    return apiClient.get('/employees', { params })
  },

  async getById(id) {
    return apiClient.get(`/employees/${id}`)
  },

  async create(payload) {
    return apiClient.post('/employees', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/employees/${id}`, payload)
  },

  async toggleAttendance(id) {
    return apiClient.post(`/employees/${id}/toggle-attendance`)
  },

  async delete(id) {
    return apiClient.delete(`/employees/${id}`)
  },
}
