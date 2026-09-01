import { apiClient } from './apiClient'

export const invoiceService = {
  async getAll() {
    return apiClient.get('/invoices')
  },

  async getById(id) {
    return apiClient.get(`/invoices/${id}`)
  },

  async create(payload) {
    return apiClient.post('/invoices', payload)
  },

  async update(id, payload) {
    return apiClient.put(`/invoices/${id}`, payload)
  },

  async recordPayment(id, { paidAmount, paymentMethod }) {
    return apiClient.post(`/invoices/${id}/payments`, { paidAmount, paymentMethod })
  },

  async delete(id) {
    return apiClient.delete(`/invoices/${id}`)
  },
}
