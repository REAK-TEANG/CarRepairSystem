import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairJobService } from '@/services/repairJobService'
import { useToast } from '@/context/ToastContext'

function updateListWithInsert(oldData, newItem) {
  if (!oldData) return [newItem]
  if (Array.isArray(oldData)) {
    return [newItem, ...oldData]
  }
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: [newItem, ...oldData.data],
      pagination: oldData.pagination
        ? {
            ...oldData.pagination,
            total: (Number(oldData.pagination.total) || 0) + 1,
          }
        : oldData.pagination,
    }
  }
  return oldData
}

function updateListWithUpdate(oldData, id, data) {
  if (!oldData) return oldData
  if (Array.isArray(oldData)) {
    return oldData.map((item) => (item.id === id ? { ...item, ...data } : item))
  }
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: oldData.data.map((item) => (item.id === id ? { ...item, ...data } : item)),
    }
  }
  return oldData
}

function updateListWithDelete(oldData, id) {
  if (!oldData) return oldData
  if (Array.isArray(oldData)) {
    return oldData.filter((item) => item.id !== id)
  }
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: oldData.data.filter((item) => item.id !== id),
      pagination: oldData.pagination
        ? {
            ...oldData.pagination,
            total: Math.max(0, (Number(oldData.pagination.total) || 1) - 1),
          }
        : oldData.pagination,
    }
  }
  return oldData
}

export function useRepairJobs(params = {}, options = {}) {
  return useQuery({
    queryKey: ['repair_jobs', params],
    queryFn: () => repairJobService.getAll(params),
    placeholderData: (previousData) => previousData,
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
      const previousSnapshots = queryClient.getQueriesData({ queryKey: ['repair_jobs'] })

      const optimisticItem = {
        id: Date.now(),
        orderNumber: `RO-2026-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Pending',
        ...newJob,
      }

      queryClient.setQueriesData({ queryKey: ['repair_jobs'] }, (old) =>
        updateListWithInsert(old, optimisticItem)
      )
      return { previousSnapshots }
    },
    onError: (err, newJob, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData)
        })
      }
      addToast('Failed to create repair order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
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
      const previousSnapshots = queryClient.getQueriesData({ queryKey: ['repair_jobs'] })

      queryClient.setQueriesData({ queryKey: ['repair_jobs'] }, (old) =>
        updateListWithUpdate(old, id, data)
      )

      addToast('Work order progress saved', 'success')
      return { previousSnapshots }
    },
    onError: (err, variables, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData)
        })
      }
      addToast(err?.message || 'Failed to update work order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
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
      const previousSnapshots = queryClient.getQueriesData({ queryKey: ['repair_jobs'] })

      queryClient.setQueriesData({ queryKey: ['repair_jobs'] }, (old) =>
        updateListWithDelete(old, id)
      )
      addToast('Work order removed', 'success')
      return { previousSnapshots }
    },
    onError: (err, id, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData)
        })
      }
      addToast('Failed to delete work order', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repair_jobs'], exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'], exact: false })
    },
  })
}
