import { createCrudService } from '@/services/crudService'
import { apiClient } from '@/services/apiClient'

const crud = createCrudService('/appointments')

export const appointmentService = {
  ...crud,
  async updateStatus(id, status) {
    return apiClient.patch(`/appointments/${id}/status`, { status })
  },
}

