import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['employees']

export function useEmployees() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => employeeService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newEmp) => employeeService.create(newEmp),
    onMutate: async (newEmp) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const optimisticItem = {
        id: Date.now(),
        employeeCode: `EMP-${String(previous.length + 1).padStart(3, '0')}`,
        attendanceStatus: 'Present',
        status: 'Active',
        salary: Number(newEmp.salary) || 3500,
        hireDate: newEmp.hireDate || new Date().toISOString().split('T')[0],
        ...newEmp,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Employee "${newEmp.name}" added`, 'success')
      return { previous }
    },
    onError: (err, newEmp, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to add employee', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => employeeService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast('Employee profile updated', 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update employee', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

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

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => employeeService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.filter((item) => item.id !== id)
      )
      addToast('Employee removed from staff roster', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to delete employee', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
