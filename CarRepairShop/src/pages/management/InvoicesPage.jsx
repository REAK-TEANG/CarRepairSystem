import { useState } from 'react'
import { MagnifyingGlass, Plus, Receipt, CreditCard, Clock, CheckCircle, Trash } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInvoices, useCreateInvoice, useRecordPayment, useDeleteInvoice } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton } from '../../components/ui'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: customers = [] } = useCustomers()
  const { data: repairJobs = [] } = useRepairJobs()

  const createInvoiceMutation = useCreateInvoice()
  const recordPaymentMutation = useRecordPayment()
  const deleteInvoiceMutation = useDeleteInvoice()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Add Form
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    orderNumber: '',
    amount: 350.0,
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
      amount: 450.0,
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

  const handleOpenDelete = (inv) => {
    setSelectedInvoice(inv)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedInvoice) {
      deleteInvoiceMutation.mutate(selectedInvoice.id)
      setIsDeleteOpen(false)
    }
  }

  const statusFilters = ['All', 'Paid', 'Issued', 'Partially Paid', 'Overdue']

  const query = searchQuery.trim().toLowerCase()
  const invoiceList = Array.isArray(invoices) ? invoices : []
  const filtered = invoiceList.filter((inv) => {
    const matchesSearch =
      !query ||
      (inv?.invoiceNumber || '').toLowerCase().includes(query) ||
      (inv?.customer || '').toLowerCase().includes(query) ||
      (inv?.orderNumber || '').toLowerCase().includes(query)

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.invoicesBilling')}</h1>
          <p className="text-xs text-app-muted mt-1">{invoices.length} {t('invoices.subtitle')}</p>
        </div>
        {can('invoices', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('invoices.createInvoice')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((st) => {
          const count = st === 'All' ? invoices.length : invoices.filter((i) => i.status === st).length
          const isActive = statusFilter === st
          const translatedSt = st === 'All' ? t('common.all') : t(`status.${st}`, st)
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {translatedSt}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('All')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && invoices.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || statusFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || statusFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setStatusFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('invoices.invoiceNumber')}</th>
                  <th className="px-6 py-3 font-semibold">{t('invoices.customer')}</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">{t('invoices.repairJob')}</th>
                  <th className="px-6 py-3 font-semibold">{t('invoices.amount')}</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">{t('invoices.paymentMethod')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-mono font-semibold text-app-accent">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {t('invoices.dueDate')}: {inv.dueDate}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-app-text">{inv.customer}</td>
                    <td className="px-6 py-3.5 font-mono text-app-muted hidden md:table-cell">{inv.orderNumber}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-app-text tabular-nums">${Number(inv.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-app-muted">{t('common.paid')}: ${Number(inv.paidAmount || 0).toFixed(2)}</p>
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
                        {can('invoices', 'update') && inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleOpenPay(inv)}
                            title={t('invoices.markAsPaid')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-subtle"
                          >
                            {t('invoices.markAsPaid')}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenView(inv)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('invoices.printReceipt')}
                        >
                          <Receipt size={15} />
                        </button>
                        {can('invoices', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(inv)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash size={15} />
                          </button>
                        )}
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('invoices.createInvoice')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.customer')} *</label>
              <select
                value={formData.customer}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, customer: e.target.value, customerId: c ? c.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.repairJob')}</label>
              <select
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono"
              >
                {repairJobs.map((j) => (
                  <option key={j.id} value={j.orderNumber}>
                    {j.orderNumber} - {j.customer}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.amount')} ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-bold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.dueDate')}</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createInvoiceMutation.isPending}>
              {t('invoices.createInvoice')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title={`${t('invoices.markAsPaid')}: ${selectedInvoice?.invoiceNumber}`}>
        <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-app-hover/50 rounded-xl border border-app-border space-y-1">
            <p className="text-app-muted">
              {t('invoices.customer')}: <span className="font-semibold text-app-text">{selectedInvoice?.customer}</span>
            </p>
            <p className="text-app-muted">
              {t('invoices.amount')}: <span className="font-bold text-app-text">${Number(selectedInvoice?.amount || 0).toFixed(2)}</span>
            </p>
            <p className="text-app-muted">
              {t('common.paid')}:{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ${Number(selectedInvoice?.paidAmount || 0).toFixed(2)}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('invoices.amount')} ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text font-bold text-base focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('invoices.paymentMethod')} *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-medium"
            >
              <option value="Credit Card">{t('invoices.card')}</option>
              <option value="Cash">{t('invoices.cash')}</option>
              <option value="Bank Transfer">{t('invoices.bankTransfer')}</option>
              <option value="KHQR">KHQR Payment</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={recordPaymentMutation.isPending} icon={CheckCircle} variant="primary">
              {t('common.confirm')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Invoice / Formal Receipt Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('invoices.printReceipt')}>
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-app-hover/50 rounded-xl border border-app-border flex items-center justify-between">
              <div>
                <p className="font-mono text-base font-bold text-app-accent">{selectedInvoice.invoiceNumber}</p>
                <p className="text-[10px] text-app-muted">
                  {t('invoices.repairJob')}: {selectedInvoice.orderNumber} · {t('invoices.date')}: {selectedInvoice.issueDate || '2026-02-24'}
                </p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('invoices.customer')}</p>
                <p className="font-bold text-app-text mt-0.5">{selectedInvoice.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('invoices.paymentMethod')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedInvoice.paymentMethod}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('invoices.amount')}</p>
                <p className="text-base font-bold text-app-text mt-0.5">${Number(selectedInvoice.amount).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.paid')}</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${Number(selectedInvoice.paidAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-app-border flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-app-hover hover:bg-app-border rounded-xl text-xs font-semibold text-app-text transition-colors flex items-center gap-1.5"
              >
                <Receipt size={15} /> {t('invoices.printReceipt')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Invoice Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('invoices.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
