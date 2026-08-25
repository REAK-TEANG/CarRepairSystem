import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, GasPump, Car, User, IdentificationCard, Gauge } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '../../hooks/useVehicles'
import { useCustomers } from '../../hooks/useCustomers'
import { useAuth } from '../../context/AuthContext'
import { Modal, ImageUpload, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const fuelOptions = ['All', 'Petrol', 'Diesel', 'Hybrid', 'Electric']

export default function VehiclesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: customers = [] } = useCustomers()

  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  const [searchQuery, setSearchQuery] = useState('')
  const [fuelFilter, setFuelFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Form
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

  const handleOpenView = (v) => {
    setSelectedVehicle(v)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (v) => {
    setSelectedVehicle(v)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.number || !formData.brand || !formData.model) return
    createVehicleMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) return
    updateVehicleMutation.mutate({ id: selectedVehicle.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedVehicle) return
    deleteVehicleMutation.mutate(selectedVehicle.id)
    setIsDeleteOpen(false)
  }

  const vehicleList = Array.isArray(vehicles) ? vehicles : []
  const query = searchQuery.trim().toLowerCase()
  const filtered = vehicleList.filter((v) => {
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
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
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
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
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && vehicles.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
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
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{v.number}</td>
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
                          <p className="font-semibold text-app-text">
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
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(v)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('vehicles', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('vehicles', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(v)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
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

      {/* Register Vehicle Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('vehicles.createVehicle')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
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
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
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
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('vehicles.editVehicle')}: ${selectedVehicle?.number}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateVehicleMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Vehicle Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('vehicles.title')}>
        {selectedVehicle && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-12 h-12 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Car size={24} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h3>
                <p className="font-mono text-app-accent font-semibold">{selectedVehicle.number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.owner')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedVehicle.owner}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.mileage')}</p>
                <p className="font-semibold text-app-text mt-0.5">{Number(selectedVehicle.mileage || 0).toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.year')} / {t('vehicles.color')}</p>
                <p className="font-semibold text-app-text mt-0.5">
                  {selectedVehicle.year} · {selectedVehicle.color}
                </p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.vin')}</p>
                <p className="font-mono text-app-text mt-0.5 truncate">{selectedVehicle.vin || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('vehicles.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
