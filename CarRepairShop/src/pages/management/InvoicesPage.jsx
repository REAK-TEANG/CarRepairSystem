import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  Receipt,
  Clock,
  CheckCircle,
  Trash,
  QrCode,
  Wallet,
  HourglassHigh,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInvoices, useCreateInvoice, useRecordPayment, useDeleteInvoice } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, SearchableSelect } from '../../components/ui'
import InvoiceDocument from '../../components/invoices/InvoiceDocument'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  // All invoices for KPI stats and filter totals
  const { data: allInvoicesRaw = [] } = useInvoices({ all: true })
  const allInvoices = Array.isArray(allInvoicesRaw) ? allInvoicesRaw : (allInvoicesRaw?.data || [])

  // Paginated invoices for table
  const { data: invoicesResponse, isLoading } = useInvoices({
    search: debouncedSearch,
    status: statusFilter,
    page: currentPage,
    limit: 10,
  })

  const invoices = invoicesResponse?.data || (Array.isArray(invoicesResponse) ? invoicesResponse : [])
  const pagination = invoicesResponse?.pagination || {
    page: currentPage,
    limit: 10,
    total: invoices.length,
    totalPages: Math.ceil(invoices.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  // Modal lookup data (all items)
  const { data: custData = [] } = useCustomers({ all: true })
  const customers = Array.isArray(custData) ? custData : (custData?.data || [])
  const { data: jobData = [] } = useRepairJobs({ all: true })
  const repairJobs = Array.isArray(jobData) ? jobData : (jobData?.data || [])

  const createInvoiceMutation = useCreateInvoice()
  const recordPaymentMutation = useRecordPayment()
  const deleteInvoiceMutation = useDeleteInvoice()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Add Form
  const [formData, setFormData] = useState(() => ({
    customer: '',
    customerId: '',
    orderNumber: '',
    amount: 350.0,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  }))

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

  // KPI calculations from complete dataset
  const totalBilled = allInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
  const totalCollected = allInvoices.reduce((sum, i) => sum + (parseFloat(i.paidAmount) || 0), 0)
  const totalOutstanding = Math.max(0, totalBilled - totalCollected)

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.invoicesBilling')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {pagination.total}
          </span>
        </div>
        {can('invoices', 'create') && (
          <Button
            id="btn-create-invoice"
            onClick={handleOpenAdd}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} weight="bold" />
            <span>{t('invoices.createInvoice')}</span>
          </Button>
        )}
      </div>

      {/* KPI Financial Overview Strip (Linear Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-lg bg-app-card border border-app-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-app-muted tracking-tight">Total Invoiced</p>
            <p className="font-mono font-semibold text-xl text-app-text mt-0.5 tabular-nums">${totalBilled.toFixed(2)}</p>
          </div>
          <Receipt size={16} weight="bold" className="text-app-accent flex-shrink-0" />
        </div>

        <div className="p-3 rounded-lg bg-app-card border border-app-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-app-muted tracking-tight">Total Collected</p>
            <p className="font-mono font-semibold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              ${totalCollected.toFixed(2)}
            </p>
          </div>
          <Wallet size={16} weight="bold" className="text-emerald-500 flex-shrink-0" />
        </div>

        <div className="p-3 rounded-lg bg-app-card border border-app-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-app-muted tracking-tight">Outstanding</p>
            <p className="font-mono font-semibold text-xl text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
              ${totalOutstanding.toFixed(2)}
            </p>
          </div>
          <HourglassHigh size={16} weight="bold" className="text-amber-500 flex-shrink-0" />
        </div>

        <div className="p-3 rounded-lg bg-app-card border border-app-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-app-muted tracking-tight">Paid Invoices</p>
            <p className="font-mono font-semibold text-xl text-app-text mt-0.5 tabular-nums">
              {allInvoices.filter((i) => i.status === 'Paid').length}
              <span className="text-xs font-normal text-app-muted ml-1">/ {allInvoices.length}</span>
            </p>
          </div>
          <CheckCircle size={16} weight="bold" className="text-sky-500 flex-shrink-0" />
        </div>
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {statusFilters.map((st) => {
            const count = st === 'All' ? allInvoices.length : allInvoices.filter((i) => i.status === st).length
            const isActive = statusFilter === st
            const translatedSt = st === 'All' ? t('common.all') : t(`status.${st}`, st)
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-app-accent text-app-accentText font-semibold'
                    : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                }`}
              >
                <span>{translatedSt}</span>
                <span className="text-[10px] font-mono opacity-80">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-60">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder={t('common.quickSearch')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading && invoices.length === 0 ? (
        <TableSkeleton rows={6} columns={7} />
      ) : invoices.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery || statusFilter !== 'All' ? t('common.filter') : undefined}
            onAction={
              searchQuery || statusFilter !== 'All'
                ? () => {
                    setSearchQuery('')
                    setStatusFilter('All')
                    setCurrentPage(1)
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('invoices.invoiceNumber')}</TableHead>
              <TableHead>{t('invoices.customer')}</TableHead>
              <TableHead className="hidden md:table-cell">Vehicle & Work Order</TableHead>
              <TableHead>{t('invoices.amount')}</TableHead>
              <TableHead className="hidden lg:table-cell">Balance Due</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.amount - (inv.paidAmount || 0))
              const percentPaid = inv.amount > 0 ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.amount) * 100)) : 0

              return (
                <TableRow
                  key={inv.id}
                  onClick={() => handleOpenView(inv)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <span className="font-mono font-bold text-app-accent px-1.5 py-0.5 rounded-sm bg-app-accent/10 border border-app-accent/20">
                      {inv.invoiceNumber}
                    </span>
                    <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5 font-mono">
                      <Clock size={10} /> Due: {inv.dueDate}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-app-text">{inv.customer}</p>
                    <p className="text-[10px] text-app-muted font-mono">{inv.customerCode || 'CUST-001'}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium text-app-text">{inv.vehicle || 'Vehicle Service'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-app-muted mt-0.5">
                      {inv.vehiclePlate && <span className="font-bold text-app-text">{inv.vehiclePlate}</span>}
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{inv.orderNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-app-text tabular-nums text-xs">${Number(inv.amount).toFixed(2)}</p>
                    <div className="w-16 bg-app-border h-1 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentPaid >= 100 ? 'bg-emerald-500' : percentPaid > 0 ? 'bg-sky-500' : 'bg-transparent'
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-app-muted mt-0.5">{percentPaid}% Paid</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={`font-mono font-bold text-xs ${
                        bal === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ${bal.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {can('invoices', 'update') && inv.status !== 'Paid' && (
                        <button
                          onClick={() => handleOpenPay(inv)}
                          title={t('invoices.markAsPaid')}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenView(inv)}
                        className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                        title="View / Print Formal Invoice"
                      >
                        <Receipt size={14} />
                      </button>
                      {can('invoices', 'delete') && (
                        <button
                          onClick={() => handleOpenDelete(inv)}
                          className="p-1 rounded-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
        </Table>
      )}

      {/* Generate Invoice Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('invoices.createInvoice')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.customer')} *</label>
              <SearchableSelect
                value={formData.customer}
                onChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, customer: val, customerId: c ? c.id : '' })
                }}
                options={customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.code ? `Code: ${c.code}` : undefined,
                }))}
                placeholder="Select customer..."
                searchPlaceholder="Search customer..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.repairJob')}</label>
              <SearchableSelect
                value={formData.orderNumber}
                onChange={(val) => setFormData({ ...formData, orderNumber: val })}
                options={repairJobs.map((j) => ({
                  value: j.orderNumber,
                  label: `${j.orderNumber} - ${j.customer}`,
                  sublabel: j.vehicle ? `Vehicle: ${j.vehicle}` : undefined,
                }))}
                placeholder="Select repair job (optional)..."
                searchPlaceholder="Search job or vehicle..."
              />
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('invoices.dueDate')}</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              {t('common.cancel')}
            </Button>
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
          <div className="p-4 bg-app-hover/50 rounded-xl border border-app-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-app-muted">Customer:</span>
              <span className="font-semibold text-app-text">{selectedInvoice?.customer}</span>
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
            <div className="flex items-center justify-between pt-2 border-t border-app-border font-bold">
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text font-bold font-mono text-base focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('invoices.paymentMethod')} *</label>
            <SearchableSelect
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              options={[
                { value: 'Credit/Debit Card', label: 'Credit / Debit Card (POS Terminal)' },
                { value: 'Cash', label: 'Cash at Counter' },
                { value: 'Bank Transfer', label: 'Direct Bank Wire / Transfer' },
                { value: 'Bakong KHQR', label: 'Bakong Universal KHQR (ABA / Wing / ACLEDA)' },
              ]}
              placeholder="Select payment method..."
              searchPlaceholder="Search method..."
            />
          </div>

          {paymentMethod === 'Bakong KHQR' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 via-app-card to-rose-500/5 border border-rose-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
                <QrCode size={24} weight="bold" />
              </div>
              <h4 className="font-bold text-rose-700 dark:text-rose-400 text-xs">Bakong Universal KHQR</h4>
              <p className="text-[11px] text-app-muted">
                Scan with any banking app (ABA, Wing, ACLEDA, Canadia) to pay{' '}
                <span className="font-bold text-app-text">${Number(paymentAmount).toFixed(2)}</span>
              </p>
              <div className="p-3 bg-white dark:bg-black/40 rounded-xl inline-block border border-app-border">
                <div className="w-32 h-32 border-2 border-dashed border-rose-500/50 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                  <QrCode size={56} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-[9px] font-mono font-bold text-app-text mt-1">KHQR READY</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPayOpen(false)}
            >
              {t('common.cancel')}
            </Button>
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
