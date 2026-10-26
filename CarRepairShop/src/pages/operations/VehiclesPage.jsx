import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  GasPump,
  Car,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '../../hooks/useVehicles'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useInventory } from '../../hooks/useInventory'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Modal,
  ImageUpload,
  ConfirmDialog,
  EmptyState,
  TableSkeleton,
  LoadingButton,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooterBar,
  SearchableSelect,
  Input,
} from '../../components/ui'
import VehicleHistoryDrawer from '../../components/workshop/VehicleHistoryDrawer'
import FastIntakeModal from '../../components/workshop/FastIntakeModal'
import JobCardDrawer from '../../components/workshop/JobCardDrawer'

const fuelOptions = ['All', 'Petrol', 'Diesel', 'Hybrid', 'Electric']

export default function VehiclesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { addToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [fuelFilter, setFuelFilter] = useState('All')
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useVehicles({ page, limit: 10, search: debouncedSearch })
  const { items: vehicles, totalCount, totalPages } = usePaginationData(response, { page, limit: 10 })

  const { data: rawCustomers = [] } = useCustomers({ all: true })
  const { data: rawRepairJobs = [] } = useRepairJobs({ all: true })
  const { data: rawMechanics = [] } = useMechanics({ all: true })
  const { data: rawServices = [] } = useServicesCatalog({ all: true })
  const { data: rawInventory = [] } = useInventory({ all: true })

  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])
  const repairJobs = Array.isArray(rawRepairJobs) ? rawRepairJobs : (rawRepairJobs?.data || [])
  const mechanics = Array.isArray(rawMechanics) ? rawMechanics : (rawMechanics?.data || [])
  const services = Array.isArray(rawServices) ? rawServices : (rawServices?.data || [])
  const inventory = Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])

  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  // Modal & Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Fast Intake & Job Card Drawer State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [intakeInitialData, setIntakeInitialData] = useState(null)
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false)
  const [activeJobForDrawer, setActiveJobForDrawer] = useState(null)

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

  const handleOpenHistory = (v) => {
    setSelectedVehicle(v)
    setIsHistoryDrawerOpen(true)
  }

  const handleOpenDelete = (v, e) => {
    if (e) e.stopPropagation()
    setSelectedVehicle(v)
    setIsDeleteOpen(true)
  }

  const handleStartRepairForVehicle = (v) => {
    const cust = customers.find(
      (c) => (v.ownerId && String(c.id) === String(v.ownerId)) || (v.owner && c.name === v.owner)
    )
    setIntakeInitialData({
      vehicle: `${v.brand} ${v.model}`,
      vehicleId: v.id,
      plate: v.number,
      customer: cust ? cust.name : v.owner || '',
      customerId: cust ? cust.id : v.ownerId || '',
      odometer: v.mileage ? String(v.mileage) : '',
      problem: 'Routine Maintenance & Inspection',
    })
    setIsIntakeOpen(true)
  }

  const handleIntakeSuccess = (createdJob) => {
    addToast(`Repair Order ${createdJob.orderNumber || ''} created successfully!`, 'success')
    setActiveJobForDrawer(createdJob)
    setIsJobDrawerOpen(true)
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

  // Filter repair jobs for a specific vehicle in table row
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
  const filteredVehicles = vehicleList.filter((v) => fuelFilter === 'All' || v.fuelType === fuelFilter)

  // Current selected vehicle owner details
  const selectedOwner = selectedVehicle
    ? customers.find(
        (c) =>
          (selectedVehicle.ownerId && String(c.id) === String(selectedVehicle.ownerId)) ||
          (selectedVehicle.owner && c.name?.toLowerCase() === selectedVehicle.owner?.toLowerCase())
      )
    : null

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.vehicleRegistry')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {totalCount}
          </span>
        </div>
        {can('vehicles', 'create') && (
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={14} weight="bold" />
            <span>{t('vehicles.addVehicle')}</span>
          </Button>
        )}
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {fuelOptions.map((f) => {
            const count = f === 'All' ? vehicles.length : vehicles.filter((v) => v.fuelType === f).length
            const isActive = fuelFilter === f
            return (
              <button
                key={f}
                onClick={() => {
                  setFuelFilter(f)
                  setPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-app-accent text-app-accentText font-semibold'
                    : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                }`}
              >
                <span>{f === 'All' ? t('common.all') : f}</span>
                <span className="text-[10px] font-mono opacity-80">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-60">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
          <Input
            type="text"
            placeholder={t('common.quickSearch')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading && vehicles.length === 0 ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery || fuelFilter !== 'All' ? t('common.filter') : undefined}
            onAction={
              searchQuery || fuelFilter !== 'All'
                ? () => {
                    setSearchQuery('')
                    setFuelFilter('All')
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
              <TableHead>{t('vehicles.plateNumber')}</TableHead>
              <TableHead>{t('appointments.vehicle')}</TableHead>
              <TableHead className="hidden lg:table-cell">Fuel</TableHead>
              <TableHead className="hidden md:table-cell">{t('vehicles.mileage')}</TableHead>
              <TableHead>{t('vehicles.owner')}</TableHead>
              <TableHead>Service History</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((v) => {
              const vJobs = getVehicleJobs(v)
              const hasActive = vJobs.some((j) =>
                ['Repairing', 'Diagnosing', 'Waiting for Parts', 'In Progress', 'Ready for Pickup'].includes(j.status)
              )

              return (
                <TableRow
                  key={v.id}
                  onClick={() => handleOpenHistory(v)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono font-bold text-app-accent">
                    <span className="px-1.5 py-0.5 rounded-sm bg-app-accent/10 border border-app-accent/20">
                      {v.number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {v.image ? (
                        <img
                          src={v.image}
                          alt={`${v.brand} ${v.model}`}
                          className="w-8 h-8 rounded-sm object-cover ring-1 ring-app-border bg-app-hover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-sm bg-app-hover border border-app-border flex items-center justify-center text-app-muted flex-shrink-0">
                          <Car size={16} weight="duotone" />
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
                  </TableCell>
                  <TableCell className="text-app-muted hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <GasPump size={13} className="text-app-accent" />
                      {v.fuelType}
                    </span>
                  </TableCell>
                  <TableCell className="text-app-muted tabular-nums hidden md:table-cell">
                    {Number(v.mileage || 0).toLocaleString()} km
                  </TableCell>
                  <TableCell className="font-medium text-app-text">{v.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {vJobs.length > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
                            hasActive
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          <ClockCounterClockwise size={12} weight="bold" />
                          <span>
                            {vJobs.length} {vJobs.length === 1 ? 'Order' : 'Orders'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-app-muted italic">No service history</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {can('vehicles', 'update') && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                          title={t('common.edit')}
                        >
                          <PencilSimple size={14} />
                        </button>
                      )}
                      {can('vehicles', 'delete') && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDelete(v, e)}
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

      {/* Register Vehicle Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('vehicles.createVehicle')} maxWidth="max-w-2xl">
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.plateNumber')} *</label>
              <Input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                placeholder="e.g. 2AB-9988"
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.vin')}</label>
              <Input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="17-character VIN"
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.brand')} *</label>
              <Input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Toyota, Lexus..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.model')} *</label>
              <Input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Camry, RX350..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.year')}</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.color')}</label>
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Black, Pearl White..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.mileage')}</label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.owner')} *</label>
              <SearchableSelect
                value={formData.owner}
                onChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, owner: val, ownerId: c ? c.id : '' })
                }}
                options={customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.phone ? `Phone: ${c.phone}` : undefined,
                }))}
                placeholder="Select vehicle owner..."
                searchPlaceholder="Search customer by name or phone..."
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Vehicle Image (Optional)</label>
            <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              {t('common.cancel')}
            </Button>
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
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUpdateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.plateNumber')} *</label>
              <Input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.vin')}</label>
              <Input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.brand')} *</label>
              <Input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.model')} *</label>
              <Input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.year')}</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.color')}</label>
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.mileage')}</label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('vehicles.owner')} *</label>
              <SearchableSelect
                value={formData.owner}
                onChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, owner: val, ownerId: c ? c.id : '' })
                }}
                options={customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.phone ? `Phone: ${c.phone}` : undefined,
                }))}
                placeholder="Select vehicle owner..."
                searchPlaceholder="Search customer by name or phone..."
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Vehicle Image (Optional)</label>
            <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={updateVehicleMutation.isPending}>
              {t('common.saveChanges')}
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

      {/* Vehicle 360° Passport & Service History Drawer */}
      <VehicleHistoryDrawer
        key={selectedVehicle?.id || 'none-veh'}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        vehicle={selectedVehicle}
        owner={selectedOwner}
        repairJobs={repairJobs}
        onStartRepair={(v) => handleStartRepairForVehicle(v)}
        onEditVehicle={(v) => handleOpenEdit(v)}
      />

      {/* Fast Vehicle Intake Modal */}
      <FastIntakeModal
        key={intakeInitialData?.plate || 'new-intake'}
        isOpen={isIntakeOpen}
        onClose={() => {
          setIsIntakeOpen(false)
          setIntakeInitialData(null)
        }}
        initialData={intakeInitialData}
        onSuccess={handleIntakeSuccess}
      />

      {/* Job Card Drawer */}
      <JobCardDrawer
        key={activeJobForDrawer?.id || 'none-job'}
        isOpen={isJobDrawerOpen}
        onClose={() => {
          setIsJobDrawerOpen(false)
          setActiveJobForDrawer(null)
        }}
        job={activeJobForDrawer}
        mechanics={mechanics}
        services={services}
        inventory={inventory}
      />
    </div>
  )
}
