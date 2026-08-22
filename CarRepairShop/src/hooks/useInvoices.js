import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceService } from '../services/invoiceService'
import { useToast } from '../context/ToastContext'

const QUERY_KEY = ['invoices']

export function useInvoices() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => invoiceService.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (newInvoice) => invoiceService.create(newInvoice),
    onMutate: async (newInvoice) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData(QUERY_KEY) || []

      const amt = Number(newInvoice.amount) || 0
      const optimisticItem = {
        id: Date.now(),
        invoiceNumber: `INV-2026-${String(previous.length + 1).padStart(4, '0')}`,
        issueDate: new Date().toISOString().split('T')[0],
        paidAmount: 0,
        amount: amt,
        status: 'Issued',
        paymentMethod: 'Pending',
        ...newInvoice,
      }

      queryClient.setQueryData(QUERY_KEY, [optimisticItem, ...previous])
      addToast(`Invoice ${optimisticItem.invoiceNumber} generated`, 'success')
      return { previous }
    },
    onError: (err, newInvoice, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to create invoice', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
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
      const previous = queryClient.getQueryData(QUERY_KEY) || []
      const addPay = Number(paidAmount) || 0

      queryClient.setQueryData(
        QUERY_KEY,
        previous.map((inv) => {
          if (inv.id === id) {
            const totalPaid = (inv.paidAmount || 0) + addPay
            const isFullyPaid = totalPaid >= inv.amount
            return {
              ...inv,
              paidAmount: Math.min(inv.amount, totalPaid),
              paymentMethod: paymentMethod || inv.paymentMethod,
              status: isFullyPaid ? 'Paid' : 'Partially Paid',
            }
          }
          return inv
        })
      )
      addToast(`Payment of $${addPay.toFixed(2)} recorded`, 'success')
      return { previous }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
      addToast('Failed to record payment', 'warning')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
