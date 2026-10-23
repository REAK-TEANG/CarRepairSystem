import { createCrudService } from '@/services/crudService'
import { apiClient } from '@/services/apiClient'

const crud = createCrudService('/invoices')

export const invoiceService = {
  ...crud,
  async recordPayment(id, { paidAmount, paymentMethod }) {
    return apiClient.post(`/invoices/${id}/payments`, { paidAmount, paymentMethod })
  },
}

