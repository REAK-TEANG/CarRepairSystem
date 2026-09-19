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
import { useInvoices, useCreateInvoice, useRecordPayment, useDeleteInvoice } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { useRepairJobs } from '@/hooks/useRepairJobs'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import InvoiceDocument from '@/components/invoices/InvoiceDocument'

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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('titles.invoicesBilling')}</h1>
          <Badge variant="outline" className="text-xs font-mono">{invoices.length}</Badge>
        </div>
        {can('invoices', 'create') && (
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={16} weight="bold" />
            {t('invoices.createInvoice')}
          </Button>
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
            <Button
              key={st}
              variant="ghost"
              onClick={() => setStatusFilter(st)}
              className={`h-8 px-3 rounded-xl whitespace-nowrap text-xs ${
                isActive
                  ? 'bg-app-accent text-white shadow-subtle hover:bg-app-accent hover:text-white'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {translatedSt}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-white font-semibold' : 'bg-app-hover text-app-muted'
                }`}
              >
                {count}
              </span>
            </Button>
          )
        })}
      </div>

      {/* Main Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {(searchQuery || statusFilter !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('All')
              }}
            >
              {t('common.cancel')}
            </Button>
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
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-app-hover/50">
                  <TableHead className="px-6 py-3 font-semibold">{t('invoices.invoiceNumber')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('invoices.customer')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold hidden md:table-cell">Vehicle & Work Order</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('invoices.amount')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold hidden lg:table-cell">Balance Due</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('common.status')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-app-border">
                {filtered.map((inv) => {
                  const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.amount - (inv.paidAmount || 0))
                  const percentPaid = inv.amount > 0 ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.amount) * 100)) : 0

                  return (
                    <TableRow
                      key={inv.id}
                      onClick={() => handleOpenView(inv)}
                      className="hover:bg-app-hover/60 transition-colors group cursor-pointer"
                    >
                      <TableCell className="px-6 py-3.5">
                        <span className="font-mono font-bold text-app-accent px-2 py-0.5 rounded-lg bg-app-accent/10 border border-app-accent/20">
                          {inv.invoiceNumber}
                        </span>
                        <p className="text-[10px] text-app-muted flex items-center gap-1 mt-1 font-mono">
                          <Clock size={11} /> Due: {inv.dueDate}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{inv.customer}</p>
                        <p className="text-[10px] text-app-muted font-mono">{inv.customerCode || 'CUST-001'}</p>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 hidden md:table-cell">
                        <p className="font-medium text-app-text">{inv.vehicle || 'Vehicle Service'}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-app-muted mt-0.5">
                          {inv.vehiclePlate && <span className="font-bold text-app-text">{inv.vehiclePlate}</span>}
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{inv.orderNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
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
                      </TableCell>
                      <TableCell className="px-6 py-3.5 hidden lg:table-cell">
                        <span
                          className={`font-mono font-bold text-xs ${
                            bal === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          ${bal.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {can('invoices', 'update') && inv.status !== 'Paid' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPay(inv)}
                              title={t('invoices.markAsPaid')}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-subtle"
                            >
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenView(inv)}
                            className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover"
                            title="View / Print Formal Invoice"
                          >
                            <Receipt size={16} />
                          </Button>
                          {can('invoices', 'delete') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(inv)}
                              className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                              title={t('common.delete')}
                            >
                              <Trash size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) setIsAddOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invoices.createInvoice')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block text-app-muted font-medium mb-1">{t('invoices.customer')} *</Label>
                <Select
                  value={formData.customer}
                  onValueChange={(val) => {
                    const c = customers.find((x) => x.name === val)
                    setFormData({ ...formData, customer: val, customerId: c ? c.id : '' })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('invoices.customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name} ({c.code || 'CUST'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-app-muted font-medium mb-1">{t('invoices.repairJob')}</Label>
                <Select
                  value={formData.orderNumber}
                  onValueChange={(val) => setFormData({ ...formData, orderNumber: val })}
                >
                  <SelectTrigger className="w-full font-mono">
                    <SelectValue placeholder={t('invoices.repairJob')} />
                  </SelectTrigger>
                  <SelectContent>
                    {repairJobs.map((j) => (
                      <SelectItem key={j.id} value={j.orderNumber}>
                        {j.orderNumber} - {j.customer} ({j.vehicle})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block text-app-muted font-medium mb-1">{t('invoices.amount')} ($) *</Label>
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
                <Label className="block text-app-muted font-medium mb-1">{t('invoices.dueDate')}</Label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="h-9 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton type="submit" loading={createInvoiceMutation.isPending}>
                {t('invoices.createInvoice')}
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={isPayOpen} onOpenChange={(open) => { if(!open) setIsPayOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Settlement: {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
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
              <Label className="block text-app-muted font-medium mb-1">Payment Amount ($) *</Label>
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
              <Label className="block text-app-muted font-medium mb-1">{t('invoices.paymentMethod')} *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('invoices.paymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit/Debit Card">Credit / Debit Card (POS Terminal)</SelectItem>
                  <SelectItem value="Cash">Cash at Counter</SelectItem>
                  <SelectItem value="Bank Transfer">Direct Bank Wire / Transfer</SelectItem>
                  <SelectItem value="Bakong KHQR">Bakong Universal KHQR (ABA / Wing / ACLEDA)</SelectItem>
                </SelectContent>
              </Select>
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
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsPayOpen(false)}
                className="h-9 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton type="submit" loading={recordPaymentMutation.isPending} icon={CheckCircle} variant="primary">
                Confirm Payment Received
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Real-World Official Invoice & Receipt Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Official Invoice: {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <InvoiceDocument
            invoice={selectedInvoice}
            onRecordPayment={handleOpenPay}
            onClose={() => setIsViewOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
