import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CheckCircle, XCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useServicesCatalog, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const statusOptions = ['All Status', 'Active Only', 'Inactive Only']

export default function ServicesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: services = [], isLoading } = useServicesCatalog()
  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All Status')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Routine Maintenance',
    description: '',
    laborHours: 1.0,
    estimatedCost: 80.0,
    isActive: true,
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Routine Maintenance',
      description: '',
      laborHours: 1.0,
      estimatedCost: 80.0,
      isActive: true,
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedService(s)
    setFormData({ ...s })
    setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedService(s)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedService(s)
    setIsDeleteOpen(true)
  }

  const handleToggleActive = (s) => {
    updateServiceMutation.mutate({
      id: s.id,
      data: { isActive: !s.isActive },
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createServiceMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedService) return
    updateServiceMutation.mutate({ id: selectedService.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedService) return
    deleteServiceMutation.mutate(selectedService.id)
    setIsDeleteOpen(false)
  }

  const categories = ['All', ...new Set(services.map((s) => s.category))]

  const query = searchQuery.trim().toLowerCase()
  const serviceList = Array.isArray(services) ? services : []
  const filtered = serviceList.filter((s) => {
    const matchesSearch =
      !query ||
      (s?.name || '').toLowerCase().includes(query) ||
      (s?.category || '').toLowerCase().includes(query) ||
      (s?.description || '').toLowerCase().includes(query)

    const matchesCat = categoryFilter === 'All' || s.category === categoryFilter

    let matchesStatus = true
    if (statusFilter === 'Active Only') matchesStatus = s.isActive === true
    if (statusFilter === 'Inactive Only') matchesStatus = s.isActive === false

    return matchesSearch && matchesCat && matchesStatus
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.serviceCatalog')}</h1>
          <p className="text-xs text-app-muted mt-1">{services.length} {t('services.subtitle')}</p>
        </div>
        {can('services', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('services.addService')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {cat === 'All' ? t('common.all') : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-app-muted flex items-center gap-1 mr-1">{t('common.status')}:</span>
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-app-hover text-app-text border border-app-border font-semibold'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              {st === 'All Status' ? t('common.all') : st}
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
          {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'All Status') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('All')
                setStatusFilter('All Status')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && services.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || categoryFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || categoryFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setCategoryFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('services.serviceName')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('services.category')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('services.estimatedHours')}</th>
                  <th className="px-6 py-3 font-semibold">{t('services.standardPrice')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{s.name}</p>
                      <p className="text-[10px] text-app-muted truncate max-w-sm">{s.description}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{s.category}</td>
                    <td className="px-6 py-3.5 text-app-muted tabular-nums hidden lg:table-cell">{s.laborHours} hrs</td>
                    <td className="px-6 py-3.5 font-bold text-app-text tabular-nums">
                      ${Number(s.estimatedCost || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => can('services', 'update') && handleToggleActive(s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          s.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-app-hover text-app-muted border border-app-border'
                        }`}
                      >
                        {s.isActive ? (
                          <>
                            <CheckCircle size={13} weight="fill" /> {t('status.Active')}
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> {t('status.Draft')}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(s)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('services', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('services', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(s)}
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

      {/* Add Service Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('services.createService')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('services.serviceName')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Synthetic Engine Oil & Filter Change"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Routine Maintenance">Routine Maintenance</option>
                <option value="Brake System">Brake System</option>
                <option value="Engine & Transmission">Engine & Transmission</option>
                <option value="Electrical Diagnostics">Electrical Diagnostics</option>
                <option value="Suspension & Steering">Suspension & Steering</option>
                <option value="HVAC & AC System">HVAC & AC System</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.estimatedHours')}</label>
              <input
                type="number"
                step="0.5"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.standardPrice')} ($)</label>
              <input
                type="number"
                step="1"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('services.description')}</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed maintenance checklist items..."
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createServiceMutation.isPending}>
              {t('services.createService')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('services.editService')}: ${selectedService?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('services.serviceName')} *</label>
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
              <label className="block text-app-muted font-medium mb-1">{t('services.category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Routine Maintenance">Routine Maintenance</option>
                <option value="Brake System">Brake System</option>
                <option value="Engine & Transmission">Engine & Transmission</option>
                <option value="Electrical Diagnostics">Electrical Diagnostics</option>
                <option value="Suspension & Steering">Suspension & Steering</option>
                <option value="HVAC & AC System">HVAC & AC System</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.estimatedHours')}</label>
              <input
                type="number"
                step="0.5"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.standardPrice')} ($)</label>
              <input
                type="number"
                step="1"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('services.description')}</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateServiceMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Service Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('services.title')}>
        {selectedService && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedService.name}</h3>
                <p className="text-app-muted">{selectedService.category}</p>
              </div>
              <span className="text-sm font-bold text-app-accent">${selectedService.estimatedCost}</span>
            </div>

            <div className="p-3 bg-app-input rounded-xl border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('services.description')}</p>
              <p className="text-app-text mt-1">{selectedService.description || 'Standard workshop procedure.'}</p>
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
        message={t('services.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
