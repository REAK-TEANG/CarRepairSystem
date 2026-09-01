import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceReminderService } from '../services/serviceReminderService'
import { useToast } from '../context/ToastContext'

export function useServiceReminders(params = {}, options = {}) {
  return useQuery({
    queryKey: ['service_reminders', params],
    queryFn: () => serviceReminderService.getAll(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export function useCreateServiceReminder() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newReminder) => serviceReminderService.create(newReminder),
    onSuccess: () => {
      addToast('Next service reminder scheduled', 'success')
      queryClient.invalidateQueries({ queryKey: ['service_reminders'] })
    },
    onError: () => {
      addToast('Failed to schedule reminder', 'warning')
    },
  })
}

export function useUpdateServiceReminder() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => serviceReminderService.update(id, data),
    onSuccess: () => {
      addToast('Service reminder updated', 'success')
      queryClient.invalidateQueries({ queryKey: ['service_reminders'] })
    },
    onError: () => {
      addToast('Failed to update reminder', 'warning')
    },
  })
}

export function useDeleteServiceReminder() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => serviceReminderService.delete(id),
    onSuccess: () => {
      addToast('Service reminder removed', 'success')
      queryClient.invalidateQueries({ queryKey: ['service_reminders'] })
    },
    onError: () => {
      addToast('Failed to delete reminder', 'warning')
    },
  })
}
