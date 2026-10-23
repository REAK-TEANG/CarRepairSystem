import { createCrudService } from '@/services/crudService'
import { apiClient } from '@/services/apiClient'

const crud = createCrudService('/repair-orders')

export const repairJobService = {
  ...crud,
  async updateStatus(id, status) {
    return apiClient.patch(`/repair-orders/${id}/status`, { status })
  },
}

