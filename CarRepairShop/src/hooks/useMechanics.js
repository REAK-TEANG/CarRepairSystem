import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mechanicService } from '../services/mechanicService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['mechanics']

export function useMechanics() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => mechanicService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMechanic() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newMechanic) => mechanicService.create(newMechanic),
    onMutate: async (newMechanic) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const optimisticItem = {
        id: Date.now(),
        code: `MEC-${String(previous.length + 1).padStart(3, '0')}`,
        activeJobs: 0,
        completedJobs: 0,
        rating: 5.0,
        status: 'Active',
        ...newMechanic,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Mechanic "${newMechanic.name}" added to roster`, 'success')
      return { previous }
    },
    onError: (err, newMechanic, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to add mechanic', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => mechanicService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast('Mechanic profile updated', 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update mechanic', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteMechanic() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => mechanicService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.filter((item) => item.id !== id)
      )
      addToast('Mechanic removed from roster', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to delete mechanic', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
