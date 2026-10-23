import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/context/ToastContext'

/**
 * Factory for creating standardized CRUD entity hooks with TanStack Query.
 *
 * @param {Object} options
 * @param {string|string[]} options.queryKey - React Query key for the entity
 * @param {Object} options.service - Service containing getAll, create, update, delete
 * @param {string} options.entityName - Display name for default toast messages
 * @param {Function} [options.createOptimistic] - Function returning optimistic entity object on create
 * @param {Object} [options.messages] - Custom toast message strings or functions
 */
export function createEntityHooks({
  queryKey,
  service,
  entityName = 'Item',
  createOptimistic = (newData) => ({ id: Date.now(), ...newData }),
  messages = {},
}) {
  const rootKey = Array.isArray(queryKey) ? queryKey : [queryKey]

  function useList(params = {}, options = {}) {
    return useQuery({
      queryKey: [...rootKey, params],
      queryFn: () => service.getAll(params),
      placeholderData: (previousData) => previousData,
      staleTime: 1000 * 60 * 2,
      ...options,
    })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    return useMutation({
      mutationFn: (newData) => service.create(newData),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: rootKey })
        const previous = queryClient.getQueryData(rootKey) || []

        const optimisticItem = createOptimistic(newData, previous)

        queryClient.setQueryData(rootKey, [optimisticItem, ...previous])

        const msg =
          typeof messages.createSuccess === 'function'
            ? messages.createSuccess(newData)
            : messages.createSuccess || `${entityName} added`
        if (msg) addToast(msg, 'success')
        return { previous }
      },
      onError: (err, newData, context) => {
        if (context?.previous) {
          queryClient.setQueryData(rootKey, context.previous)
        }
        const msg = messages.createError || `Failed to add ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey })
      },
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    return useMutation({
      mutationFn: ({ id, data }) => service.update(id, data),
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: rootKey })
        const previous = queryClient.getQueryData(rootKey) || []

        queryClient.setQueryData(
          rootKey,
          previous.map((item) => (item.id === id ? { ...item, ...data } : item))
        )

        const msg =
          typeof messages.updateSuccess === 'function'
            ? messages.updateSuccess(data, id)
            : messages.updateSuccess || `${entityName} details updated`
        if (msg) addToast(msg, 'success')
        return { previous }
      },
      onError: (err, variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(rootKey, context.previous)
        }
        const msg = messages.updateError || `Failed to update ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey })
      },
    })
  }

  function useDelete() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    return useMutation({
      mutationFn: (id) => service.delete(id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: rootKey })
        const previous = queryClient.getQueryData(rootKey) || []

        queryClient.setQueryData(
          rootKey,
          previous.filter((item) => item.id !== id)
        )

        const msg =
          typeof messages.deleteSuccess === 'function'
            ? messages.deleteSuccess(id)
            : messages.deleteSuccess || `${entityName} removed`
        if (msg) addToast(msg, 'info')
        return { previous }
      },
      onError: (err, id, context) => {
        if (context?.previous) {
          queryClient.setQueryData(rootKey, context.previous)
        }
        const msg = messages.deleteError || `Failed to delete ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey })
      },
    })
  }

  return {
    useList,
    useCreate,
    useUpdate,
    useDelete,
  }
}
