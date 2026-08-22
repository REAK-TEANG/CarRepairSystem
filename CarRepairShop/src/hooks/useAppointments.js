import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '../services/appointmentService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['appointments']

export function useAppointments() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => appointmentService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newApt) => appointmentService.create(newApt),
    onMutate: async (newApt) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const optimisticItem = {
        id: Date.now(),
        code: `APT-${String(previous.length + 1).padStart(3, '0')}`,
        status: 'Scheduled',
        ...newApt,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Appointment scheduled for ${newApt.customer}`, 'success')
      return { previous }
    },
    onError: (err, newApt, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to schedule appointment', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => appointmentService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast('Appointment updated', 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update appointment', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => appointmentService.updateStatus(id, 'Cancelled'),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, status: 'Cancelled' } : item))
      )
      addToast('Appointment cancelled', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to cancel appointment', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
