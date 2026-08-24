import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CheckCircle, XCircle } from '@phosphor-icons/react'
import { useServicesCatalog, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog } from '../../components/ui'

export default function ServicesPage() {
  const { can } = useAuth()
  const { data: services = [], isLoading } = useServicesCatalog()
  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Maintenance',
    estimatedCost: 80,
    laborHours: 1.5,
    description: '',
    isActive: true,
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Maintenance',
      estimatedCost: 100,
      laborHours: 2.0,
      description: '',
      isActive: true,
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedService(s)
    setFormData({
      name: s.name,
      category: s.category,
      estimatedCost: s.estimatedCost,
      laborHours: s.laborHours,
      description: s.description || '',
      isActive: s.isActive,
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedService(s)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedService(s)
    setIsDeleteOpen(true)
  }

  const handleToggleActive = (s) => {
    updateServiceMutation.mutate({
      id: s.id,
      data: { isActive: !s.isActive },
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createServiceMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedService) return
    updateServiceMutation.mutate({ id: selectedService.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedService) return
    deleteServiceMutation.mutate(selectedService.id)
    setIsDeleteOpen(false)
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-xs text-app-muted mt-1">{services.length} available service packages</p>
        </div>
        {can('service_catalog', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Service
          </button>
        )}
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search service name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && services.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading service catalog...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Service Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Labor Hours</th>
                  <th className="px-6 py-3 font-semibold">Standard Cost</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{s.name}</p>
                      <p className="text-[10px] text-app-muted max-w-[280px] truncate">{s.description}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 bg-app-hover rounded-md text-[11px] font-medium text-app-muted">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-app-muted">{s.laborHours} hrs</td>
                    <td className="px-6 py-3.5 font-bold text-app-text tabular-nums">${Number(s.estimatedCost).toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                          s.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#13F287] border border-emerald-500/20'
                            : 'bg-app-hover text-app-muted border border-app-border'
                        }`}
                        title="Click to toggle active status"
                      >
                        {s.isActive ? (
                          <>
                            <CheckCircle size={11} weight="fill" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={11} weight="fill" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(s)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View service"
                        >
                          <Eye size={15} />
                        </button>
                        {can('service_catalog', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit service"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('service_catalog', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(s)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Delete service"
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

      {/* Add Service Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Service Package">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Brake Caliper Overhaul"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Engine">Engine</option>
                <option value="Transmission">Transmission</option>
                <option value="Brakes">Brakes</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Labor (Hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Est. Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Service Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a breakdown of what this service package includes..."
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
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
              Save Service
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Service: ${selectedService?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Engine">Engine</option>
                <option value="Transmission">Transmission</option>
                <option value="Brakes">Brakes</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Labor (Hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Est. Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
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

      {/* View Service Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Service Catalog Specification">
        {selectedService && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedService.name}</h3>
                <span className="text-xs text-app-muted">{selectedService.category}</span>
              </div>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">${Number(selectedService.estimatedCost).toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Standard Labor</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedService.laborHours} Hours</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Catalog Status</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedService.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
            {selectedService.description && (
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Description</p>
                <p className="text-app-text mt-1">{selectedService.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Service Removal"
        message={
          <>
            Are you sure you want to remove <span className="font-bold">{selectedService?.name}</span> from the active service catalog?
          </>
        }
        confirmText="Delete Service"
      />
    </div>
  )
}
