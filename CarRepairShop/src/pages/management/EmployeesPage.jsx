import { useState } from 'react'
import { Plus, PencilSimple, Trash, CheckCircle, ShieldCheck, Phone, Key } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useToggleAttendance,
  useDeleteEmployee,
} from '../../hooks/useEmployees'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import {
  Modal,
  ConfirmDialog,
  EmptyState,
  TableSkeleton,
  LoadingButton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooterBar,
  Button,
  SearchableSelect,
  Input,
  PageHeader,
  MobileDataCard,
} from '../../components/ui'

const SYSTEM_ROLES = [
  { value: 'admin', label: 'Admin', roleId: 1, sublabel: 'Full system access & configuration' },
  { value: 'manager', label: 'Manager', roleId: 2, sublabel: 'Operations, employees & reports' },
  { value: 'service_advisor', label: 'Service Advisor', roleId: 3, sublabel: 'Intake, appointments & repair orders' },
  { value: 'mechanic', label: 'Mechanic', roleId: 4, sublabel: 'Shop floor execution & repair jobs' },
  { value: 'cashier', label: 'Cashier', roleId: 5, sublabel: 'Billing, invoices & payments' },
  { value: 'storekeeper', label: 'Storekeeper', roleId: 6, sublabel: 'Inventory, spare parts & suppliers' },
]

