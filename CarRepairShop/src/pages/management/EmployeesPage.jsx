import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CheckCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useToggleAttendance, useDeleteEmployee } from '../../hooks/useEmployees'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const attendanceFilters = ['All Attendance', 'Present', 'On Leave']

export default function EmployeesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: employees = [], isLoading } = useEmployees()

  const createEmpMutation = useCreateEmployee()
  const updateEmpMutation = useUpdateEmployee()
  const toggleAttendanceMutation = useToggleAttendance()
  const deleteEmpMutation = useDeleteEmployee()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [attendanceFilter, setAttendanceFilter] = useState('All Attendance')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    empCode: '',
    roleTitle: 'Service Advisor',
    department: 'Service',
    phone: '',
    email: '',
    baseSalary: '$3,800/mo',
    attendanceToday: 'Present',
    image: '',
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      empCode: `EMP-2026-${String(employees.length + 1).padStart(3, '0')}`,
      roleTitle: 'Service Advisor',
      department: 'Service',
      phone: '',
      email: '',
      baseSalary: '$3,800/mo',
      attendanceToday: 'Present',
      image: '',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp)
    setFormData({
      name: emp.name,
      empCode: emp.empCode,
      roleTitle: emp.roleTitle,
      department: emp.department,
      phone: emp.phone,
      email: emp.email,
      baseSalary: emp.baseSalary,
      attendanceToday: emp.attendanceToday,
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
    toggleAttendanceMutation.mutate(emp.id)
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

  const departments = ['All', ...new Set(employees.map((e) => e.department).filter(Boolean))]

  const query = searchQuery.trim().toLowerCase()
  const empList = Array.isArray(employees) ? employees : []
  const filtered = empList.filter((emp) => {
    const matchesSearch =
      !query ||
      (emp?.name || '').toLowerCase().includes(query) ||
      (emp?.empCode || '').toLowerCase().includes(query) ||
      (emp?.roleTitle || '').toLowerCase().includes(query) ||
      (emp?.phone || '').toLowerCase().includes(query) ||
      (emp?.email || '').toLowerCase().includes(query)

    const matchesDept = roleFilter === 'All' || emp.department === roleFilter

    let matchesAtt = true
    if (attendanceFilter === 'Present') matchesAtt = emp.attendanceToday === 'Present'
    if (attendanceFilter === 'On Leave') matchesAtt = emp.attendanceToday === 'On Leave'

    return matchesSearch && matchesDept && matchesAtt
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.staffAttendance')}</h1>
          <p className="text-xs text-app-muted mt-1">{employees.length} {t('employees.subtitle')}</p>
        </div>
        {can('employees', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('employees.addEmployee')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setRoleFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                roleFilter === dept
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {dept === 'All' ? t('common.all') : dept}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-app-muted flex items-center gap-1 mr-1">{t('employees.attendance')}:</span>
          {attendanceFilters.map((att) => (
            <button
              key={att}
              onClick={() => setAttendanceFilter(att)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                attendanceFilter === att
                  ? 'bg-app-hover text-app-text border border-app-border font-semibold'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              {att === 'All Attendance' ? t('common.all') : t(`status.${att}`, att)}
            </button>
          ))}
        </div>
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
          {(searchQuery || roleFilter !== 'All' || attendanceFilter !== 'All Attendance') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setRoleFilter('All')
                setAttendanceFilter('All Attendance')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && employees.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || roleFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || roleFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setRoleFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('employees.employeeId')}</th>
                  <th className="px-6 py-3 font-semibold">{t('employees.name')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('employees.position')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('employees.department')}</th>
                  <th className="px-6 py-3 font-semibold">{t('employees.attendance')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{emp.empCode}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {emp.image ? (
                          <img
                            src={emp.image}
                            alt={emp.name}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-app-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                            {emp.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-app-text">{emp.name}</p>
                          <p className="text-[10px] text-app-muted">{emp.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-app-text font-medium hidden md:table-cell">{emp.roleTitle}</td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">{emp.department}</td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => can('employees', 'update') && handleToggleAttendanceClick(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          emp.attendanceToday === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <CheckCircle size={13} weight={emp.attendanceToday === 'Present' ? 'fill' : 'regular'} />
                        {t(`status.${emp.attendanceToday}`, emp.attendanceToday)}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(emp)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('employees', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('employees', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(emp)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
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

      {/* Add Employee Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('employees.createEmployee')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sreysros Keo"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.position')} *</label>
              <input
                type="text"
                required
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="Service Advisor, Chief Cashier..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Service">Service</option>
                <option value="Workshop">Workshop</option>
                <option value="Inventory">Inventory</option>
                <option value="Finance">Finance</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.phone')} *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 678"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createEmpMutation.isPending}>
              {t('employees.createEmployee')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('employees.editEmployee')}: ${selectedEmp?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.position')}</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Service">Service</option>
                <option value="Workshop">Workshop</option>
                <option value="Inventory">Inventory</option>
                <option value="Finance">Finance</option>
                <option value="Management">Management</option>
              </select>
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
            <LoadingButton type="submit" loading={updateEmpMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Employee Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('employees.title')}>
        {selectedEmp && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                {selectedEmp.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedEmp.name}</h3>
                <p className="text-app-muted">{selectedEmp.roleTitle} · {selectedEmp.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.email')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.email || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('employees.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
