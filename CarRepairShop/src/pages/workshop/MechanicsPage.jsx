import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Wrench } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useMechanics, useCreateMechanic, useUpdateMechanic, useDeleteMechanic } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const statusFilters = ['All', 'Active', 'On Leave', 'Terminated']

export default function MechanicsPage() {
  const { t } = useTranslation()
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
      code: `MEC-${String(mechanics.length + 1).padStart(3, '0')}`,
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

  const query = searchQuery.trim().toLowerCase()
  const mechanicList = Array.isArray(mechanics) ? mechanics : []
  const filtered = mechanicList.filter((m) => {
    const matchesSearch =
      !query ||
      (m?.name || '').toLowerCase().includes(query) ||
      (m?.code || '').toLowerCase().includes(query) ||
      (m?.specialization || '').toLowerCase().includes(query) ||
      (m?.phone || '').toLowerCase().includes(query) ||
      (m?.email || '').toLowerCase().includes(query)

    const matchesFilter = activeFilter === 'All' || m.status === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.mechanicsStaffRoster')}</h1>
          <p className="text-xs text-app-muted mt-1">{mechanics.length} {t('mechanics.subtitle')}</p>
        </div>
        {can('mechanics', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('mechanics.addMechanic')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((st) => {
          const count = st === 'All' ? mechanics.length : mechanics.filter((m) => m.status === st).length
          const isActive = activeFilter === st
          const translatedSt = st === 'All' ? t('common.all') : t(`status.${st}`, st)
          return (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {translatedSt}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
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
          {(searchQuery || activeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('All')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && mechanics.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
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
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('mechanics.name')}</th>
                  <th className="px-6 py-3 font-semibold">{t('mechanics.specialization')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('mechanics.experience')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('mechanics.hourlyRate')}</th>
                  <th className="px-6 py-3 font-semibold">{t('mechanics.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                          <Wrench size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-app-text">{m.name}</p>
                          <p className="text-[10px] text-app-muted font-mono">{m.code} · {m.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-app-text font-medium">{m.specialization}</td>
                    <td className="px-6 py-3.5 text-app-muted tabular-nums hidden md:table-cell">
                      {m.experienceYears} {t('mechanics.experience')}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-app-accent tabular-nums hidden lg:table-cell">
                      ${m.hourlyRate}/hr
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          m.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : m.status === 'On Leave'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {t(`status.${m.status}`, m.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(m)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('mechanics', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('mechanics', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(m)}
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mechanic@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
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
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.experience')} (Years)</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.specialization')}</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('mechanics.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                <option value="Active">{t('status.Active')}</option>
                <option value="On Leave">{t('status.On Leave')}</option>
                <option value="Terminated">{t('status.Terminated')}</option>
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
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Wrench size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedMechanic.name}</h3>
                <p className="text-app-muted">{selectedMechanic.specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedMechanic.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.hourlyRate')}</p>
                <p className="font-bold text-app-accent mt-0.5">${selectedMechanic.hourlyRate}/hr</p>
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
        message={t('mechanics.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