const DEPARTMENTS = [
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Service', label: 'Service' },
  { value: 'Inventory', label: 'Inventory' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Management', label: 'Management' },
]

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

  const { items: employees, pagination, totalCount } = usePaginationData(employeesResponse, {
    page: currentPage,
    limit: 10,
  })

  const createEmpMutation = useCreateEmployee()
  const updateEmpMutation = useUpdateEmployee()
  const toggleAttendanceMutation = useToggleAttendance()
  const deleteEmpMutation = useDeleteEmployee()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    empCode: '',
    roleTitle: 'Service Advisor',
    department: 'Workshop',
    role: 'mechanic',
    roleId: 4,
    password: '',
    phone: '',
    email: '',
    baseSalary: '$3,800/mo',
    attendanceToday: 'Present',
    image: '',
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      empCode: `EMP-2026-${String((pagination?.total || 0) + 1).padStart(3, '0')}`,
      roleTitle: 'Service Advisor',
      department: 'Workshop',
      role: 'service_advisor',
      roleId: 3,
      password: '',
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
      name: emp.name || '',
      empCode: emp.empCode || '',
      roleTitle: emp.roleTitle || 'Staff',
      department: emp.department || 'Workshop',
      role: emp.role || 'mechanic',
      roleId: emp.roleId || 4,
      password: '',
      phone: emp.phone || '',
      email: emp.email || '',
      baseSalary: emp.baseSalary || '$3,800/mo',
      attendanceToday: emp.attendanceToday || 'Present',
      image: emp.image || '',
    })
    setIsEditOpen(true)
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

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans">
      <PageHeader
        title={t('titles.staffAttendance')}
        count={totalCount}
        searchQuery={searchQuery}
        onSearch={(e) => {
          setSearchQuery(e.target.value)
          setCurrentPage(1)
        }}
        searchPlaceholder={t('common.quickSearch')}
        actions={
          can('employees', 'create') && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="gap-1.5 flex-shrink-0"
              title={t('employees.addEmployee')}
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">{t('employees.addEmployee')}</span>
            </Button>
          )
        }
      />

      {/* Main Table */}
      {isLoading && employees.length === 0 ? (
        <TableSkeleton rows={6} columns={6} />
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
        <>
          {/* Mobile Cards View (< 768px) */}
          <div className="space-y-2.5 md:hidden">
            {employees.map((emp) => (
              <MobileDataCard
                key={emp.id}
                onClick={() => handleOpenEdit(emp)}
                icon={
                  emp.image ? (
                    <img
                      src={emp.image}
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-app-border"
                    />
                  ) : (
                    <span className="font-bold text-app-accent">{emp.name ? emp.name[0] : 'E'}</span>
                  )
                }
                title={emp.name}
                subtitle={`${emp.roleTitle || 'Staff'} • ${emp.department || 'Workshop'}`}
                status={{
                  label: emp.attendanceToday,
                  color: emp.attendanceToday === 'Present' ? 'green' : 'amber',
                }}
                chips={[
                  {
                    value: emp.empCode,
                  },
                  {
                    icon: <ShieldCheck size={13} weight="bold" />,
                    value: emp.roleName || emp.role || 'Staff',
                  },
                  ...(emp.phone
                    ? [
                        {
                          icon: <Phone size={13} weight="bold" />,
                          value: (
                            <a
                              href={`tel:${emp.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline text-app-accent font-semibold"
                            >
                              {emp.phone}
                            </a>
                          ),
                        },
                      ]
                    : []),
                ]}
                actions={
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendanceClick(emp)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                        emp.attendanceToday === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-app-hover text-app-muted border-app-border'
                      }`}
                    >
                      {emp.attendanceToday}
                    </button>
                    {can('employees', 'delete') && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(emp)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>

          {/* Desktop High-Density Table (>= 768px) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employees.employeeId')}</TableHead>
                  <TableHead>{t('employees.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('employees.position')}</TableHead>
                  <TableHead className="hidden sm:table-cell">System Role</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('employees.department')}</TableHead>
                  <TableHead>{t('employees.attendance')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} onClick={() => handleOpenEdit(emp)} className="cursor-pointer">
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
                            {emp.name ? emp.name[0] : 'E'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-app-text">{emp.name}</p>
                          <p className="text-[10px] text-app-muted">{emp.phone || emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-app-muted hidden md:table-cell font-medium">{emp.roleTitle}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-app-accent/10 text-app-accent border border-app-accent/20">
                        <ShieldCheck size={12} weight="bold" />
                        <span>{emp.roleName || emp.role || 'Staff'}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-app-muted hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded text-xs bg-app-input border border-app-border font-medium">
                        {emp.department || 'Workshop'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleAttendanceClick(emp)
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                          emp.attendanceToday === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-app-hover text-app-muted border-app-border'
                        }`}
                      >
                        <CheckCircle size={13} weight="bold" />
                        <span>{emp.attendanceToday}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {can('employees', 'update') && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={14} />
                          </button>
                        )}
                        {can('employees', 'delete') && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(emp)}
                            className="p-1 rounded-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TableFooterBar
            page={currentPage}
            totalPages={pagination?.totalPages || 1}
            totalCount={totalCount}
            pageSize={10}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(pagination?.totalPages || 1, p + 1))}
          />
        </>
      )}

      {/* Mobile Floating Action Button (FAB) for Add Employee */}
      {can('employees', 'create') && (
        <button
          onClick={handleOpenAdd}
          className="fixed right-4 bottom-20 z-40 md:hidden flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-app-accent text-app-accentText shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer border border-white/20"
          aria-label={t('employees.addEmployee')}
        >
          <Plus size={22} weight="bold" />
        </button>
      )}

      {/* Add Employee Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('employees.addEmployee')} maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.position')} *</label>
              <Input
                type="text"
                required
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="Service Advisor, Chief Cashier..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <SearchableSelect
                value={formData.department}
                onChange={(val) => setFormData({ ...formData, department: val })}
                options={DEPARTMENTS}
                placeholder="Select department..."
                searchPlaceholder="Search department..."
              />
            </div>
          </div>

          {/* System Role & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                <ShieldCheck size={13} className="text-app-accent" />
                <span>System Access Role *</span>
              </label>
              <SearchableSelect
                value={formData.role}
                onChange={(val) => {
                  const r = SYSTEM_ROLES.find((x) => x.value === val)
                  setFormData({ ...formData, role: val, roleId: r ? r.roleId : 4 })
                }}
                options={SYSTEM_ROLES}
                placeholder="Select system role..."
                searchPlaceholder="Search role..."
              />
            </div>
            <div>
              <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                <Key size={13} className="text-amber-500" />
                <span>Account Password</span>
                <span className="text-[10px] text-app-muted">(Default: 123456)</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password..."
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.phone')} *</label>
              <Input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 678"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@workshop.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={createEmpMutation.isPending}>
              <Plus size={14} weight="bold" className="sm:mr-1" />
              <span className="hidden sm:inline">{t('employees.createEmployee')}</span>
              <span className="sm:hidden">Create</span>
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`${t('employees.editEmployee')}: ${selectedEmp?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.position')}</label>
              <Input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="e.g. Master Technician"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('employees.department')}</label>
              <SearchableSelect
                value={formData.department}
                onChange={(val) => setFormData({ ...formData, department: val })}
                options={DEPARTMENTS}
                placeholder="Select department..."
                searchPlaceholder="Search department..."
              />
            </div>
          </div>

          {/* System Role & Password (ADMIN CAPABILITY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                <ShieldCheck size={13} className="text-app-accent" />
                <span>System Access Role *</span>
              </label>
              <SearchableSelect
                value={formData.role}
                onChange={(val) => {
                  const r = SYSTEM_ROLES.find((x) => x.value === val)
                  setFormData({ ...formData, role: val, roleId: r ? r.roleId : 4 })
                }}
                options={SYSTEM_ROLES}
                placeholder="Select system role..."
                searchPlaceholder="Search role..."
              />
            </div>
            <div>
              <label className="text-app-muted font-medium mb-1 flex items-center gap-1">
                <Key size={13} className="text-amber-500" />
                <span>Password</span>
                <span className="text-[10px] text-app-muted">(Leave blank to keep current)</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password to change..."
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.phone')}</label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 678"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@workshop.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-app-border">
            {can('employees', 'delete') ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false)
                  setIsDeleteOpen(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash size={14} weight="bold" />
                <span>{t('common.delete')}</span>
              </button>
            ) : <div />}
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <LoadingButton type="submit" loading={updateEmpMutation.isPending}>
                {t('common.saveChanges')}
              </LoadingButton>
            </div>
          </div>
        </form>
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
