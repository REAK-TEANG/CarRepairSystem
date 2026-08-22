import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleService } from '../services/vehicleService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['vehicles']

export function useVehicles() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => vehicleService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newVehicle) => vehicleService.create(newVehicle),
    onMutate: async (newVehicle) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const optimisticItem = {
        id: Date.now(),
        mileage: Number(newVehicle.mileage) || 0,
        ...newVehicle,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Vehicle ${newVehicle.number} registered`, 'success')
      return { previous }
    },
    onError: (err, newVehicle, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to register vehicle', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => vehicleService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      )
      addToast(`Vehicle ${data.number} updated`, 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to update vehicle', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => vehicleService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      queryClient.setQueryData(
        QUERY_KEY,
        previous.filter((item) => item.id !== id)
      )
      addToast('Vehicle removed from registry', 'info')
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to delete vehicle', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
