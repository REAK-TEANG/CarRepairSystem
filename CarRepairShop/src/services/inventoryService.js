import { createCrudService } from '@/services/crudService'
import { apiClient } from '@/services/apiClient'

const crud = createCrudService('/spare-parts')

export const inventoryService = {
  ...crud,
  async getTransactions() {
    return apiClient.get('/spare-parts/transactions')
  },

  async adjustStock(id, { quantity, type, notes }) {
    return apiClient.post(`/spare-parts/${id}/adjust`, { quantity, type, notes })
  },
}

