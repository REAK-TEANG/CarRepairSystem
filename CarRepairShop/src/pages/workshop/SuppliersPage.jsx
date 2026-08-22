import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Phone, Buildings, Star, Eye } from '@phosphor-icons/react'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../../hooks/useSuppliers'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

export default function SuppliersPage() {
  const { can } = useAuth()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    categories: '',
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      categories: 'Brakes, Filters',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedSupplier(s)
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      categories: s.categories,
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedSupplier(s)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedSupplier(s)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createSupplierMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedSupplier) return
    updateSupplierMutation.mutate({ id: selectedSupplier.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedSupplier) return
    deleteSupplierMutation.mutate(selectedSupplier.id)
    setIsDeleteOpen(false)
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.categories.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-xs text-app-muted mt-1">{suppliers.length} active parts and fluid suppliers</p>
        </div>
        {can('suppliers', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Supplier
          </button>
        )}
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search supplier, contact, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && suppliers.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading suppliers...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Supplier</th>
                  <th className="px-6 py-3 font-semibold">Contact Person</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Supplied Categories</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Address</th>
                  <th className="px-6 py-3 font-semibold">Rating</th>
                  <th className="px-6 py-3 font-semibold text-center">Active Orders</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-app-hover flex items-center justify-center text-app-accent">
                          <Buildings size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-app-text">{s.name}</p>
                          <p className="text-[10px] text-app-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-app-text">{s.contactPerson}</p>
                      <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {s.phone}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{s.categories}</td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">{s.address}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-app-text">
                        <Star size={14} className="text-amber-500" weight="fill" />
                        {s.rating}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 bg-app-hover rounded-md text-[11px] font-bold text-app-text">
                        {s.activeOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(s)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {can('suppliers', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit supplier"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('suppliers', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(s)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Delete supplier"
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

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Supplier">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bosch Global Supply"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Rachel Green"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 000-0000"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@supplier.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Supplied Categories</label>
              <input
                type="text"
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="Brakes, Fluids, Filters"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Address / Warehouse Hub</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Warehouse address"
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
              Add Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Supplier: ${selectedSupplier?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Supplied Categories</label>
              <input
                type="text"
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

      {/* View Supplier Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Supplier Information">
        {selectedSupplier && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent">
                  <Buildings size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-app-text">{selectedSupplier.name}</h3>
                  <p className="text-[10px] text-app-muted">{selectedSupplier.categories}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                <Star size={14} weight="fill" /> {selectedSupplier.rating}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Contact Representative</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.contactPerson}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Phone</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Email</p>
                <p className="font-semibold text-app-text mt-0.5 truncate">{selectedSupplier.email}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Warehouse Address</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.address}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Supplier Removal">
        <div className="space-y-4 text-xs">
          <p className="text-app-text">
            Are you sure you want to remove <span className="font-bold">{selectedSupplier?.name}</span>?
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
              Delete Supplier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
