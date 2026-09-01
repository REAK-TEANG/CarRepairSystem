import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Eye,
  User,
  Car,
  Trash,
  Package,
  CheckCircle,
  WarningCircle,
  Sparkle,
  Gauge,
  GasPump,
  ShieldCheck,
  Receipt,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs, useCreateRepairJob, useUpdateRepairJob, useDeleteRepairJob } from '../../hooks/useRepairJobs'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useCreateInvoice } from '../../hooks/useInvoices'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton } from '../../components/ui'

const statusFilters = ['All', 'Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed']

export default function RepairJobsPage() {
  const { t } = useTranslation()
  const { can, user } = useAuth()
  const { addToast } = useToast()
  const params = user?.role === 'mechanic' ? { mechanicId: user?.id } : {}
  const { data: jobs = [], isLoading } = useRepairJobs(params)
  const { data: customers = [] } = useCustomers()
  const { data: vehicles = [] } = useVehicles()
  const { data: mechanics = [] } = useMechanics()
  const { data: services = [] } = useServicesCatalog()

  const createJobMutation = useCreateRepairJob()
  const updateJobMutation = useUpdateRepairJob()
  const deleteJobMutation = useDeleteRepairJob()
  const createInvoiceMutation = useCreateInvoice()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    vehicle: '',
    vehicleId: '',
    plate: '',
    mechanic: '',
    mechanicId: '',
    serviceId: '',
    problem: '',
    diagnosis: '',
    estimatedCost: '$250',
    actualCost: '',
    status: 'Pending',
    odometer: '',
    fuelLevel: '1/2',
    intakeNotes: '',
    customerApproval: 'Approved',
  })

  // Selected Service for Auto Stock-Out Preview
  const activeService = services.find((s) => String(s.id) === String(formData.serviceId))

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultVeh = vehicles[0]
    const defaultMec = mechanics[0]

    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      vehicle: defaultVeh ? `${defaultVeh.brand} ${defaultVeh.model}` : '',
      vehicleId: defaultVeh ? defaultVeh.id : '',
      plate: defaultVeh ? defaultVeh.number : '',
      mechanic: defaultMec ? defaultMec.name : '',
      mechanicId: defaultMec ? defaultMec.id : '',
      serviceId: '',
      problem: '',
      diagnosis: '',
      estimatedCost: '$250',
      actualCost: '',
      status: 'Pending',
      odometer: defaultVeh ? String(defaultVeh.mileage || '') : '',
      fuelLevel: '1/2',
      intakeNotes: 'No pre-existing exterior damage noted',
      customerApproval: 'Approved',
    })
    setIsAddOpen(true)
  }

  const handleServiceSelect = (serviceId) => {
    const selected = services.find((s) => String(s.id) === String(serviceId))
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        serviceId: selected.id,
        problem: prev.problem || selected.name,
        diagnosis: prev.diagnosis || selected.description || `Execute ${selected.name} standard procedure`,
        estimatedCost: `$${Number(selected.estimatedCost || 250).toFixed(2)}`,
      }))
    } else {
      setFormData((prev) => ({ ...prev, serviceId: '' }))
    }
  }

  const handleOpenEdit = (job) => {
    setSelectedJob(job)
    setFormData({
      ...job,
      serviceId: '',
      odometer: job.odometer || '',
      fuelLevel: job.fuelLevel || '1/2',
      intakeNotes: job.intakeInspection?.notes || '',
      customerApproval: job.customerApproval || 'Approved',
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (job) => {
    setSelectedJob(job)
    setIsViewOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.problem) return
    createJobMutation.mutate({
      ...formData,
      intakeInspection: {
        odometer: formData.odometer,
        fuelLevel: formData.fuelLevel,
        notes: formData.intakeNotes,
      },
    })
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedJob) return
    updateJobMutation.mutate({
      id: selectedJob.id,
      data: {
        ...formData,
        intakeInspection: {
          odometer: formData.odometer,
          fuelLevel: formData.fuelLevel,
          notes: formData.intakeNotes,
        },
      },
    })
    setIsEditOpen(false)
  }

  const handleOpenDelete = (job) => {
    setSelectedJob(job)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedJob) return
    deleteJobMutation.mutate(selectedJob.id)
    setIsDeleteOpen(false)
  }

  const handle1ClickInvoice = async (job) => {
    const costNum = parseFloat(String(job.actualCost || job.estimatedCost || '350').replace(/[^0-9.]/g, '')) || 350
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const dueDateStr = nextWeek.toISOString().split('T')[0]
    try {
      await createInvoiceMutation.mutateAsync({
        customerId: job.customerId,
        customer: job.customer,
        orderNumber: job.orderNumber,
        amount: costNum,
        dueDate: dueDateStr,
      })
      addToast(`Invoice created for ${job.orderNumber} ($${costNum.toFixed(2)})`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to create invoice', 'warning')
    }
  }

  const filtered = jobs.filter((j) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (j?.orderNumber || '').toLowerCase().includes(q) ||
      (j?.customer || '').toLowerCase().includes(q) ||
      (j?.vehicle || '').toLowerCase().includes(q) ||
      (j?.plate || '').toLowerCase().includes(q) ||
      (j?.problem || '').toLowerCase().includes(q) ||
      (j?.mechanic || '').toLowerCase().includes(q) ||
      (j?.partsUsed || []).some(
        (p) => (p?.name || '').toLowerCase().includes(q) || (p?.partCode || '').toLowerCase().includes(q)
      )

    const matchesStatus = activeFilter === 'All' || j.status === activeFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 font-sans text-app-text animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.repairJobsOrders')}</h1>
          <p className="text-xs text-app-muted mt-1">{t('repairJobs.subtitle')}</p>
        </div>
        {can('repair_jobs', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            {t('repairJobs.newJob')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
            }`}
          >
            {tab === 'All' ? t('common.all') : t(`status.${tab}`)}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && jobs.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || activeFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || activeFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setActiveFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('repairJobs.orderId')}</th>
                  <th className="px-6 py-3 font-semibold">{t('appointments.vehicle')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('appointments.customer')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('repairJobs.technician')}</th>
                  <th className="px-6 py-3 font-semibold">Stock-Out Parts</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('repairJobs.totalCost')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-bold text-app-accent">{job.orderNumber}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{job.vehicle}</p>
                      <p className="text-[10px] text-app-muted font-mono">{job.plate}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{job.customer}</td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-app-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {job.mechanic}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {job.partsUsed && job.partsUsed.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {job.partsUsed.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                              title={`${p.name} - Qty: ${p.quantity}`}
                            >
                              <Package size={11} />
                              <span>
                                {p.quantity}x {p.partCode || p.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-app-muted italic">No parts</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums hidden md:table-cell">
                      {job.estimatedCost}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 1-Click Fast Invoice on Completed Orders */}
                        {job.status === 'Completed' && (
                          <button
                            onClick={() => handle1ClickInvoice(job)}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Generate Invoice"
                          >
                            <Receipt size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenView(job)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('repair_jobs', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                            title={t('repairJobs.updateProgress')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('repair_jobs', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(job)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* Create Repair Order Modal with Digital Vehicle Intake (DVI) */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('repairJobs.createWorkOrder')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Service Package Quick Selector */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
            <label className="block text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <Sparkle size={15} weight="fill" className="text-emerald-500" />
              Select Service Package (Auto-configures cost & parts stock-out)
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceSelect(e.target.value)}
              className="w-full px-3 py-2 bg-app-card border border-emerald-500/30 rounded-xl text-app-text font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Service Package (e.g. Oil Change, Brake Service) --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${Number(s.estimatedCost || 0).toFixed(2)}) — {s.requiredParts?.length || 0} required parts
                </option>
              ))}
            </select>

            {/* Live Auto Stock-Out Preview */}
            {activeService && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-1.5">
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Package size={13} />
                  Auto Stock-Out Preview for "{activeService.name}":
                </p>
                {activeService.requiredParts && activeService.requiredParts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeService.requiredParts.map((p, idx) => {
                      const isAvailable = (p.stockQuantity || 0) >= (p.quantity || 1)
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                            isAvailable
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-app-text'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <span className="font-medium">
                            {p.quantity}x {p.name}
                          </span>
                          <span className="font-semibold text-[10px] flex items-center gap-1">
                            {isAvailable ? (
                              <>
                                <CheckCircle size={12} className="text-emerald-500" weight="fill" />
                                {p.stockQuantity} in stock
                              </>
                            ) : (
                              <>
                                <WarningCircle size={12} className="text-rose-500" weight="fill" />
                                {p.stockQuantity === 0 ? 'Out of stock' : `Only ${p.stockQuantity} left`}
                              </>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-app-muted italic">This service is pure labor and requires no stock items.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.customer')} *</label>
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
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</label>
              <select
                value={formData.plate}
                onChange={(e) => {
                  const v = vehicles.find((x) => x.number === e.target.value)
                  setFormData({
                    ...formData,
                    plate: e.target.value,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                    odometer: v ? String(v.mileage || '') : formData.odometer,
                  })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.number}>
                    {v.number} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DVI: Odometer, Fuel Level & Estimate Authorization */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-xl space-y-2">
            <p className="text-[11px] font-bold text-app-text flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Digital Vehicle Intake (DVI) & Check-in Verification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-app-muted font-medium mb-1 flex items-center gap-1">
                  <Gauge size={12} /> Odometer (km)
                </label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  placeholder="e.g. 52300"
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text font-mono focus:outline-none focus:border-app-accent"
                />
              </div>
              <div>
                <label className="block text-app-muted font-medium mb-1 flex items-center gap-1">
                  <GasPump size={12} /> Fuel Level
                </label>
                <select
                  value={formData.fuelLevel}
                  onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
                >
                  <option value="Empty">Empty (Reserve)</option>
                  <option value="1/4">1/4 Tank</option>
                  <option value="1/2">1/2 Tank</option>
                  <option value="3/4">3/4 Tank</option>
                  <option value="Full">Full Tank</option>
                </select>
              </div>
              <div>
                <label className="block text-app-muted font-medium mb-1">Customer Authorization</label>
                <select
                  value={formData.customerApproval}
                  onChange={(e) => setFormData({ ...formData, customerApproval: e.target.value })}
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text font-semibold focus:outline-none focus:border-app-accent"
                >
                  <option value="Approved">Customer Approved</option>
                  <option value="Pending Approval">Pending Quote Approval</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-app-muted font-medium mb-1">Pre-Existing Damage / Exterior Inspection Notes</label>
              <input
                type="text"
                value={formData.intakeNotes}
                onChange={(e) => setFormData({ ...formData, intakeNotes: e.target.value })}
                placeholder="e.g. Minor scratch on rear right bumper, clean windshield"
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')} *</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.totalCost')}</label>
              <input
                type="text"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="$450"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.description')} *</label>
            <textarea
              rows={2}
              required
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="e.g. Engine shaking while idle, check engine light on"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={2}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Routine 50k miles inspection and filter replacement"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createJobMutation.isPending}>
              {t('repairJobs.createWorkOrder')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit / Update Status Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('repairJobs.updateProgress')}: ${selectedJob?.orderNumber}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                <option value="Pending">{t('status.Pending')}</option>
                <option value="Diagnosing">{t('status.Diagnosing')}</option>
                <option value="Repairing">{t('status.Repairing')}</option>
                <option value="Waiting for Parts">{t('status.Waiting for Parts')}</option>
                <option value="Ready for Pickup">{t('status.Ready for Pickup')}</option>
                <option value="Completed">{t('status.Completed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={3}
              value={formData.diagnosis || ''}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateJobMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Job Modal with Full DVI & Parts Details */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('common.details')}>
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedJob.orderNumber}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedJob.vehicle}</h3>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> {t('appointments.customer')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Car size={12} /> {t('appointments.vehicle')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedJob.plate}</p>
              </div>
            </div>

            {/* DVI Intake Verification Card */}
            <div className="p-3 bg-app-card rounded-xl border border-app-border space-y-1.5">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" /> Digital Vehicle Intake Record
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-1.5 rounded-lg bg-app-hover">
                  <span className="text-[10px] text-app-muted block">Mileage</span>
                  <span className="font-mono font-bold text-app-text">{selectedJob.odometer || '0'} km</span>
                </div>
                <div className="p-1.5 rounded-lg bg-app-hover">
                  <span className="text-[10px] text-app-muted block">Fuel Level</span>
                  <span className="font-bold text-app-text">{selectedJob.fuelLevel || '1/2'}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-app-hover">
                  <span className="text-[10px] text-app-muted block">Customer Quote</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedJob.customerApproval || 'Approved'}
                  </span>
                </div>
              </div>
              {selectedJob.intakeInspection?.notes && (
                <p className="text-[11px] text-app-muted pt-1">
                  <span className="font-semibold text-app-text">Condition Notes:</span> {selectedJob.intakeInspection.notes}
                </p>
              )}
            </div>

            <div className="p-3 bg-app-input rounded-xl border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.description')}</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>

            {selectedJob.diagnosis && (
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('repairJobs.diagnosticReport')}</p>
                <p className="text-app-text mt-1">{selectedJob.diagnosis}</p>
              </div>
            )}

            {/* Deducted Spare Parts Section */}
            <div className="p-3 bg-app-card rounded-xl border border-app-border space-y-2">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1.5">
                <Package size={14} className="text-amber-500" />
                Inventory Parts Deducted (Auto Stock-Out)
              </p>
              {selectedJob.partsUsed && selectedJob.partsUsed.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedJob.partsUsed.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-app-hover/50 border border-app-border">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          {p.quantity}x
                        </span>
                        <span className="font-semibold text-app-text">{p.name}</span>
                        <span className="text-app-muted text-[10px]">({p.partCode})</span>
                      </div>
                      <span className="font-mono text-app-muted font-semibold">
                        ${Number(p.unitPrice || 0).toFixed(2)} ea
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-app-muted italic text-[11px]">No inventory parts consumed for this order.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('repairJobs.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
