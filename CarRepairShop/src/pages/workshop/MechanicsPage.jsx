import { useState, useEffect } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Wrench, Car, UsersThree } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useMechanics, useCreateMechanic, useUpdateMechanic, useDeleteMechanic } from '../../hooks/useMechanics'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, Input, SearchableSelect } from '../../components/ui'
import RepairPipelineTracker from '../../components/workshop/RepairPipelineTracker'

const statusFilters = ['All', 'Active', 'On Leave', 'Terminated']

export default function MechanicsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' | 'roster'
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, activeFilter])

  const { data: mechanicsResponse, isLoading } = useMechanics({
    search: debouncedSearch,
    status: activeFilter,
    page: currentPage,
    limit: 10,
  })

  const mechanics = mechanicsResponse?.data || (Array.isArray(mechanicsResponse) ? mechanicsResponse : [])
  const pagination = mechanicsResponse?.pagination || {
    page: currentPage,
    limit: 10,
    total: mechanics.length,
    totalPages: Math.ceil(mechanics.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const createMechanicMutation = useCreateMechanic()
  const updateMechanicMutation = useUpdateMechanic()
  const deleteMechanicMutation = useDeleteMechanic()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    specialization: 'Engine & Transmission',
    experienceYears: 3,
    hourlyRate: 40,
    status: 'Active',
  })

  const handleOpenAdd = () => {
    setFormData({
      code: `MEC-${String(pagination.total + 1).padStart(3, '0')}`,
      name: '',
      phone: '',
      email: '',
      specialization: 'Engine & Transmission',
      experienceYears: 3,
      hourlyRate: 40,
      status: 'Active',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (m) => {
    setSelectedMechanic(m)
    setFormData({ ...m })
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenView = (m) => {
    setSelectedMechanic(m)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (m) => {
    setSelectedMechanic(m)
    setIsViewOpen(false); setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
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

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.mechanicsStaffRoster')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {pagination.total}
          </span>
        </div>
        {can('mechanics', 'create') && activeTab === 'roster' && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} weight="bold" />
            <span>{t('mechanics.addMechanic')}</span>
          </Button>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 border-b border-app-border pb-2.5">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Car size={15} weight="bold" />
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <UsersThree size={15} weight="bold" />
          <span>Mechanics</span>
          <span className="text-[10px] font-mono text-app-muted">{pagination.total}</span>
        </button>
      </div>

      {activeTab === 'pipeline' ? (
        <RepairPipelineTracker />
      ) : (
        <>
          {/* Integrated Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {statusFilters.map((st) => {
                const isActive = activeFilter === st
                const translatedSt = st === 'All' ? t('common.all') : t(`status.${st}`, st)
                return (
                  <button
                    key={st}
                    onClick={() => setActiveFilter(st)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-app-accent text-app-accentText font-semibold'
                        : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                    }`}
                  >
                    <span>{translatedSt}</span>
                    {st === 'All' && <span className="text-[10px] font-mono opacity-80">{pagination.total}</span>}
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-60">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                type="text"
                placeholder={t('common.quickSearch')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
              />
            </div>
          </div>

          {/* Main Table */}
          {isLoading && mechanics.length === 0 ? (
            <TableSkeleton rows={6} columns={5} />
          ) : mechanics.length === 0 ? (
            <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
              <EmptyState
                title={t('common.noRecords')}
                description={t('common.noData')}
                actionText={searchQuery || activeFilter !== 'All' ? t('common.filter') : undefined}
                onAction={
                  searchQuery || activeFilter !== 'All'
                    ? () => {
                        setSearchQuery('')
                        setActiveFilter('All')
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('mechanics.name')}</TableHead>
                  <TableHead>{t('mechanics.specialization')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('mechanics.experience')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('mechanics.hourlyRate')}</TableHead>
                  <TableHead>{t('mechanics.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanics.map((m) => (
                  <TableRow
                    key={m.id}
                    onClick={() => handleOpenView(m)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                          <Wrench size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-app-text">{m.name}</p>
                          <p className="text-[10px] text-app-muted font-mono">{m.code} · {m.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-app-text font-medium">{m.specialization}</TableCell>
                    <TableCell className="text-app-muted tabular-nums hidden md:table-cell">
                      {m.experienceYears} {t('mechanics.experience')}
                    </TableCell>
                    <TableCell className="font-bold text-app-accent tabular-nums hidden lg:table-cell">
                      ${m.hourlyRate}/hr
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
                          m.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : m.status === 'On Leave'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}
                      >
                        {t(`status.${m.status}`, m.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
            </Table>
          )}
      </>
      )}

      {/* Add Mechanic Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('mechanics.createMechanic')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('mechanics.name')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mike Johnson"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.phone')} *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 999 888"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mechanic@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.specialization')}</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="Engine Diagnostics"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.experience')} (Years)</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
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
            <LoadingButton type="submit" loading={createMechanicMutation.isPending}>
              {t('mechanics.createMechanic')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Mechanic Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('mechanics.editMechanic')}: ${selectedMechanic?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('mechanics.name')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.specialization')}</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.status')}</label>
              <SearchableSelect
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'Active', label: t('status.Active') },
                  { value: 'On Leave', label: t('status.On Leave') },
                  { value: 'Terminated', label: t('status.Terminated') },
                ]}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
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
            <LoadingButton type="submit" loading={updateMechanicMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Mechanic Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('mechanics.title')}>
        {selectedMechanic && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div className="w-10 h-10 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Wrench size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedMechanic.name}</h3>
                <p className="text-app-muted">{selectedMechanic.specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedMechanic.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.hourlyRate')}</p>
                <p className="font-bold text-app-accent mt-0.5">${selectedMechanic.hourlyRate}/hr</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              {can('mechanics', 'update') && (
                <button
                  onClick={() => handleOpenEdit(selectedMechanic)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} weight="bold" />
                  Edit
                </button>
              )}
              {can('mechanics', 'delete') && (
                <button
                  onClick={() => handleOpenDelete(selectedMechanic)}
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
        message={t('mechanics.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
