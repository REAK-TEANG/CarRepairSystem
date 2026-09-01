import { apiClient } from './apiClient'

export const serviceReminderService = {
  async getAll(params = {}) {
    return apiClient.get('/service-reminders', { params })
  },

  async create(reminderData) {
    return apiClient.post('/service-reminders', reminderData)
  },

  async update(id, data) {
    return apiClient.put(`/service-reminders/${id}`, data)
  },

  async delete(id) {
    return apiClient.delete(`/service-reminders/${id}`)
  },
}
