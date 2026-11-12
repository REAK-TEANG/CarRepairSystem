import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventoryService'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

const QUERY_KEY = ['inventory']

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

function updateListWithUpdate(oldData, id, updater) {
  if (!oldData) return oldData
  if (Array.isArray(oldData)) {
    return oldData.map((item) => (item.id === id ? updater(item) : item))
  }
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: oldData.data.map((item) => (item.id === id ? updater(item) : item)),
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

export function useInventory(params = {}, options = {}) {
  const auth = useAuth()
  const hasPermission = auth.can ? auth.can('inventory', 'read') : true
  const isEnabled = (options.enabled ?? true) && hasPermission

  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryService.getAll(params),
    placeholderData: (previousData) => previousData,
    ...options,
    enabled: isEnabled,
  })
}

export function useCreatePart() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newPart) => inventoryService.create(newPart),
    onMutate: async (newPart) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })

      const qty = Number(newPart.stockQty) || 0
      const min = Number(newPart.minThreshold) || 5
      const optimisticItem = {
        id: Date.now(),
        partCode: newPart.partCode || `PRT-GEN-${Date.now().toString().slice(-4)}`,
        stockQty: qty,
        minThreshold: min,
        unitPrice: Number(newPart.unitPrice) || 0,
        status: qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock',
        ...newPart,
      }

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithInsert(old, optimisticItem)
      )
      addToast(`Part "${newPart.name}" added to inventory`, 'success')
      return { previousSnapshots }
    },
    onError: (err, newPart, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to add part to inventory', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
    },
  })
}

export function useUpdatePart() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => inventoryService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithUpdate(old, id, (item) => ({ ...item, ...data }))
      )
      addToast('Spare part updated', 'success')
      return { previousSnapshots }
    },
    onError: (err, variables, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to update part', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, quantity, type, notes }) =>
      inventoryService.adjustStock(id, { quantity, type, notes }),
    onMutate: async ({ id, quantity, type }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })
      const delta = Number(quantity) || 0

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithUpdate(old, id, (item) => {
          let newQty = item.stockQty
          if (type === 'Stock In') newQty += delta
          else if (type === 'Stock Out') newQty = Math.max(0, newQty - delta)
          else if (type === 'Adjustment') newQty = delta
          const min = item.minThreshold
          const status = newQty === 0 ? 'Out of Stock' : newQty <= min ? 'Low Stock' : 'In Stock'
          return { ...item, stockQty: newQty, status }
        })
      )
      addToast(`${type} completed: ${quantity} units`, 'success')
      return { previousSnapshots }
    },
    onError: (err, variables, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to adjust stock', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
    },
  })
}

export function useDeletePart() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => inventoryService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithDelete(old, id)
      )
      addToast('Part removed from inventory', 'info')
      return { previousSnapshots }
    },
    onError: (err, id, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to delete part', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
    },
  })
}

export function useInventoryTransactions(options = {}) {
  return useQuery({
    queryKey: ['inventory_transactions'],
    queryFn: () => inventoryService.getTransactions(),
    ...options,
  })
}
