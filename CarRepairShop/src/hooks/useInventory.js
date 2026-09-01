import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../services/inventoryService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['inventory']

export function useInventory(options = {}) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => inventoryService.getAll(),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export function useCreatePart() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newPart) => inventoryService.create(newPart),
    onMutate: async (newPart) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const qty = Number(newPart.stockQty) || 0
      const min = Number(newPart.minThreshold) || 5
      const optimisticItem = {
        id: Date.now(),
        partCode: newPart.partCode || `PRT-GEN-${String(previous.length + 1).padStart(3, '0')}`,
        stockQty: qty,
        minThreshold: min,
        unitPrice: Number(newPart.unitPrice) || 0,
        status: qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock',
        ...newPart,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Part "${newPart.name}" added to inventory`, 'success')
      return { previous }
    },
    onError: (err, newPart, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to add part to inventory', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
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
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast('Spare part updated', 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update part', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
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
      const previous = queryClient.getQueryData(QUERY_KEY) || []
      const delta = Number(quantity) || 0

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => {
          if (item.id === id) {
            let newQty = item.stockQty
            if (type === 'Stock In') newQty += delta
            else if (type === 'Stock Out') newQty = Math.max(0, newQty - delta)
            else if (type === 'Adjustment') newQty = delta
            const min = item.minThreshold
            const status = newQty === 0 ? 'Out of Stock' : newQty <= min ? 'Low Stock' : 'In Stock'
            return { ...item, stockQty: newQty, status }
          }
          return item
        })
      )
      addToast(`${type} completed: ${quantity} units`, 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to adjust stock', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
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
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.filter((item) => item.id !== id)
      )
      addToast('Part removed from inventory', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to delete part', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useInventoryTransactions(options = {}) {
  return useQuery({
    queryKey: ['inventory_transactions'],
    queryFn: () => inventoryService.getTransactions(),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}
