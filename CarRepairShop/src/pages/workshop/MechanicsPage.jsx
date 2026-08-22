import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Wrench, Star, Phone, EnvelopeSimple } from '@phosphor-icons/react'
import { useMechanics, useCreateMechanic, useUpdateMechanic, useDeleteMechanic } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

const statusFilters = ['All', 'Active', 'On Leave', 'Terminated']

export default function MechanicsPage() {
  const { can } = useAuth()
  const { data: mechanics = [], isLoading } = useMechanics()
  const createMechanicMutation = useCreateMechanic()
  const updateMechanicMutation = useUpdateMechanic()
  const deleteMechanicMutation = useDeleteMechanic()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: 'General Maintenance',
    experience: 5,
    status: 'Active',
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      specialization: 'Engine & Transmission',
      experience: 5,
      status: 'Active',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (m) => {
    setSelectedMechanic(m)
    setFormData({
      name: m.name,
      phone: m.phone,
      email: m.email,
      specialization: m.specialization,
      experience: m.experience,
      status: m.status,
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (m) => {
    setSelectedMechanic(m)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (m) => {
    setSelectedMechanic(m)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    createMechanicMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedMechanic) return
    updateMechanicMutation.mutate({ id: selectedMechanic.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedMechanic) return
    deleteMechanicMutation.mutate(selectedMechanic.id)
    setIsDeleteOpen(false)
  }

  const filtered = mechanics.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || m.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const totalActive = mechanics.filter(m => m.status === 'Active').length
  const totalActiveJobs = mechanics.reduce((sum, m) => sum + (m.activeJobs || 0), 0)
  const avgRating = mechanics.length
    ? (mechanics.reduce((sum, m) => sum + (m.rating || 5), 0) / mechanics.length).toFixed(1)
    : '5.0'

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">Mechanic Management</h1>
          <p className="text-xs text-app-muted mt-1">{totalActive} active mechanics on staff</p>
        </div>
        {can('mechanics', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Mechanic
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Mechanics</p>
          <p className="text-xl font-bold tabular-nums text-app-text">{mechanics.length}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Active Today</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{totalActive}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">In-Progress Jobs</p>
          <p className="text-xl font-bold tabular-nums text-app-accent">{totalActiveJobs}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Avg. Rating</p>
          <p className="text-xl font-bold tabular-nums text-app-text flex items-center gap-1">
            <Star size={16} className="text-amber-500" weight="fill" />
            {avgRating}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((filter) => {
          const count = filter === 'All'
            ? mechanics.length
            : mechanics.filter(m => m.status === filter).length
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {filter}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search by name, code, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && mechanics.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading mechanics...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Mechanic</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Specialization</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Contact</th>
                  <th className="px-6 py-3 font-semibold text-center">Exp.</th>
                  <th className="px-6 py-3 font-semibold text-center">Active Jobs</th>
                  <th className="px-6 py-3 font-semibold text-center hidden md:table-cell">Completed</th>
                  <th className="px-6 py-3 font-semibold text-center">Rating</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{m.code}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-app-accent/15 border border-app-accent/30 rounded-md flex items-center justify-center text-app-accent font-bold text-[10px]">
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-semibold text-app-text">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-app-muted">
                        <Wrench size={13} className="text-app-accent" />
                        {m.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-app-muted flex items-center gap-1"><Phone size={11} />{m.phone}</p>
                        <p className="text-app-muted flex items-center gap-1"><EnvelopeSimple size={11} />{m.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center text-app-muted">{m.experience}y</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        m.activeJobs > 0 ? 'bg-app-accent/15 text-app-accent' : 'bg-app-hover text-app-muted'
                      }`}>
                        {m.activeJobs}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold tabular-nums text-app-text hidden md:table-cell">{m.completedJobs}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={12} weight="fill" />
                        {m.rating}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        m.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(m)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {can('mechanics', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit mechanic"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('mechanics', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(m)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Delete mechanic"
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

      {/* Add Mechanic Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Mechanic">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Jordan Hayes"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone *</label>
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
              <label className="block text-app-muted font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mechanic@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Brakes & Transmission"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Years of Experience</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
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
              Add Mechanic
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Mechanic Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Mechanic: ${selectedMechanic?.name}`}>
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
              <label className="block text-app-muted font-medium mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
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

      {/* View Mechanic Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Technician Profile Card">
        {selectedMechanic && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedMechanic.name}</h3>
                <p className="font-mono text-app-accent font-semibold">{selectedMechanic.code}</p>
              </div>
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                <Star size={14} weight="fill" /> {selectedMechanic.rating}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Specialization</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedMechanic.specialization}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Experience</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedMechanic.experience} Years</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Active Workload</p>
                <p className="font-bold text-app-accent mt-0.5">{selectedMechanic.activeJobs} jobs in progress</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Completed Repairs</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedMechanic.completedJobs} jobs</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Mechanic Removal">
        <div className="space-y-4 text-xs">
          <p className="text-app-text">
            Are you sure you want to remove <span className="font-bold">{selectedMechanic?.name}</span> ({selectedMechanic?.code})?
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
              Delete Mechanic
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
