import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

function applyOptimisticInsert(oldData, newItem) {
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

function applyOptimisticUpdate(oldData, id, updatedFields) {
  if (!oldData) return oldData
  if (Array.isArray(oldData)) {
    return oldData.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
  }
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: oldData.data.map((item) => (item.id === id ? { ...item, ...updatedFields } : item)),
    }
  }
  return oldData
}

function applyOptimisticDelete(oldData, id) {
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
    let auth = null
    try {
      auth = useAuth()
    } catch {
      // safe fallback if rendered outside AuthProvider
    }
    const moduleName = rootKey[0]
    const hasPermission = auth?.can ? auth.can(moduleName, 'read') : true
    const isEnabled = (options.enabled ?? true) && hasPermission

    return useQuery({
      queryKey: [...rootKey, params],
      queryFn: () => service.getAll(params),
      placeholderData: (previousData) => previousData,
      ...options,
      enabled: isEnabled,
    })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    const { addToast } = useToast()

    return useMutation({
      mutationFn: (newData) => service.create(newData),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: rootKey })
        const previousSnapshots = queryClient.getQueriesData({ queryKey: rootKey })

        const optimisticItem = createOptimistic(newData)

        queryClient.setQueriesData({ queryKey: rootKey }, (old) =>
          applyOptimisticInsert(old, optimisticItem)
        )

        const msg =
          typeof messages.createSuccess === 'function'
            ? messages.createSuccess(newData)
            : messages.createSuccess || `${entityName} added`
        if (msg) addToast(msg, 'success')
        return { previousSnapshots }
      },
      onError: (err, newData, context) => {
        if (context?.previousSnapshots) {
          context.previousSnapshots.forEach(([qKey, qData]) => {
            queryClient.setQueryData(qKey, qData)
          })
        }
        const msg = messages.createError || `Failed to add ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey, exact: false, refetchType: 'active' })
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
        const previousSnapshots = queryClient.getQueriesData({ queryKey: rootKey })

        queryClient.setQueriesData({ queryKey: rootKey }, (old) =>
          applyOptimisticUpdate(old, id, data)
        )

        const msg =
          typeof messages.updateSuccess === 'function'
            ? messages.updateSuccess(data, id)
            : messages.updateSuccess || `${entityName} details updated`
        if (msg) addToast(msg, 'success')
        return { previousSnapshots }
      },
      onError: (err, variables, context) => {
        if (context?.previousSnapshots) {
          context.previousSnapshots.forEach(([qKey, qData]) => {
            queryClient.setQueryData(qKey, qData)
          })
        }
        const msg = messages.updateError || `Failed to update ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey, exact: false, refetchType: 'active' })
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
        const previousSnapshots = queryClient.getQueriesData({ queryKey: rootKey })

        queryClient.setQueriesData({ queryKey: rootKey }, (old) =>
          applyOptimisticDelete(old, id)
        )

        const msg =
          typeof messages.deleteSuccess === 'function'
            ? messages.deleteSuccess(id)
            : messages.deleteSuccess || `${entityName} removed`
        if (msg) addToast(msg, 'info')
        return { previousSnapshots }
      },
      onError: (err, id, context) => {
        if (context?.previousSnapshots) {
          context.previousSnapshots.forEach(([qKey, qData]) => {
            queryClient.setQueryData(qKey, qData)
          })
        }
        const msg = messages.deleteError || `Failed to delete ${entityName.toLowerCase()}`
        addToast(msg, 'warning')
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: rootKey, exact: false, refetchType: 'active' })
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
