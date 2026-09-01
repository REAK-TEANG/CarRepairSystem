import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  Trash,
  QrCode,
  CurrencyDollar,
  Wallet,
  HourglassHigh,
  ChartPieSlice,
  Car,
  User,
  Printer,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInvoices, useCreateInvoice, useRecordPayment, useDeleteInvoice } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton } from '../../components/ui'
import InvoiceDocument from '../../components/invoices/InvoiceDocument'

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
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  })

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card')

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultJob = repairJobs[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      orderNumber: defaultJob ? defaultJob.orderNumber : 'RO-2026-0041',
      amount: 420.0,
      dueDate: nextWeek,
    })
    setIsAddOpen(true)
  }

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv)
    const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.amount - (inv.paidAmount || 0))
    setPaymentAmount(bal)
    setPaymentMethod('Credit/Debit Card')
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

  const invoiceList = Array.isArray(invoices) ? invoices : []
  const query = searchQuery.trim().toLowerCase()
  const filtered = invoiceList.filter((inv) => {
    const matchesSearch =
      !query ||
      (inv?.invoiceNumber || '').toLowerCase().includes(query) ||
      (inv?.customer || '').toLowerCase().includes(query) ||
      (inv?.orderNumber || '').toLowerCase().includes(query) ||
      (inv?.vehicle || '').toLowerCase().includes(query) ||
      (inv?.vehiclePlate || '').toLowerCase().includes(query)

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // KPI calculations
  const totalBilled = invoiceList.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
  const totalCollected = invoiceList.reduce((sum, i) => sum + (parseFloat(i.paidAmount) || 0), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalCollected)
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.invoicesBilling')}</h1>
          <p className="text-xs text-app-muted mt-1">{invoices.length} {t('invoices.subtitle')}</p>
        </div>
        {can('invoices', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            {t('invoices.createInvoice')}
          </button>
        )}
      </div>

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-app-card border border-app-border shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
            <Receipt size={20} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Total Invoiced</p>
            <p className="font-mono font-bold text-base text-app-text mt-0.5">${totalBilled.toFixed(2)}</p>
            <p className="text-[10px] text-app-muted">{invoiceList.length} Total Invoices</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-card border border-app-border shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Wallet size={20} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Total Collected</p>
            <p className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${totalCollected.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{collectionRate}% Collection Rate</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-card border border-app-border shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <HourglassHigh size={20} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Outstanding Balance</p>
            <p className="font-mono font-bold text-base text-amber-600 dark:text-amber-400 mt-0.5">
              ${totalOutstanding.toFixed(2)}
            </p>
            <p className="text-[10px] text-app-muted">
              {invoiceList.filter((i) => i.status !== 'Paid').length} Unsettled
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-card border border-app-border shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
            <CheckCircle size={20} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Paid Invoices</p>
            <p className="font-mono font-bold text-base text-app-text mt-0.5">
              {invoiceList.filter((i) => i.status === 'Paid').length}{' '}
              <span className="text-xs font-normal text-app-muted">/ {invoiceList.length}</span>
            </p>
            <p className="text-[10px] text-app-muted">Settled in Full</p>
          </div>
        </div>
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
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors cursor-pointer"
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
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Vehicle & Work Order</th>
                  <th className="px-6 py-3 font-semibold">{t('invoices.amount')}</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Balance Due</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((inv) => {
                  const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.amount - (inv.paidAmount || 0))
                  const percentPaid = inv.amount > 0 ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.amount) * 100)) : 0

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleOpenView(inv)}
                      className="hover:bg-app-hover/60 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-app-accent px-2 py-0.5 rounded-lg bg-app-accent/10 border border-app-accent/20">
                          {inv.invoiceNumber}
                        </span>
                        <p className="text-[10px] text-app-muted flex items-center gap-1 mt-1 font-mono">
                          <Clock size={11} /> Due: {inv.dueDate}
                        </p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{inv.customer}</p>
                        <p className="text-[10px] text-app-muted font-mono">{inv.customerCode || 'CUST-001'}</p>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <p className="font-medium text-app-text">{inv.vehicle || 'Vehicle Service'}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-app-muted mt-0.5">
                          {inv.vehiclePlate && <span className="font-bold text-app-text">{inv.vehiclePlate}</span>}
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{inv.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-bold text-app-text tabular-nums text-xs">${Number(inv.amount).toFixed(2)}</p>
                        <div className="w-20 bg-app-border h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentPaid >= 100 ? 'bg-emerald-500' : percentPaid > 0 ? 'bg-sky-500' : 'bg-transparent'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-app-muted mt-0.5">{percentPaid}% Paid</p>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span
                          className={`font-mono font-bold text-xs ${
                            bal === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          ${bal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {can('invoices', 'update') && inv.status !== 'Paid' && (
                            <button
                              onClick={() => handleOpenPay(inv)}
                              title={t('invoices.markAsPaid')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-subtle cursor-pointer"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenView(inv)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                            title="View / Print Formal Invoice"
                          >
                            <Receipt size={16} />
                          </button>
                          {can('invoices', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(inv)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={t('common.delete')}
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
                    {c.name} ({c.code || 'CUST'})
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
                    {j.orderNumber} - {j.customer} ({j.vehicle})
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-bold font-mono"
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
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
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
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={`Record Settlement: ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
          <div className="p-3.5 bg-app-hover/50 rounded-xl border border-app-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-app-muted">Customer:</span>
              <span className="font-bold text-app-text">{selectedInvoice?.customer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-muted">Invoice Total:</span>
              <span className="font-mono font-bold text-app-text">${Number(selectedInvoice?.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-muted">Currently Paid:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                ${Number(selectedInvoice?.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-app-border font-bold">
              <span className="text-app-muted">Remaining Balance:</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                $
                {Number(
                  selectedInvoice?.balanceDue !== undefined
                    ? selectedInvoice.balanceDue
                    : Math.max(0, (selectedInvoice?.amount || 0) - (selectedInvoice?.paidAmount || 0))
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Payment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text font-bold font-mono text-base focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('invoices.paymentMethod')} *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-medium"
            >
              <option value="Credit/Debit Card">Credit / Debit Card (POS Terminal)</option>
              <option value="Cash">Cash at Counter</option>
              <option value="Bank Transfer">Direct Bank Wire / Transfer</option>
              <option value="Bakong KHQR">Bakong Universal KHQR (ABA / Wing / ACLEDA)</option>
            </select>
          </div>

          {paymentMethod === 'Bakong KHQR' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 via-app-card to-rose-500/5 border border-rose-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
                <QrCode size={24} weight="bold" />
              </div>
              <h4 className="font-bold text-rose-700 dark:text-rose-400 text-xs">Bakong Universal KHQR</h4>
              <p className="text-[11px] text-app-muted">
                Scan with any banking app (ABA, Wing, ACLEDA, Canadia) to pay{' '}
                <span className="font-bold text-app-text">${Number(paymentAmount).toFixed(2)}</span>
              </p>
              <div className="p-2.5 bg-white dark:bg-black/40 rounded-lg inline-block border border-app-border">
                <div className="w-32 h-32 border-2 border-dashed border-rose-500/50 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                  <QrCode size={56} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-[9px] font-mono font-bold text-app-text mt-1">KHQR READY</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={recordPaymentMutation.isPending} icon={CheckCircle} variant="primary">
              Confirm Payment Received
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Real-World Official Invoice & Receipt Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Official Invoice: ${selectedInvoice?.invoiceNumber}`}
        maxWidth="max-w-4xl"
      >
        <InvoiceDocument
          invoice={selectedInvoice}
          onRecordPayment={handleOpenPay}
          onClose={() => setIsViewOpen(false)}
        />
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
