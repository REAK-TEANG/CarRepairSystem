import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairJobService } from '@/services/repairJobService'
import { useToast } from '@/context/ToastContext'

export function useRepairJobs(params = {}, options = {}) {
  return useQuery({
    queryKey: ['repair_jobs', params],
    queryFn: () => repairJobService.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

export function useCreateRepairJob() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newJob) => repairJobService.create(newJob),
    onMutate: async (newJob) => {
      await queryClient.cancelQueries({ queryKey: ['repair_jobs'] })
      const previous = queryClient.getQueryData(['repair_jobs', {}]) || []

      const optimisticItem = {
        id: Date.now(),
        orderNumber: `RO-2026-${String(previous.length + 1).padStart(4, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Pending',
        ...newJob,
      }

      queryClient.setQueryData(['repair_jobs', {}], [optimisticItem, ...previous])
      addToast(`Work Order ${optimisticItem.orderNumber} created (Stock automatically adjusted)`, 'success')
      return { previous }
    },
    onError: (err, newJob, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['repair_jobs', {}], context.previous)
      }
      addToast('Failed to create repair order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] })
    },
  })
}

export function useUpdateRepairJob() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => repairJobService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['repair_jobs'] })
      const previousEntries = queryClient.getQueriesData({ queryKey: ['repair_jobs'] })

      queryClient.setQueriesData({ queryKey: ['repair_jobs'] }, (old) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((item) => (item.id === id ? { ...item, ...data } : item))
        }
        if (Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((item) => (item.id === id ? { ...item, ...data } : item)),
          }
        }
        return old
      })

      addToast('Work order progress saved', 'success')
      return { previousEntries }
    },
    onError: (err, variables, context) => {
      if (context?.previousEntries) {
        context.previousEntries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData)
        })
      }
      addToast(err?.message || 'Failed to update work order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] })
    },
  })
}

export function useDeleteRepairJob() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => repairJobService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['repair_jobs'] })
      const previous = queryClient.getQueryData(['repair_jobs', {}]) || []

      queryClient.setQueryData(
        ['repair_jobs', {}],
        previous.filter((item) => item.id !== id)
      )
      addToast('Work order removed', 'success')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['repair_jobs', {}], context.previous)
      }
      addToast('Failed to delete work order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] })
    },
  })
}
