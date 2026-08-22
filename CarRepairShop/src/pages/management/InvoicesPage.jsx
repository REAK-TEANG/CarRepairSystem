import { useState } from 'react'
import { MagnifyingGlass, Plus, Receipt, CreditCard, Clock, CheckCircle } from '@phosphor-icons/react'
import { useInvoices, useCreateInvoice, useRecordPayment } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

export default function InvoicesPage() {
  const { can, user } = useAuth()
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: customers = [] } = useCustomers()
  const { data: repairJobs = [] } = useRepairJobs()

  const createInvoiceMutation = useCreateInvoice()
  const recordPaymentMutation = useRecordPayment()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Add Form
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    orderNumber: '',
    amount: 350.00,
    dueDate: new Date().toISOString().split('T')[0],
  })

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Credit Card')

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultJob = repairJobs[0]
    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      orderNumber: defaultJob ? defaultJob.orderNumber : 'RO-2026-0045',
      amount: 450.00,
      dueDate: new Date().toISOString().split('T')[0],
    })
    setIsAddOpen(true)
  }

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv)
    const remaining = Math.max(0, inv.amount - (inv.paidAmount || 0))
    setPaymentAmount(remaining)
    setPaymentMethod('Credit Card')
    setIsPayOpen(true)
  }

  const handleOpenView = (inv) => {
    setSelectedInvoice(inv)
    setIsViewOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    createInvoiceMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handlePaySubmit = async (e) => {
    e.preventDefault()
    if (!selectedInvoice) return
    recordPaymentMutation.mutate({
      id: selectedInvoice.id,
      paidAmount: paymentAmount,
      paymentMethod,
    })
    setIsPayOpen(false)
  }

  const statusFilters = ['All', 'Paid', 'Issued', 'Partially Paid', 'Overdue']

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected)

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Invoices & Payments</h1>
          <p className="text-xs text-app-muted mt-1">{invoices.length} invoices generated</p>
        </div>
        {can('invoices', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Generate Invoice
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Invoiced</p>
          <p className="text-xl font-bold tabular-nums text-app-text">${totalInvoiced.toFixed(2)}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Collected Revenue</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">${totalCollected.toFixed(2)}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Outstanding Balance</p>
          <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">${totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((filter) => {
          const count = filter === 'All'
            ? invoices.length
            : invoices.filter((i) => i.status === filter).length
          const isActive = statusFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {filter}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search invoice #, customer, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading invoices...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Invoice #</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Repair Order</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Payment Method</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-mono font-semibold text-app-accent">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> Due: {inv.dueDate}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-app-text">{inv.customer}</td>
                    <td className="px-6 py-3.5 font-mono text-app-muted hidden md:table-cell">{inv.orderNumber}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-app-text tabular-nums">${Number(inv.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-app-muted">Paid: ${Number(inv.paidAmount || 0).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard size={14} className="text-app-muted" />
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(user.role === 'cashier' || user.role === 'admin' || user.role === 'manager') && inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleOpenPay(inv)}
                            title="Collect Payment"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-subtle"
                          >
                            Receive Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenView(inv)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View / Print Receipt"
                        >
                          <Receipt size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Generate Customer Invoice">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Customer *</label>
              <select
                value={formData.customer}
                onChange={(e) => {
                  const c = customers.find(x => x.name === e.target.value)
                  setFormData({ ...formData, customer: e.target.value, customerId: c ? c.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Repair Order Reference</label>
              <select
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono"
              >
                {repairJobs.map((j) => (
                  <option key={j.id} value={j.orderNumber}>{j.orderNumber} - {j.customer}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Total Billable Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-bold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Payment Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title={`Collect Payment: ${selectedInvoice?.invoiceNumber}`}>
        <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border space-y-1">
            <p className="text-app-muted">Customer: <span className="font-semibold text-app-text">{selectedInvoice?.customer}</span></p>
            <p className="text-app-muted">Total Invoice: <span className="font-bold text-app-text">${Number(selectedInvoice?.amount || 0).toFixed(2)}</span></p>
            <p className="text-app-muted">Already Paid: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${Number(selectedInvoice?.paidAmount || 0).toFixed(2)}</span></p>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Payment Amount to Collect ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text font-bold text-base focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-medium"
            >
              <option value="Credit Card">Credit / Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="QR Payment">QR Payment</option>
              <option value="Mobile Payment">Mobile Payment (Apple / Google Pay)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-subtle flex items-center gap-1.5"
            >
              <CheckCircle size={15} weight="bold" />
              Complete Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice / Formal Receipt Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Formal Invoice & Payment Receipt">
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div>
                <p className="font-mono text-base font-bold text-app-accent">{selectedInvoice.invoiceNumber}</p>
                <p className="text-[10px] text-app-muted">Order: {selectedInvoice.orderNumber} · Issued: {selectedInvoice.issueDate}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Billed Customer</p>
                <p className="font-bold text-app-text mt-0.5">{selectedInvoice.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Payment Channel</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedInvoice.paymentMethod}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Total Amount</p>
                <p className="text-base font-bold text-app-text mt-0.5">${Number(selectedInvoice.amount).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Paid to Date</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">${Number(selectedInvoice.paidAmount || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-app-border flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-app-hover hover:bg-app-border rounded-lg text-xs font-semibold text-app-text transition-colors flex items-center gap-1.5"
              >
                <Receipt size={15} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
