import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  GasPump,
  Car,
  ClockCounterClockwise,
  Wrench,
  CheckCircle,
  WarningCircle,
  Sparkle,
  ShieldCheck,
  User,
  Phone,
  EnvelopeSimple,
  MapPin,
  Gauge,
  Package,
  CurrencyDollar,
  Copy,
  Check,
  CalendarBlank,
  FileText,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '../../hooks/useVehicles'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs, useCreateRepairJob } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal, ImageUpload, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, StatusBadge } from '../../components/ui'

const fuelOptions = ['All', 'Petrol', 'Diesel', 'Hybrid', 'Electric']

export default function VehiclesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { addToast } = useToast()
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: customers = [] } = useCustomers()
  const { data: repairJobs = [] } = useRepairJobs()
  const { data: mechanics = [] } = useMechanics()
  const { data: servicesCatalog = [] } = useServicesCatalog()

  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()
  const createJobMutation = useCreateRepairJob()

  const [searchQuery, setSearchQuery] = useState('')
  const [fuelFilter, setFuelFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Service History In-Modal Filter & Search
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('All')
  const [copiedVin, setCopiedVin] = useState(false)

  // Form: Vehicle
  const [formData, setFormData] = useState({
    number: '',
    vin: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    mileage: '',
    owner: '',
    ownerId: '',
    image: '',
  })

  // Form: Quick Work Order for Vehicle
  const [jobFormData, setJobFormData] = useState({
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
    status: 'Pending',
    odometer: '',
    fuelLevel: '1/2',
    intakeNotes: '',
    customerApproval: 'Approved',
  })

  const activeCatalogService = servicesCatalog.find((s) => String(s.id) === String(jobFormData.serviceId))

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    setFormData({
      number: '',
      vin: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: '',
      owner: defaultCust ? defaultCust.name : '',
      ownerId: defaultCust ? defaultCust.id : '',
      image: '',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (v) => {
    setSelectedVehicle(v)
    setFormData({
      number: v.number,
      vin: v.vin || '',
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color,
      fuelType: v.fuelType,
      transmission: v.transmission,
      mileage: v.mileage,
      owner: v.owner,
      ownerId: v.ownerId,
      image: v.image || '',
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (v) => {
    setSelectedVehicle(v)
    setHistorySearch('')
    setHistoryFilter('All')
    setIsViewOpen(true)
  }

  const handleOpenDelete = (v) => {
    setSelectedVehicle(v)
    setIsDeleteOpen(true)
  }

  const handleOpenCreateJob = (v) => {
    const cust = customers.find(
      (c) => (v.ownerId && String(c.id) === String(v.ownerId)) || (v.owner && c.name === v.owner)
    ) || customers[0]
    const defaultMec = mechanics[0]

    setJobFormData({
      customer: cust ? cust.name : v.owner || '',
      customerId: cust ? cust.id : v.ownerId || '',
      vehicle: `${v.brand} ${v.model}`,
      vehicleId: v.id,
      plate: v.number,
      mechanic: defaultMec ? defaultMec.name : '',
      mechanicId: defaultMec ? defaultMec.id : '',
      serviceId: '',
      problem: '',
      diagnosis: '',
      estimatedCost: '$250.00',
      status: 'Pending',
      odometer: String(v.mileage || ''),
      fuelLevel: '1/2',
      intakeNotes: 'Standard intake check-in',
      customerApproval: 'Approved',
    })
    setIsCreateJobOpen(true)
  }

  const handleCatalogServiceSelect = (serviceId) => {
    const selected = servicesCatalog.find((s) => String(s.id) === String(serviceId))
    if (selected) {
      setJobFormData((prev) => ({
        ...prev,
        serviceId: selected.id,
        problem: prev.problem || selected.name,
        diagnosis: prev.diagnosis || selected.description || `Execute ${selected.name} standard procedure`,
        estimatedCost: `$${Number(selected.estimatedCost || 250).toFixed(2)}`,
      }))
    } else {
      setJobFormData((prev) => ({ ...prev, serviceId: '' }))
    }
  }

  const handleCreateVehicle = async (e) => {
    e.preventDefault()
    if (!formData.number || !formData.brand || !formData.model) return
    createVehicleMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdateVehicle = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) return
    updateVehicleMutation.mutate({ id: selectedVehicle.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return
    deleteVehicleMutation.mutate(selectedVehicle.id)
    setIsDeleteOpen(false)
  }

  const handleCreateJobSubmit = async (e) => {
    e.preventDefault()
    if (!jobFormData.problem) return
    try {
      await createJobMutation.mutateAsync({
        ...jobFormData,
        intakeInspection: {
          odometer: jobFormData.odometer,
          fuelLevel: jobFormData.fuelLevel,
          notes: jobFormData.intakeNotes,
        },
      })
      setIsCreateJobOpen(false)
    } catch {
      // Handled by mutation
    }
  }

  const handleCopyVin = (vin) => {
    if (!vin) return
    navigator.clipboard.writeText(vin)
    setCopiedVin(true)
    addToast('VIN copied to clipboard', 'info')
    setTimeout(() => setCopiedVin(false), 2000)
  }

  // Filter repair jobs for a specific vehicle
  const getVehicleJobs = (vehicle) => {
    if (!vehicle) return []
    return repairJobs.filter((j) => {
      const matchId = j.vehicleId && vehicle.id && String(j.vehicleId) === String(vehicle.id)
      const matchPlate =
        j.plate && vehicle.number && j.plate.trim().toLowerCase() === vehicle.number.trim().toLowerCase()
      return matchId || matchPlate
    })
  }

  const vehicleList = Array.isArray(vehicles) ? vehicles : []
  const query = searchQuery.trim().toLowerCase()
  const filteredVehicles = vehicleList.filter((v) => {
    const matchesSearch =
      !query ||
      (v?.number || '').toLowerCase().includes(query) ||
      (v?.brand || '').toLowerCase().includes(query) ||
      (v?.model || '').toLowerCase().includes(query) ||
      (v?.owner || '').toLowerCase().includes(query) ||
      (v?.vin || '').toLowerCase().includes(query)

    const matchesFuel = fuelFilter === 'All' || v.fuelType === fuelFilter
    return matchesSearch && matchesFuel
  })

  // Selected Vehicle Analytics
  const selectedVehicleJobs = selectedVehicle ? getVehicleJobs(selectedVehicle) : []
  const selectedOwner = selectedVehicle
    ? customers.find(
        (c) =>
          (selectedVehicle.ownerId && String(c.id) === String(selectedVehicle.ownerId)) ||
          (selectedVehicle.owner && c.name?.toLowerCase() === selectedVehicle.owner?.toLowerCase())
      )
    : null

  const totalVehicleLifetimeSpent = selectedVehicleJobs.reduce((sum, j) => {
    const cost = parseFloat(String(j.actualCost || j.estimatedCost || '0').replace(/[^0-9.]/g, '')) || 0
    return sum + cost
  }, 0)

  const activeJob = selectedVehicleJobs.find((j) =>
    ['Repairing', 'Diagnosing', 'Waiting for Parts', 'Pending', 'In Progress', 'Ready for Pickup'].includes(j.status)
  )

  const completedCount = selectedVehicleJobs.filter((j) => j.status === 'Completed').length
  const activeCount = selectedVehicleJobs.filter((j) =>
    ['Repairing', 'Diagnosing', 'Waiting for Parts', 'In Progress', 'Ready for Pickup'].includes(j.status)
  ).length

  // Filtered Service History in View Modal
  const filteredHistory = selectedVehicleJobs.filter((j) => {
    const sq = historySearch.trim().toLowerCase()
    const matchesSearch =
      !sq ||
      (j?.orderNumber || '').toLowerCase().includes(sq) ||
      (j?.problem || '').toLowerCase().includes(sq) ||
      (j?.diagnosis || '').toLowerCase().includes(sq) ||
      (j?.mechanic || '').toLowerCase().includes(sq) ||
      (j?.partsUsed || []).some(
        (p) => (p?.name || '').toLowerCase().includes(sq) || (p?.partCode || '').toLowerCase().includes(sq)
      )

    let matchesStatus = true
    if (historyFilter === 'Completed') matchesStatus = j.status === 'Completed'
    else if (historyFilter === 'In Progress') {
      matchesStatus = ['Repairing', 'Diagnosing', 'Waiting for Parts', 'In Progress', 'Ready for Pickup'].includes(j.status)
    } else if (historyFilter === 'Pending') matchesStatus = j.status === 'Pending'

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.vehicleRegistry')}</h1>
          <p className="text-xs text-app-muted mt-1">{vehicles.length} {t('vehicles.subtitle')}</p>
        </div>
        {can('vehicles', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            {t('vehicles.addVehicle')}
          </button>
        )}
      </div>

      {/* Fuel Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {fuelOptions.map((f) => {
          const count = f === 'All' ? vehicles.length : vehicles.filter((v) => v.fuelType === f).length
          const isActive = fuelFilter === f
          return (
            <button
              key={f}
              onClick={() => setFuelFilter(f)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {f === 'All' ? t('common.all') : f}
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
          {(searchQuery || fuelFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFuelFilter('All')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && vehicles.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filteredVehicles.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || fuelFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || fuelFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setFuelFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('vehicles.plateNumber')}</th>
                  <th className="px-6 py-3 font-semibold">{t('appointments.vehicle')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">Fuel</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('vehicles.mileage')}</th>
                  <th className="px-6 py-3 font-semibold">{t('vehicles.owner')}</th>
                  <th className="px-6 py-3 font-semibold">Service History</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredVehicles.map((v) => {
                  const vJobs = getVehicleJobs(v)
                  const hasActive = vJobs.some((j) =>
                    ['Repairing', 'Diagnosing', 'Waiting for Parts', 'In Progress', 'Ready for Pickup'].includes(j.status)
                  )
                  const completedJobs = vJobs.filter((j) => j.status === 'Completed').length

                  return (
                    <tr
                      key={v.id}
                      onClick={() => handleOpenView(v)}
                      className="hover:bg-app-hover/60 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-3.5 font-mono font-bold text-app-accent">
                        <span className="px-2 py-0.5 rounded-lg bg-app-accent/10 border border-app-accent/20">
                          {v.number}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {v.image ? (
                            <img
                              src={v.image}
                              alt={`${v.brand} ${v.model}`}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-app-border bg-app-hover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-app-hover border border-app-border flex items-center justify-center text-app-muted flex-shrink-0">
                              <Car size={20} weight="duotone" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-app-text group-hover:text-app-accent transition-colors">
                              {v.brand} {v.model}
                            </p>
                            <p className="text-[10px] text-app-muted">
                              {v.year} · {v.color}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <GasPump size={13} className="text-app-accent" />
                          {v.fuelType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-app-muted tabular-nums hidden md:table-cell">
                        {Number(v.mileage || 0).toLocaleString()} km
                      </td>
                      <td className="px-6 py-3.5 font-medium text-app-text">{v.owner}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {vJobs.length > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                hasActive
                                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              <ClockCounterClockwise size={13} weight="bold" />
                              <span>
                                {vJobs.length} {vJobs.length === 1 ? 'Order' : 'Orders'}
                              </span>
                              {hasActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" title="Active in workshop" />
                              )}
                            </span>
                          ) : (
                            <span className="text-[11px] text-app-muted italic">No service history</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenView(v)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-accent hover:bg-app-hover transition-colors cursor-pointer"
                            title="View Vehicle & Service History"
                          >
                            <Eye size={15} />
                          </button>
                          {can('vehicles', 'update') && (
                            <button
                              onClick={() => handleOpenEdit(v)}
                              className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                              title={t('common.edit')}
                            >
                              <PencilSimple size={15} />
                            </button>
                          )}
                          {can('vehicles', 'delete') && (
                            <button
                              onClick={() => handleOpenDelete(v)}
                              className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors cursor-pointer"
                              title={t('common.delete')}
                            >
                              <Trash size={15} />
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

      {/* Register Vehicle Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('vehicles.createVehicle')}>
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.plateNumber')} *</label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                placeholder="e.g. 2AB-9988"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.vin')}</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="17-character VIN"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.brand')} *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Toyota, Lexus..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.model')} *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Camry, RX350..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.year')}</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.color')}</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Black, Pearl White..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.mileage')}</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="45000"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.owner')} *</label>
              <select
                value={formData.owner}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, owner: e.target.value, ownerId: c ? c.id : '' })
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
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Vehicle Image (Optional)</label>
            <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createVehicleMutation.isPending}>
              {t('vehicles.createVehicle')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`${t('vehicles.editVehicle')}: ${selectedVehicle?.number}`}
      >
        <form onSubmit={handleUpdateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.plateNumber')} *</label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.vin')}</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.brand')} *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.model')} *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.year')}</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.color')}</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.mileage')}</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.owner')} *</label>
              <select
                value={formData.owner}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, owner: e.target.value, ownerId: c ? c.id : '' })
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
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Vehicle Image (Optional)</label>
            <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateVehicleMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Vehicle & Comprehensive Lifetime Service History Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Vehicle Profile & Service History"
        maxWidth="max-w-4xl"
      >
        {selectedVehicle && (
          <div className="space-y-5 text-xs">
            {/* Top Vehicle Overview Card */}
            <div className="p-4 bg-app-hover/50 rounded-2xl border border-app-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {selectedVehicle.image ? (
                  <img
                    src={selectedVehicle.image}
                    alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-app-border bg-app-hover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent flex-shrink-0">
                    <Car size={32} weight="duotone" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-app-text">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-app-card border border-app-border text-app-muted font-medium">
                      {selectedVehicle.year}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-xs text-app-accent px-2 py-0.5 rounded-md bg-app-accent/10 border border-app-accent/20">
                      {selectedVehicle.number}
                    </span>
                    {selectedVehicle.vin && (
                      <button
                        onClick={() => handleCopyVin(selectedVehicle.vin)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-app-muted hover:text-app-text px-2 py-0.5 rounded-md bg-app-input border border-app-border transition-colors cursor-pointer"
                        title="Click to copy VIN"
                      >
                        {copiedVin ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        VIN: {selectedVehicle.vin}
                      </button>
                    )}
                    <span className="text-[11px] text-app-muted">
                      {selectedVehicle.color} · {selectedVehicle.fuelType}
                    </span>
                  </div>
                </div>
              </div>

              {can('repair_jobs', 'create') && (
                <button
                  onClick={() => handleOpenCreateJob(selectedVehicle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle cursor-pointer flex-shrink-0"
                >
                  <Plus size={14} weight="bold" />
                  Book New Work Order
                </button>
              )}
            </div>

            {/* Owner Details & Vehicle Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Owner Information */}
              <div className="p-3.5 bg-app-card rounded-xl border border-app-border space-y-1.5">
                <p className="text-[10px] text-app-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <User size={13} className="text-app-accent" /> Registered Owner
                </p>
                <p className="font-bold text-sm text-app-text">{selectedVehicle.owner}</p>
                {selectedOwner?.phone && (
                  <p className="text-[11px] text-app-muted flex items-center gap-1">
                    <Phone size={12} /> {selectedOwner.phone}
                  </p>
                )}
                {selectedOwner?.email && (
                  <p className="text-[11px] text-app-muted flex items-center gap-1 truncate">
                    <EnvelopeSimple size={12} /> {selectedOwner.email}
                  </p>
                )}
                {selectedOwner?.address && (
                  <p className="text-[11px] text-app-muted flex items-center gap-1 truncate">
                    <MapPin size={12} /> {selectedOwner.address}
                  </p>
                )}
              </div>

              {/* Odometer & Mileage Status */}
              <div className="p-3.5 bg-app-card rounded-xl border border-app-border space-y-1.5">
                <p className="text-[10px] text-app-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Gauge size={13} className="text-emerald-500" /> Recorded Odometer
                </p>
                <p className="font-mono font-bold text-lg text-app-text">
                  {Number(selectedVehicle.mileage || 0).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-app-muted">km</span>
                </p>
                <p className="text-[11px] text-app-muted">
                  Fuel: <span className="font-medium text-app-text">{selectedVehicle.fuelType}</span>
                </p>
                <p className="text-[11px] text-app-muted">
                  Transmission: <span className="font-medium text-app-text">{selectedVehicle.transmission || 'Automatic'}</span>
                </p>
              </div>

              {/* Current Workshop Status */}
              <div className="p-3.5 bg-app-card rounded-xl border border-app-border space-y-1.5">
                <p className="text-[10px] text-app-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Wrench size={13} className="text-amber-500" /> Workshop Status
                </p>
                {activeJob ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      <span className="font-bold text-sky-600 dark:text-sky-400">In Workshop</span>
                    </div>
                    <p className="text-[11px] text-app-muted font-mono">{activeJob.orderNumber} - {activeJob.status}</p>
                    <p className="text-[11px] text-app-text font-medium truncate">{activeJob.problem}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle size={15} weight="fill" />
                      <span>Ready / Roadworthy</span>
                    </div>
                    <p className="text-[11px] text-app-muted">No active repairs pending for this vehicle.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lifetime Service History Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-app-input/60 border border-app-border text-center">
                <span className="text-[10px] text-app-muted uppercase font-bold block">Total Services</span>
                <span className="font-bold text-base text-app-text font-mono mt-0.5 block">
                  {selectedVehicleJobs.length}
                </span>
                <span className="text-[10px] text-app-muted">Work Orders Logged</span>
              </div>
              <div className="p-3 rounded-xl bg-app-input/60 border border-app-border text-center">
                <span className="text-[10px] text-app-muted uppercase font-bold block">Completed Services</span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  {completedCount}
                </span>
                <span className="text-[10px] text-app-muted">Finished Repairs</span>
              </div>
              <div className="p-3 rounded-xl bg-app-input/60 border border-app-border text-center">
                <span className="text-[10px] text-app-muted uppercase font-bold block">Active / Pending</span>
                <span className="font-bold text-base text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                  {activeCount}
                </span>
                <span className="text-[10px] text-app-muted">In Progress</span>
              </div>
              <div className="p-3 rounded-xl bg-app-input/60 border border-app-border text-center">
                <span className="text-[10px] text-app-muted uppercase font-bold block">Lifetime Cost</span>
                <span className="font-bold text-base text-app-accent font-mono mt-0.5 block">
                  ${totalVehicleLifetimeSpent.toFixed(2)}
                </span>
                <span className="text-[10px] text-app-muted">Total Garage Spend</span>
              </div>
            </div>

            {/* Digital Service History Passport & Job Orders Timeline */}
            <div className="p-4 bg-app-card rounded-2xl border border-app-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-3">
                <div>
                  <h4 className="text-sm font-bold text-app-text flex items-center gap-2">
                    <ClockCounterClockwise size={18} className="text-emerald-500" weight="bold" />
                    Complete Service History & Digital Passport
                  </h4>
                  <p className="text-[11px] text-app-muted mt-0.5">
                    Chronological record of all diagnostic reports, maintenance jobs, and spare parts.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['All', 'Completed', 'In Progress', 'Pending'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        historyFilter === f
                          ? 'bg-app-accent text-app-accentText'
                          : 'bg-app-input text-app-muted hover:text-app-text'
                      }`}
                    >
                      {f} (
                      {f === 'All'
                        ? selectedVehicleJobs.length
                        : f === 'Completed'
                        ? completedCount
                        : f === 'In Progress'
                        ? activeCount
                        : selectedVehicleJobs.filter((j) => j.status === 'Pending').length}
                      )
                    </button>
                  ))}
                </div>
              </div>

              {/* Service History Search */}
              {selectedVehicleJobs.length > 0 && (
                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                  <input
                    type="text"
                    placeholder="Search past repairs, problems, diagnoses, mechanics, or parts..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                  />
                </div>
              )}

              {/* Service History Cards List */}
              {filteredHistory.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredHistory.map((job) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl bg-app-hover/40 border border-app-border space-y-2.5 transition-all hover:border-app-accent/40"
                    >
                      {/* Job Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-app-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-app-accent">{job.orderNumber}</span>
                          <span className="text-[11px] text-app-muted flex items-center gap-1">
                            <CalendarBlank size={12} /> {job.createdAt}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} />
                          <span className="font-mono font-bold text-app-text text-xs">
                            {job.actualCost || job.estimatedCost}
                          </span>
                        </div>
                      </div>

                      {/* Problem & Diagnosis */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-app-text flex items-start gap-1.5">
                          <Wrench size={14} className="text-app-accent flex-shrink-0 mt-0.5" />
                          <span>{job.problem}</span>
                        </p>
                        {job.diagnosis && (
                          <div className="p-2 rounded-lg bg-app-card border border-app-border/80 text-[11px] text-app-muted">
                            <span className="font-semibold text-app-text">Technician Findings: </span>
                            {job.diagnosis}
                          </div>
                        )}
                      </div>

                      {/* DVI Intake Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                        <div className="p-1.5 rounded-lg bg-app-card border border-app-border flex items-center justify-between">
                          <span className="text-app-muted flex items-center gap-1">
                            <Gauge size={11} /> Intake Odometer
                          </span>
                          <span className="font-mono font-bold text-app-text">{job.odometer || '—'} km</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-app-card border border-app-border flex items-center justify-between">
                          <span className="text-app-muted flex items-center gap-1">
                            <User size={11} /> Technician
                          </span>
                          <span className="font-semibold text-app-text truncate">{job.mechanic || 'Workshop Team'}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-app-card border border-app-border flex items-center justify-between col-span-2 sm:col-span-1">
                          <span className="text-app-muted flex items-center gap-1">
                            <ShieldCheck size={11} /> Quote Approval
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {job.customerApproval || 'Approved'}
                          </span>
                        </div>
                      </div>

                      {/* Parts Used Breakdown */}
                      {job.partsUsed && job.partsUsed.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-app-card border border-app-border space-y-1.5">
                          <p className="text-[10px] text-app-muted uppercase font-bold flex items-center gap-1">
                            <Package size={12} className="text-amber-500" /> Replaced Spare Parts ({job.partsUsed.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.partsUsed.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-medium border border-amber-500/20"
                                title={`Part SKU: ${p.partCode || p.name}`}
                              >
                                <strong>{p.quantity}x</strong> {p.name}
                                {p.unitPrice ? ` ($${Number(p.unitPrice).toFixed(2)})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Service Due Recommendation */}
                      {(job.nextServiceDueDate || job.nextServiceDueKm) && (
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                          <span>Recommended Next Maintenance:</span>
                          <span className="font-semibold">
                            {job.nextServiceDueDate ? job.nextServiceDueDate : ''}{' '}
                            {job.nextServiceDueKm ? `at ${Number(job.nextServiceDueKm).toLocaleString()} km` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedVehicleJobs.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-app-hover border border-app-border flex items-center justify-center text-app-muted mx-auto">
                    <ClockCounterClockwise size={24} weight="duotone" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-app-text">No Service History Logged</h5>
                    <p className="text-xs text-app-muted mt-0.5">
                      This vehicle has not had any repair jobs or maintenance orders registered yet.
                    </p>
                  </div>
                  {can('repair_jobs', 'create') && (
                    <button
                      onClick={() => handleOpenCreateJob(selectedVehicle)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-subtle"
                    >
                      <Plus size={14} weight="bold" />
                      Create First Work Order
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-app-muted text-center py-4 italic">
                  No service records matching "{historySearch}".
                </p>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 rounded-xl bg-app-hover hover:bg-app-hover/80 text-app-text transition-colors text-xs font-semibold cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Direct Work Order Creation Modal for this Vehicle */}
      <Modal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        title={`New Work Order: ${jobFormData.plate} (${jobFormData.vehicle})`}
      >
        <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
          {/* Service Package Selector */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
            <label className="block text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <Sparkle size={15} weight="fill" className="text-emerald-500" />
              Choose Service Package (Auto-configures cost & required parts)
            </label>
            <select
              value={jobFormData.serviceId}
              onChange={(e) => handleCatalogServiceSelect(e.target.value)}
              className="w-full px-3 py-2 bg-app-card border border-emerald-500/30 rounded-xl text-app-text font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Service Package (e.g. Oil Change, Brake Service) --</option>
              {servicesCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${Number(s.estimatedCost || 0).toFixed(2)}) — {s.requiredParts?.length || 0} required parts
                </option>
              ))}
            </select>

            {/* Live Auto Stock-Out Preview */}
            {activeCatalogService && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-1.5">
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Package size={13} />
                  Auto Stock-Out Preview for "{activeCatalogService.name}":
                </p>
                {activeCatalogService.requiredParts && activeCatalogService.requiredParts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeCatalogService.requiredParts.map((p, idx) => {
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
                                Out of stock
                              </>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-app-muted italic">This service requires no spare parts inventory deduction.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.customer')} *</label>
              <select
                value={jobFormData.customer}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setJobFormData({ ...jobFormData, customer: e.target.value, customerId: c ? c.id : '' })
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
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')} *</label>
              <select
                value={jobFormData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setJobFormData({ ...jobFormData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
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
          </div>

          {/* DVI Intake info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-app-hover/40 border border-app-border rounded-xl">
            <div>
              <label className="block text-app-muted font-medium mb-1 flex items-center gap-1">
                <Gauge size={12} /> Odometer (km)
              </label>
              <input
                type="number"
                value={jobFormData.odometer}
                onChange={(e) => setJobFormData({ ...jobFormData, odometer: e.target.value })}
                placeholder="e.g. 52300"
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text font-mono focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1 flex items-center gap-1">
                <GasPump size={12} /> Fuel Level
              </label>
              <select
                value={jobFormData.fuelLevel}
                onChange={(e) => setJobFormData({ ...jobFormData, fuelLevel: e.target.value })}
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Empty">Empty</option>
                <option value="1/4">1/4 Tank</option>
                <option value="1/2">1/2 Tank</option>
                <option value="3/4">3/4 Tank</option>
                <option value="Full">Full Tank</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Estimated Cost</label>
              <input
                type="text"
                value={jobFormData.estimatedCost}
                onChange={(e) => setJobFormData({ ...jobFormData, estimatedCost: e.target.value })}
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-lg text-app-text font-semibold focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.description')} / Problem *</label>
            <textarea
              rows={2}
              required
              value={jobFormData.problem}
              onChange={(e) => setJobFormData({ ...jobFormData, problem: e.target.value })}
              placeholder="e.g. Brake pad wear squeal, oil renewal service"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={2}
              value={jobFormData.diagnosis}
              onChange={(e) => setJobFormData({ ...jobFormData, diagnosis: e.target.value })}
              placeholder="e.g. Replace brake pads, inspect rotor thickness"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsCreateJobOpen(false)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteVehicle}
        title={t('common.delete')}
        message={t('vehicles.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
