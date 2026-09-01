import { apiClient } from './apiClient'

export const employeeService = {
  async getAll() {
    return apiClient.get('/employees')
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
