import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, CheckCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useToggleAttendance, useDeleteEmployee } from '../../hooks/useEmployees'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, SearchableSelect } from '../../components/ui'

export default function EmployeesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [currentPage, setCurrentPage] = useState(1)

  const { data: employeesResponse, isLoading } = useEmployees({
    search: debouncedSearch,
    page: currentPage,
    limit: 10,
  })

  const employees = employeesResponse?.data || (Array.isArray(employeesResponse) ? employeesResponse : [])
  const pagination = employeesResponse?.pagination || {
    page: currentPage,
    limit: 10,
    total: employees.length,
    totalPages: Math.ceil(employees.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const createEmpMutation = useCreateEmployee()
  const updateEmpMutation = useUpdateEmployee()
  const toggleAttendanceMutation = useToggleAttendance()
  const deleteEmpMutation = useDeleteEmployee()

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
      empCode: `EMP-2026-${String(pagination.total + 1).padStart(3, '0')}`,
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
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenView = (emp) => {
    setSelectedEmp(emp)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (emp) => {
    setSelectedEmp(emp)
    setIsViewOpen(false); setIsDeleteOpen(true)
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

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.staffAttendance')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {pagination.total}
          </span>
        </div>
        {can('employees', 'create') && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} weight="bold" />
            <span>{t('employees.addEmployee')}</span>
          </Button>
        )}
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="relative w-full sm:w-60">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder={t('common.quickSearch')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading && employees.length === 0 ? (
        <TableSkeleton rows={6} columns={5} />
      ) : employees.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery ? t('common.filter') : undefined}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('')
                    setCurrentPage(1)
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.employeeId')}</TableHead>
              <TableHead>{t('employees.name')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('employees.position')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('employees.department')}</TableHead>
              <TableHead>{t('employees.attendance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow
                key={emp.id}
                onClick={() => handleOpenView(emp)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono font-semibold text-app-accent">{emp.empCode}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {emp.image ? (
                      <img
                        src={emp.image}
                        alt={emp.name}
                        className="w-8 h-8 rounded-sm object-cover ring-1 ring-app-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                        {emp.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-app-text">{emp.name}</p>
                      <p className="text-[10px] text-app-muted">{emp.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-app-text font-medium hidden md:table-cell">{emp.roleTitle}</TableCell>
                <TableCell className="text-app-muted hidden lg:table-cell">{emp.department}</TableCell>
                <TableCell>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      can('employees', 'update') && handleToggleAttendanceClick(emp)
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold transition-colors cursor-pointer ${
                      emp.attendanceToday === 'Present'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <CheckCircle size={13} weight={emp.attendanceToday === 'Present' ? 'fill' : 'regular'} />
                    {t(`status.${emp.attendanceToday}`, emp.attendanceToday)}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
        </Table>
      )}

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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <SearchableSelect
                value={formData.department}
                onChange={(val) => setFormData({ ...formData, department: val })}
                options={['Service', 'Workshop', 'Inventory', 'Finance', 'Management']}
                placeholder="Select department..."
                searchPlaceholder="Search department..."
              />
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              {t('common.cancel')}
            </Button>
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.position')}</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <SearchableSelect
                value={formData.department}
                onChange={(val) => setFormData({ ...formData, department: val })}
                options={['Service', 'Workshop', 'Inventory', 'Finance', 'Management']}
                placeholder="Select department..."
                searchPlaceholder="Search department..."
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              {t('common.cancel')}
            </Button>
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
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div className="w-10 h-10 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                {selectedEmp.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedEmp.name}</h3>
                <p className="text-app-muted">{selectedEmp.roleTitle} · {selectedEmp.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.email')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedEmp.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              {can('employees', 'update') && (
                <button
                  onClick={() => handleOpenEdit(selectedEmp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} weight="bold" />
                  Edit
                </button>
              )}
              {can('employees', 'delete') && (
                <button
                  onClick={() => handleOpenDelete(selectedEmp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold rounded-sm text-xs transition-colors cursor-pointer border border-rose-500/20"
                >
                  <Trash size={14} weight="bold" />
                  Delete
                </button>
              )}
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
