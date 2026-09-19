import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CheckCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useToggleAttendance, useDeleteEmployee } from '@/hooks/useEmployees'
import { useAuth } from '@/context/AuthContext'
import { ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('titles.staffAttendance')}</h1>
          <Badge variant="outline" className="text-xs font-mono">{employees.length}</Badge>
        </div>
        {can('employees', 'create') && (
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={16} weight="bold" />
            {t('employees.addEmployee')}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <Button
              key={dept}
              variant="ghost"
              onClick={() => setRoleFilter(dept)}
              className={`h-8 px-3 rounded-xl whitespace-nowrap text-xs ${
                roleFilter === dept
                  ? 'bg-app-accent text-white shadow-subtle hover:bg-app-accent hover:text-white'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {dept === 'All' ? t('common.all') : dept}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-app-muted flex items-center gap-1 mr-1">{t('employees.attendance')}:</span>
          {attendanceFilters.map((att) => (
            <Button
              key={att}
              variant="ghost"
              onClick={() => setAttendanceFilter(att)}
              className={`h-7 px-2.5 rounded-lg text-[11px] whitespace-nowrap ${
                attendanceFilter === att
                  ? 'bg-app-hover text-app-text border border-app-border font-semibold hover:bg-app-hover hover:text-app-text'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              {att === 'All Attendance' ? t('common.all') : t(`status.${att}`, att)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {(searchQuery || roleFilter !== 'All' || attendanceFilter !== 'All Attendance') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setRoleFilter('All')
                setAttendanceFilter('All Attendance')
              }}
            >
              {t('common.cancel')}
            </Button>
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
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-app-hover/50">
                  <TableHead className="px-6 py-3 font-semibold">{t('employees.employeeId')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('employees.name')}</TableHead>
                  <TableHead className="px-6 py-3 hidden md:table-cell font-semibold">{t('employees.position')}</TableHead>
                  <TableHead className="px-6 py-3 hidden lg:table-cell font-semibold">{t('employees.department')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('employees.attendance')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-app-border">
                {filtered.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-app-hover/60 transition-colors group">
                    <TableCell className="px-6 py-3.5 font-mono font-semibold text-app-accent">{emp.empCode}</TableCell>
                    <TableCell className="px-6 py-3.5">
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
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-app-text font-medium hidden md:table-cell">{emp.roleTitle}</TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted hidden lg:table-cell">{emp.department}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <Button
                        variant="ghost"
                        onClick={() => can('employees', 'update') && handleToggleAttendanceClick(emp)}
                        className={`h-6 px-2.5 rounded-full text-[11px] font-semibold ${
                          emp.attendanceToday === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <CheckCircle size={13} weight={emp.attendanceToday === 'Present' ? 'fill' : 'regular'} />
                        {t(`status.${emp.attendanceToday}`, emp.attendanceToday)}
                      </Button>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenView(emp)}
                          className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </Button>
                        {can('employees', 'update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(emp)}
                            className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </Button>
                        )}
                        {can('employees', 'delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(emp)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                            title={t('common.delete')}
                          >
                            <Trash size={15} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) setIsAddOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employees.createEmployee')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</Label>
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
                <Label className="block text-app-muted font-medium mb-1">{t('employees.position')} *</Label>
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
                <Label className="block text-app-muted font-medium mb-1">{t('employees.department')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('employees.department')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block text-app-muted font-medium mb-1">{t('common.phone')} *</Label>
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
                <Label className="block text-app-muted font-medium mb-1">{t('common.email')}</Label>
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
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="h-9 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton type="submit" loading={createEmpMutation.isPending}>
                {t('employees.createEmployee')}
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) setIsEditOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employees.editEmployee')}: {selectedEmp?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('employees.name')} *</Label>
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
                <Label className="block text-app-muted font-medium mb-1">{t('employees.position')}</Label>
                <input
                  type="text"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                />
              </div>
              <div>
                <Label className="block text-app-muted font-medium mb-1">{t('employees.department')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('employees.department')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="h-9 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <LoadingButton type="submit" loading={updateEmpMutation.isPending}>
                {t('common.saveChanges')}
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Employee Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employees.title')}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

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
