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
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton, Button, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, SearchableSelect } from '../../components/ui'

const statusFilters = ['All', 'Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed']

export default function RepairJobsPage() {
  const { t } = useTranslation()
  const { can, user } = useAuth()
  const { addToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [page, setPage] = useState(1)

  const queryParams = {
    page,
    limit: 10,
    search: debouncedSearch,
    status: activeFilter,
    ...(user?.role === 'mechanic' ? { mechanicId: user?.id } : {}),
  }
  const { data: response, isLoading } = useRepairJobs(queryParams)
  const jobs = Array.isArray(response) ? response : (response?.data || [])
  const pagination = response?.pagination || null
  const totalCount = pagination ? pagination.total : jobs.length
  const totalPages = pagination ? pagination.totalPages : 1

  const { data: rawCustomers = [] } = useCustomers({ all: true })
  const { data: rawVehicles = [] } = useVehicles({ all: true })
  const { data: rawMechanics = [] } = useMechanics({ all: true })
  const { data: rawServices = [] } = useServicesCatalog({ all: true })

  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])
  const vehicles = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles?.data || [])
  const mechanics = Array.isArray(rawMechanics) ? rawMechanics : (rawMechanics?.data || [])
  const services = Array.isArray(rawServices) ? rawServices : (rawServices?.data || [])

  const createJobMutation = useCreateRepairJob()
  const updateJobMutation = useUpdateRepairJob()
  const deleteJobMutation = useDeleteRepairJob()
  const createInvoiceMutation = useCreateInvoice()

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
    setIsViewOpen(false); setIsEditOpen(true)
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
    setIsViewOpen(false); setIsDeleteOpen(true)
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

  const filtered = jobs

  return (
    <div className="space-y-3 sm:space-y-4 font-sans text-app-text">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.repairJobsOrders')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {totalCount}
          </span>
        </div>
        {can('repair_jobs', 'create') && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
          >
            <Plus size={14} weight="bold" />
            <span>{t('repairJobs.newJob')}</span>
          </Button>
        )}
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {statusFilters.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveFilter(tab)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-app-accent text-app-accentText font-semibold'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover'
              }`}
            >
              {tab === 'All' ? t('common.all') : t(`status.${tab}`)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder={t('common.quickSearch')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
      </div>

      {/* Main Table Container */}
      {isLoading && jobs.length === 0 ? (
        <TableSkeleton rows={6} columns={8} />
      ) : filtered.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery || activeFilter !== 'All' ? t('common.filter') : undefined}
            onAction={
              searchQuery || activeFilter !== 'All'
                ? () => {
                    setSearchQuery('')
                    setActiveFilter('All')
                    setPage(1)
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('repairJobs.orderId')}</TableHead>
              <TableHead>{t('appointments.vehicle')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('appointments.customer')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('repairJobs.technician')}</TableHead>
              <TableHead>Stock-Out Parts</TableHead>
              <TableHead className="hidden md:table-cell">{t('repairJobs.totalCost')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono font-bold text-app-accent">{job.orderNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-app-text">{job.vehicle}</p>
                  <p className="text-[10px] text-app-muted font-mono">{job.plate}</p>
                </TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{job.customer}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-app-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {job.mechanic}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="font-semibold text-app-text tabular-nums hidden md:table-cell">
                  {job.estimatedCost}
                </TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* 1-Click Fast Invoice on Completed Orders */}
                    {job.status === 'Completed' && (
                      <button
                        onClick={() => handle1ClickInvoice(job)}
                        className="p-1 rounded-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Generate Invoice"
                      >
                        <Receipt size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenView(job)}
                      className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                      title={t('common.view')}
                    >
                      <Eye size={14} />
                    </button>
                    {can('repair_jobs', 'update') && (
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                        title={t('repairJobs.updateProgress')}
                      >
                        <PencilSimple size={14} />
                      </button>
                    )}
                    {can('repair_jobs', 'delete') && (
                      <button
                        onClick={() => handleOpenDelete(job)}
                        className="p-1 rounded-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooterBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={10}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </Table>
      )}

      {/* Create Repair Order Modal with Digital Vehicle Intake (DVI) */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('repairJobs.createWorkOrder')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Service Package Quick Selector */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm space-y-2">
            <label className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <Sparkle size={15} weight="fill" className="text-emerald-500" />
              Select Service Package (Auto-configures cost & parts stock-out)
            </label>
            <SearchableSelect
              value={formData.serviceId}
              onChange={(val) => handleServiceSelect(val)}
              options={services.map((s) => ({
                value: s.id,
                label: `${s.name} ($${Number(s.estimatedCost || 0).toFixed(2)})`,
                sublabel: `${s.requiredParts?.length || 0} required parts`,
              }))}
              placeholder="-- Choose Service Package (e.g. Oil Change, Brake Service) --"
              searchPlaceholder="Search service package..."
            />

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
                          className={`p-2 rounded-sm border flex items-center justify-between text-[11px] ${
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
              <SearchableSelect
                value={formData.customer}
                onChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, customer: val, customerId: c ? c.id : '' })
                }}
                options={customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.phone ? `Phone: ${c.phone}` : undefined,
                }))}
                placeholder="Select customer..."
                searchPlaceholder="Search customer by name or phone..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</label>
              <SearchableSelect
                value={formData.plate}
                onChange={(val) => {
                  const v = vehicles.find((x) => x.number === val)
                  setFormData({
                    ...formData,
                    plate: val,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                    odometer: v ? String(v.mileage || '') : formData.odometer,
                  })
                }}
                options={vehicles.map((v) => ({
                  value: v.number,
                  label: `${v.number} - ${v.brand} ${v.model}`,
                  sublabel: v.owner ? `Owner: ${v.owner}` : undefined,
                }))}
                placeholder="Select vehicle..."
                searchPlaceholder="Search vehicle by plate or model..."
              />
            </div>
          </div>

          {/* DVI: Odometer, Fuel Level & Estimate Authorization */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-sm space-y-2">
            <p className="text-[11px] font-bold text-app-text flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Digital Vehicle Intake (DVI) & Check-in Verification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                  <Gauge size={12} /> Odometer (km)
                </label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  placeholder="e.g. 52300"
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-sm text-app-text font-mono focus:outline-none focus:border-app-accent"
                />
              </div>
              <div>
                <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                  <GasPump size={12} /> Fuel Level
                </label>
                <SearchableSelect
                  value={formData.fuelLevel}
                  onChange={(val) => setFormData({ ...formData, fuelLevel: val })}
                  options={[
                    { value: 'Empty', label: 'Empty (Reserve)' },
                    { value: '1/4', label: '1/4 Tank' },
                    { value: '1/2', label: '1/2 Tank' },
                    { value: '3/4', label: '3/4 Tank' },
                    { value: 'Full', label: 'Full Tank' },
                  ]}
                  placeholder="Fuel level..."
                  searchPlaceholder="Search level..."
                />
              </div>
              <div>
                <label className="block text-app-muted font-medium mb-1">Customer Authorization</label>
                <SearchableSelect
                  value={formData.customerApproval}
                  onChange={(val) => setFormData({ ...formData, customerApproval: val })}
                  options={[
                    { value: 'Approved', label: 'Customer Approved' },
                    { value: 'Pending Approval', label: 'Pending Quote Approval' },
                  ]}
                  placeholder="Approval..."
                  searchPlaceholder="Search approval..."
                />
              </div>
            </div>

            <div>
              <label className="block text-app-muted font-medium mb-1">Pre-Existing Damage / Exterior Inspection Notes</label>
              <input
                type="text"
                value={formData.intakeNotes}
                onChange={(e) => setFormData({ ...formData, intakeNotes: e.target.value })}
                placeholder="e.g. Minor scratch on rear right bumper, clean windshield"
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')} *</label>
              <SearchableSelect
                value={formData.mechanic}
                onChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
                options={mechanics.map((m) => ({
                  value: m.name,
                  label: m.name,
                  sublabel: m.specialization ? `Specialization: ${m.specialization}` : undefined,
                }))}
                placeholder="Select technician..."
                searchPlaceholder="Search technician..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.totalCost')}</label>
              <input
                type="text"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="$450"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={2}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Routine 50k miles inspection and filter replacement"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
              <SearchableSelect
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'Pending', label: t('status.Pending') },
                  { value: 'Diagnosing', label: t('status.Diagnosing') },
                  { value: 'Repairing', label: t('status.Repairing') },
                  { value: 'Waiting for Parts', label: t('status.Waiting for Parts') },
                  { value: 'Ready for Pickup', label: t('status.Ready for Pickup') },
                  { value: 'Completed', label: t('status.Completed') },
                ]}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <SearchableSelect
                value={formData.mechanic}
                onChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
                options={mechanics.map((m) => ({
                  value: m.name,
                  label: m.name,
                  sublabel: m.specialization ? `Specialization: ${m.specialization}` : undefined,
                }))}
                placeholder="Select technician..."
                searchPlaceholder="Search technician..."
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={3}
              value={formData.diagnosis || ''}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
            <div className="flex items-center justify-between p-3.5 bg-app-hover/50 rounded-sm border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedJob.orderNumber}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedJob.vehicle}</h3>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> {t('appointments.customer')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Car size={12} /> {t('appointments.vehicle')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedJob.plate}</p>
              </div>
            </div>

            {/* DVI Intake Verification Card */}
            <div className="p-3 bg-app-card rounded-sm border border-app-border space-y-1.5">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" /> Digital Vehicle Intake Record
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-1.5 rounded-sm bg-app-hover">
                  <span className="text-[10px] text-app-muted block">Mileage</span>
                  <span className="font-mono font-bold text-app-text">{selectedJob.odometer || '0'} km</span>
                </div>
                <div className="p-1.5 rounded-sm bg-app-hover">
                  <span className="text-[10px] text-app-muted block">Fuel Level</span>
                  <span className="font-bold text-app-text">{selectedJob.fuelLevel || '1/2'}</span>
                </div>
                <div className="p-1.5 rounded-sm bg-app-hover">
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

            <div className="p-3 bg-app-input rounded-sm border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.description')}</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>

            {selectedJob.diagnosis && (
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('repairJobs.diagnosticReport')}</p>
                <p className="text-app-text mt-1">{selectedJob.diagnosis}</p>
              </div>
            )}

            {/* Deducted Spare Parts Section */}
            <div className="p-3 bg-app-card rounded-sm border border-app-border space-y-2">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1.5">
                <Package size={14} className="text-amber-500" />
                Inventory Parts Deducted (Auto Stock-Out)
              </p>
              {selectedJob.partsUsed && selectedJob.partsUsed.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedJob.partsUsed.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-sm bg-app-hover/50 border border-app-border">
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
