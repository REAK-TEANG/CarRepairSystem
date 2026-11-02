import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '@/services/appointmentService'
import { createEntityHooks } from '@/hooks/createEntityHooks'
import { useToast } from '@/context/ToastContext'

const QUERY_KEY = ['appointments']

const hooks = createEntityHooks({
  queryKey: 'appointments',
  service: appointmentService,
  entityName: 'Appointment',
  createOptimistic: (newApt, previous = []) => ({
    id: Date.now(),
    code: `APT-${String((previous?.length || 0) + 1).padStart(3, '0')}`,
    status: 'Scheduled',
    ...newApt,
  }),
  messages: {
    createSuccess: (data) => `Appointment scheduled for ${data.customer}`,
    updateSuccess: 'Appointment updated',
  },
})

export const useAppointments = hooks.useList
export const useCreateAppointment = hooks.useCreate
export const useUpdateAppointment = hooks.useUpdate

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

