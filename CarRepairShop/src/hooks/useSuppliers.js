import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierService } from '../services/supplierService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['suppliers']

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => supplierService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newSupplier) => supplierService.create(newSupplier),
    onMutate: async (newSupplier) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const optimisticItem = {
        id: Date.now(),
        rating: 5.0,
        activeOrders: 0,
        ...newSupplier,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Supplier "${newSupplier.name}" added`, 'success')
      return { previous }
    },
    onError: (err, newSupplier, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to add supplier', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => supplierService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast('Supplier details updated', 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update supplier', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => supplierService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.filter((item) => item.id !== id)
      )
      addToast('Supplier removed', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to delete supplier', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
