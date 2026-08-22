import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Phone, EnvelopeSimple, MapPin } from '@phosphor-icons/react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

export default function CustomersPage() {
  const { can } = useAuth()
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const deleteCustomerMutation = useDeleteCustomer()

  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '' })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || '',
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (customer) => {
    setSelectedCustomer(customer)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (customer) => {
    setSelectedCustomer(customer)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    createCustomerMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedCustomer) return
    updateCustomerMutation.mutate({ id: selectedCustomer.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return
    deleteCustomerMutation.mutate(selectedCustomer.id)
    setIsDeleteOpen(false)
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">Customer Directory</h1>
          <p className="text-xs text-app-muted mt-1">{customers.length} registered customers</p>
        </div>
        {can('customers', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Customer
          </button>
        )}
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && customers.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading customer directory...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Customer Name</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Phone</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Email</th>
                  <th className="px-6 py-3 font-semibold text-center">Vehicles</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Total Spent</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{c.code}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-app-border" />
                        <span className="font-semibold text-app-text">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="text-app-muted" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <EnvelopeSimple size={13} className="text-app-muted" />
                        {c.email}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 bg-app-hover rounded-md text-[11px] font-bold text-app-text">
                        {c.vehiclesCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums hidden md:table-cell">{c.totalSpent}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(c)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {can('customers', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit customer"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('customers', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(c)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Delete customer"
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

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Customer">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 000-0000"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@email.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Residential Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address, City, State"
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
              Create Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Customer: ${selectedCustomer?.code}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Full Name *</label>
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
              <label className="block text-app-muted font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Residential Address</label>
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

      {/* View Customer Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Customer Profile Details">
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-lg border border-app-border">
              <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-app-accent/30" />
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedCustomer.name}</h3>
                <p className="font-mono text-app-accent font-semibold">{selectedCustomer.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Contact Phone</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Email Address</p>
                <p className="font-semibold text-app-text mt-0.5 truncate">{selectedCustomer.email}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Total Revenue Spent</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedCustomer.totalSpent}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Registered Date</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.registrationDate}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="p-3 bg-app-input rounded-lg border border-app-border flex items-start gap-2">
                <MapPin size={16} className="text-app-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-app-muted uppercase font-semibold">Address</p>
                  <p className="text-app-text font-medium">{selectedCustomer.address}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4 text-xs">
          <p className="text-app-text">
            Are you sure you want to delete customer <span className="font-bold">{selectedCustomer?.name}</span> ({selectedCustomer?.code})? This action cannot be undone.
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
              Delete Customer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
