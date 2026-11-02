import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceService } from '@/services/invoiceService'
import { useToast } from '@/context/ToastContext'

const QUERY_KEY = ['invoices']

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

export function useInvoices(params = {}, options = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoiceService.getAll(params),
    placeholderData: (previousData) => previousData,
    ...options,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newInvoice) => invoiceService.create(newInvoice),
    onMutate: async (newInvoice) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })

      const amt = Number(newInvoice.amount) || 0
      const optimisticItem = {
        id: Date.now(),
        invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}`,
        issueDate: new Date().toISOString().split('T')[0],
        paidAmount: 0,
        amount: amt,
        status: 'Issued',
        paymentMethod: 'Pending',
        ...newInvoice,
      }

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithInsert(old, optimisticItem)
      )
      addToast(`Invoice ${optimisticItem.invoiceNumber} generated`, 'success')
      return { previousSnapshots }
    },
    onError: (err, newInvoice, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to create invoice', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] })
      queryClient.invalidateQueries({ queryKey: ['reports_summary'] })
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, paidAmount, paymentMethod }) =>
      invoiceService.recordPayment(id, { paidAmount, paymentMethod }),
    onMutate: async ({ id, paidAmount, paymentMethod }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })
      const addPay = Number(paidAmount) || 0

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithUpdate(old, id, (inv) => {
          const totalPaid = (inv.paidAmount || 0) + addPay
          const isFullyPaid = totalPaid >= inv.amount
          return {
            ...inv,
            paidAmount: Math.min(inv.amount, totalPaid),
            paymentMethod: paymentMethod || inv.paymentMethod,
            status: isFullyPaid ? 'Paid' : 'Partially Paid',
          }
        })
      )
      addToast(`Payment of $${addPay.toFixed(2)} recorded`, 'success')
      return { previousSnapshots }
    },
    onError: (err, variables, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to record payment', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] })
      queryClient.invalidateQueries({ queryKey: ['reports_summary'] })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id) => invoiceService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousSnapshots = queryClient.getQueriesData({ queryKey: QUERY_KEY })

      queryClient.setQueriesData({ queryKey: QUERY_KEY }, (old) =>
        updateListWithDelete(old, id)
      )
      addToast('Invoice archived and removed', 'info')
      return { previousSnapshots }
    },
    onError: (err, id, context) => {
      if (context?.previousSnapshots) {
        context.previousSnapshots.forEach(([qKey, qData]) => {
          queryClient.setQueryData(qKey, qData)
        })
      }
      addToast('Failed to delete invoice', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, exact: false, refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] })
      queryClient.invalidateQueries({ queryKey: ['reports_summary'] })
    },
  })
}
