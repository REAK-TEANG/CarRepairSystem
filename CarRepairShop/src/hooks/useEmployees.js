import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import { createEntityHooks } from '@/hooks/createEntityHooks'
import { useToast } from '@/context/ToastContext'

const QUERY_KEY = ['employees']

const hooks = createEntityHooks({
  queryKey: 'employees',
  service: employeeService,
  entityName: 'Employee',
  createOptimistic: (newEmp, previous = []) => ({
    id: Date.now(),
    employeeCode: `EMP-${String((previous?.length || 0) + 1).padStart(3, '0')}`,
    attendanceStatus: 'Present',
    status: 'Active',
    salary: Number(newEmp.salary) || 3500,
    hireDate: newEmp.hireDate || new Date().toISOString().split('T')[0],
    ...newEmp,
  }),
  messages: {
    createSuccess: (data) => `Employee "${data.name}" added`,
    updateSuccess: 'Employee profile updated',
    deleteSuccess: 'Employee removed from staff roster',
  },
})

export const useEmployees = hooks.useList
export const useCreateEmployee = hooks.useCreate
export const useUpdateEmployee = hooks.useUpdate
export const useDeleteEmployee = hooks.useDelete

export function useToggleAttendance() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => employeeService.toggleAttendance(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      let newStatus = 'Present'
      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => {
          if (item.id === id) {
            newStatus = item.attendanceStatus === 'Present' ? 'On Leave' : 'Present'
            return { ...item, attendanceStatus: newStatus }
          }
          return item
        })
      )
      addToast(`Attendance updated: ${newStatus}`, 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to toggle attendance', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

