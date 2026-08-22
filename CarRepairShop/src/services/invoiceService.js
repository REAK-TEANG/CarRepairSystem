import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_invoices'

export const initialInvoices = [
  { id: 1, invoiceNumber: 'INV-2026-0089', customer: 'John Smith', customerId: 1, orderNumber: 'RO-2026-0042', amount: 850.00, paidAmount: 850.00, paymentMethod: 'Credit Card', status: 'Paid', issueDate: '2026-08-16', dueDate: '2026-08-16' },
  { id: 2, invoiceNumber: 'INV-2026-0088', customer: 'Sarah Davis', customerId: 2, orderNumber: 'RO-2026-0041', amount: 320.00, paidAmount: 0.00, paymentMethod: 'Pending', status: 'Issued', issueDate: '2026-08-16', dueDate: '2026-08-23' },
  { id: 3, invoiceNumber: 'INV-2026-0087', customer: 'David Park', customerId: 5, orderNumber: 'RO-2026-0038', amount: 110.00, paidAmount: 110.00, paymentMethod: 'QR Payment', status: 'Paid', issueDate: '2026-08-14', dueDate: '2026-08-14' },
  { id: 4, invoiceNumber: 'INV-2026-0086', customer: 'Emily Chen', customerId: 4, orderNumber: 'RO-2026-0039', amount: 450.00, paidAmount: 200.00, paymentMethod: 'Cash', status: 'Partially Paid', issueDate: '2026-08-14', dueDate: '2026-08-21' },
  { id: 5, invoiceNumber: 'INV-2026-0085', customer: 'Michael Chang', customerId: 6, orderNumber: 'RO-2026-0035', amount: 1450.00, paidAmount: 0.00, paymentMethod: 'Bank Transfer', status: 'Overdue', issueDate: '2026-08-01', dueDate: '2026-08-08' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialInvoices
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const invoiceService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/invoices')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/invoices', payload)
    }
    const current = getLocalData()
    const amt = Number(payload.amount) || 0
    const newInvoice = {
      id: Date.now(),
      invoiceNumber: `INV-2026-${String(current.length + 1).padStart(4, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      amount: amt,
      status: 'Issued',
      paymentMethod: 'Pending',
      ...payload,
    }
    const updated = [newInvoice, ...current]
    saveLocalData(updated)
    return Promise.resolve(newInvoice)
  },

  async recordPayment(id, { paidAmount, paymentMethod }) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post(`/invoices/${id}/payments`, { paidAmount, paymentMethod })
    }
    const current = getLocalData()
    const addPay = Number(paidAmount) || 0
    const updated = current.map((inv) => {
      if (inv.id === Number(id)) {
        const totalPaid = inv.paidAmount + addPay
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
    saveLocalData(updated)
    return Promise.resolve({ id, paidAmount: addPay, paymentMethod })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/invoices/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((i) => i.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
