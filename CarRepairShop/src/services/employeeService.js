import { createCrudService } from '@/services/crudService'
import { apiClient } from '@/services/apiClient'

const crud = createCrudService('/employees')

export const employeeService = {
  ...crud,
  async toggleAttendance(id) {
    return apiClient.post(`/employees/${id}/toggle-attendance`)
  },
}

