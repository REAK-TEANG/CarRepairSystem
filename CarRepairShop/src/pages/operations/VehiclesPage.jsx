import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, GasPump, Car, User, IdentificationCard, Gauge } from '@phosphor-icons/react'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '../../hooks/useVehicles'
import { useCustomers } from '../../hooks/useCustomers'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

export default function VehiclesPage() {
  const { can } = useAuth()
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: customers = [] } = useCustomers()

  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  const [searchQuery, setSearchQuery] = useState('')

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
    fuelType: 'Gasoline',
    mileage: 0,
    owner: '',
    ownerId: '',
  })

  const handleOpenAdd = () => {
    const defaultOwner = customers[0] ? customers[0].name : ''
    const defaultOwnerId = customers[0] ? customers[0].id : ''
    setFormData({
      number: '',
      vin: '',
      brand: '',
      model: '',
      year: 2023,
      color: 'Black',
      fuelType: 'Gasoline',
      mileage: 25000,
      owner: defaultOwner,
      ownerId: defaultOwnerId,
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
      mileage: v.mileage,
      owner: v.owner,
      ownerId: v.ownerId,
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

  const handleOwnerChange = (e) => {
    const ownerName = e.target.value
    const matched = customers.find((c) => c.name === ownerName)
    setFormData({
      ...formData,
      owner: ownerName,
      ownerId: matched ? matched.id : '',
    })
  }

  const filtered = vehicles.filter((v) =>
    v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.owner.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">Vehicle Registry</h1>
          <p className="text-xs text-app-muted mt-1">{vehicles.length} registered customer vehicles</p>
        </div>
        {can('vehicles', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Register Vehicle
          </button>
        )}
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search plate, brand, model, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && vehicles.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading vehicle registry...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Plate #</th>
                  <th className="px-6 py-3 font-semibold">Vehicle</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">Fuel</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">Mileage</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{v.number}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{v.brand} {v.model}</p>
                      <p className="text-[10px] text-app-muted">{v.year} · {v.color}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <GasPump size={13} className="text-app-accent" />
                        {v.fuelType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted tabular-nums hidden md:table-cell">
                      {Number(v.mileage).toLocaleString()} km
                    </td>
                    <td className="px-6 py-3.5 font-medium text-app-text">{v.owner}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(v)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {can('vehicles', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit vehicle"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('vehicles', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(v)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Delete vehicle"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">License Plate # *</label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                placeholder="e.g. ABC-9988"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">VIN (Vehicle Identification)</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="17-character VIN"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Make / Brand *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Toyota, BMW..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Model *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Camry, X3..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2023 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="White, Black..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Mileage (km)</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Registered Customer (Owner) *</label>
            <select
              value={formData.owner}
              onChange={handleOwnerChange}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.code} · {c.phone})</option>
              ))}
            </select>
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
              Register Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Vehicle: ${selectedVehicle?.number}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">License Plate # *</label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">VIN</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Make / Brand *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Model *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2023 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Mileage (km)</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Owner</label>
            <select
              value={formData.owner}
              onChange={handleOwnerChange}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Vehicle Specification Sheet">
        {selectedVehicle && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent">
                  <Car size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-app-text">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                  <p className="font-mono text-app-accent font-semibold">{selectedVehicle.number}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-app-hover text-app-muted font-medium">
                {selectedVehicle.year}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> Vehicle Owner
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedVehicle.owner}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Gauge size={12} /> Current Odometer
                </p>
                <p className="font-semibold text-app-text mt-0.5 tabular-nums">{Number(selectedVehicle.mileage).toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <GasPump size={12} /> Fuel System
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedVehicle.fuelType}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Exterior Color</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedVehicle.color}</p>
              </div>
            </div>

            {selectedVehicle.vin && (
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <IdentificationCard size={13} /> VIN
                </p>
                <p className="font-mono text-xs font-semibold text-app-text mt-0.5">{selectedVehicle.vin}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Vehicle Deletion">
        <div className="space-y-4 text-xs">
          <p className="text-app-text">
            Are you sure you want to remove vehicle <span className="font-bold">{selectedVehicle?.number}</span> ({selectedVehicle?.brand} {selectedVehicle?.model})?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Delete Vehicle
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
