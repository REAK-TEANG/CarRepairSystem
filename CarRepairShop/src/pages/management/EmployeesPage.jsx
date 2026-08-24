import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Phone, CheckCircle } from '@phosphor-icons/react'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useToggleAttendance, useDeleteEmployee } from '../../hooks/useEmployees'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, ImageUpload, ConfirmDialog } from '../../components/ui'

export default function EmployeesPage() {
  const { can } = useAuth()
  const { data: employees = [], isLoading } = useEmployees()

  const createEmpMutation = useCreateEmployee()
  const updateEmpMutation = useUpdateEmployee()
  const toggleAttMutation = useToggleAttendance()
  const deleteEmpMutation = useDeleteEmployee()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    roleTitle: 'Technician',
    department: 'Workshop',
    phone: '',
    email: '',
    baseSalary: '$3,500/mo',
    attendanceToday: 'Present',
    status: 'Active',
    image: '',
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      roleTitle: 'Technician',
      department: 'Workshop',
      phone: '',
      email: '',
      baseSalary: '$3,500/mo',
      attendanceToday: 'Present',
      status: 'Active',
      image: '',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp)
    setFormData({
      name: emp.name,
      roleTitle: emp.roleTitle,
      department: emp.department,
      phone: emp.phone,
      email: emp.email,
      baseSalary: emp.baseSalary,
      attendanceToday: emp.attendanceToday,
      status: emp.status,
      image: emp.image || '',
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (emp) => {
    setSelectedEmp(emp)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (emp) => {
    setSelectedEmp(emp)
    setIsDeleteOpen(true)
  }

  const handleToggleAttendanceClick = (emp) => {
    toggleAttMutation.mutate(emp.id)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createEmpMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedEmp) return
    updateEmpMutation.mutate({ id: selectedEmp.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedEmp) return
    deleteEmpMutation.mutate(selectedEmp.id)
    setIsDeleteOpen(false)
  }

  const roles = ['All', ...new Set(employees.map((e) => e.department))]

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All' || emp.department === roleFilter
    return matchesSearch && matchesRole
  })

  const presentCount = employees.filter((e) => e.attendanceToday === 'Present').length

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Staff & Attendance</h1>
          <p className="text-xs text-app-muted mt-1">{employees.length} team members · {presentCount} present today</p>
        </div>
        {can('employees', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Headcount</p>
          <p className="text-xl font-bold tabular-nums text-app-text">{employees.length}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Present on Duty Today</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle size={18} weight="fill" />
            {presentCount} / {employees.length}
          </p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">On Scheduled Leave</p>
          <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {employees.length - presentCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {roles.map((dept) => (
          <button
            key={dept}
            onClick={() => setRoleFilter(dept)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === dept
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search staff name, role, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && employees.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading staff records...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Staff Code</th>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Department & Role</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Contact</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Base Pay</th>
                  <th className="px-6 py-3 font-semibold text-center">Daily Attendance</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{emp.empCode}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {emp.image ? (
                          <img src={emp.image} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-app-border" />
                        ) : (
                          <div className="w-8 h-8 bg-app-accent/15 border border-app-accent/30 rounded-full flex items-center justify-center text-app-accent font-bold text-xs">
                            {emp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-app-text">{emp.name}</p>
                          <p className="text-[10px] text-app-muted">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-app-text">{emp.roleTitle}</p>
                      <p className="text-[10px] text-app-muted">{emp.department}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="text-app-muted" />
                        {emp.phone}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums hidden lg:table-cell">{emp.baseSalary}</td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAttendanceClick(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                          emp.attendanceToday === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:scale-105'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:scale-105'
                        }`}
                        title="Click to toggle Present / On Leave"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.attendanceToday === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {emp.attendanceToday}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(emp)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View profile"
                        >
                          <Eye size={15} />
                        </button>
                        {can('employees', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title="Edit employee"
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('employees', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(emp)}
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                            title="Remove staff"
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

      {/* Add Employee Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Staff Member">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Liam Vance"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          
          <ImageUpload
            value={formData.image}
            onChange={(img) => setFormData((prev) => ({ ...prev, image: img }))}
            label="Profile Photo (Optional)"
            shape="circle"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Role Title</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="Senior Mechanic, Advisor..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Workshop">Workshop</option>
                <option value="Front Desk">Front Desk</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Finance">Finance</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone</label>
              <input
                type="text"
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
                placeholder="staff@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">Base Monthly Compensation</label>
            <input
              type="text"
              value={formData.baseSalary}
              onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
              placeholder="$3,800/mo"
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
              Add Staff
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Staff: ${selectedEmp?.name}`}>
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
          
          <ImageUpload
            value={formData.image}
            onChange={(img) => setFormData((prev) => ({ ...prev, image: img }))}
            label="Profile Photo (Optional)"
            shape="circle"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Role Title</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Workshop">Workshop</option>
                <option value="Front Desk">Front Desk</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Finance">Finance</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Base Salary</label>
              <input
                type="text"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
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

      {/* View Employee Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Employee Record">
        {selectedEmp && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedEmp.image ? (
                  <img src={selectedEmp.image} alt={selectedEmp.name} className="w-10 h-10 rounded-full object-cover border border-app-border" />
                ) : (
                  <div className="w-10 h-10 bg-app-accent/15 border border-app-accent/30 rounded-full flex items-center justify-center text-app-accent font-bold text-sm">
                    {selectedEmp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-app-text">{selectedEmp.name}</h3>
                  <p className="font-mono text-app-accent font-semibold">{selectedEmp.empCode}</p>
                </div>
              </div>
              <StatusBadge status={selectedEmp.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Position</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.roleTitle}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Department</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.department}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Contact Phone</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Today's Shift Status</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedEmp.attendanceToday}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Staff Removal"
        message={
          <>
            Are you sure you want to remove <span className="font-bold">{selectedEmp?.name}</span> ({selectedEmp?.empCode}) from active personnel?
          </>
        }
        confirmText="Delete Staff"
      />
    </div>
  )
}
