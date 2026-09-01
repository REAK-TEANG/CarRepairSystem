import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CheckCircle, XCircle, Package } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useServicesCatalog, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServicesCatalog'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const statusOptions = ['All Status', 'Active Only', 'Inactive Only']

export default function ServicesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: services = [], isLoading } = useServicesCatalog()
  const { data: inventory = [] } = useInventory()
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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Routine Maintenance',
    description: '',
    laborHours: 1.0,
    estimatedCost: 80.0,
    isActive: true,
    requiredParts: [],
  })

  // Selected spare part to add in modal
  const [selectedPartId, setSelectedPartId] = useState('')
  const [selectedPartQty, setSelectedPartQty] = useState(1)

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Routine Maintenance',
      description: '',
      laborHours: 1.0,
      estimatedCost: 80.0,
      isActive: true,
      requiredParts: [],
    })
    setSelectedPartId('')
    setSelectedPartQty(1)
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedService(s)
    setFormData({
      ...s,
      requiredParts: Array.isArray(s.requiredParts) ? [...s.requiredParts] : [],
    })
    setSelectedPartId('')
    setSelectedPartQty(1)
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

  const handleAddPartToForm = () => {
    if (!selectedPartId) return
    const part = inventory.find((p) => String(p.id) === String(selectedPartId))
    if (!part) return

    const existingIndex = formData.requiredParts.findIndex((p) => String(p.sparePartId || p.id) === String(part.id))
    let updatedParts = [...formData.requiredParts]

    if (existingIndex >= 0) {
      updatedParts[existingIndex] = {
        ...updatedParts[existingIndex],
        quantity: Number(selectedPartQty),
      }
    } else {
      updatedParts.push({
        sparePartId: part.id,
        partCode: part.partCode,
        name: part.name,
        brand: part.brand,
        unitPrice: part.unitPrice,
        stockQuantity: part.stockQty,
        quantity: Number(selectedPartQty),
      })
    }

    setFormData({ ...formData, requiredParts: updatedParts })
    setSelectedPartId('')
    setSelectedPartQty(1)
  }

  const handleRemovePartFromForm = (sparePartId) => {
    setFormData({
      ...formData,
      requiredParts: formData.requiredParts.filter((p) => String(p.sparePartId || p.id) !== String(sparePartId)),
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
      (s?.description || '').toLowerCase().includes(query) ||
      (s?.requiredParts || []).some(
        (p) =>
          (p?.name || '').toLowerCase().includes(query) ||
          (p?.partCode || '').toLowerCase().includes(query)
      )

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
                  <th className="px-6 py-3 font-semibold">Auto Stock-Out Parts</th>
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
                      <p className="text-[10px] text-app-muted truncate max-w-xs">{s.description || 'Standard service procedure'}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{s.category}</td>
                    <td className="px-6 py-3.5">
                      {s.requiredParts && s.requiredParts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {s.requiredParts.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                              title={`${p.name} (${p.partCode}) - Qty: ${p.quantity}`}
                            >
                              <Package size={12} />
                              <span>{p.quantity}x {p.partCode || p.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-app-muted italic">Labor only (No parts)</span>
                      )}
                    </td>
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

          {/* Required Parts (Bill of Materials / Auto Stock-Out) */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-app-text flex items-center gap-1.5">
                <Package size={15} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </label>
              <span className="text-[10px] text-app-muted">Parts auto-deducted when service is used</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-xs"
              >
                <option value="">-- Select Spare Part from Inventory --</option>
                {inventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partCode}) - Stock: {p.stockQty} - ${Number(p.unitPrice || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1.5 bg-app-input border border-app-border rounded-xl text-app-text text-center text-xs"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddPartToForm}
                disabled={!selectedPartId}
                className="px-3 py-1.5 bg-app-accent disabled:opacity-50 text-app-accentText font-semibold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus size={14} weight="bold" /> Add
              </button>
            </div>

            {formData.requiredParts.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {formData.requiredParts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-app-card rounded-lg border border-app-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        {p.quantity}x
                      </span>
                      <span className="font-medium text-app-text">{p.name}</span>
                      <span className="text-[10px] text-app-muted">({p.partCode})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePartFromForm(p.sparePartId || p.id)}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-app-muted italic">No inventory parts attached yet. Service is pure labor.</p>
            )}
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

          {/* Required Parts (Bill of Materials / Auto Stock-Out) */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-app-text flex items-center gap-1.5">
                <Package size={15} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </label>
              <span className="text-[10px] text-app-muted">Parts auto-deducted when service is used</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent text-xs"
              >
                <option value="">-- Select Spare Part from Inventory --</option>
                {inventory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partCode}) - Stock: {p.stockQty} - ${Number(p.unitPrice || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1.5 bg-app-input border border-app-border rounded-xl text-app-text text-center text-xs"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddPartToForm}
                disabled={!selectedPartId}
                className="px-3 py-1.5 bg-app-accent disabled:opacity-50 text-app-accentText font-semibold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus size={14} weight="bold" /> Add
              </button>
            </div>

            {formData.requiredParts.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {formData.requiredParts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-app-card rounded-lg border border-app-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        {p.quantity}x
                      </span>
                      <span className="font-medium text-app-text">{p.name}</span>
                      <span className="text-[10px] text-app-muted">({p.partCode})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePartFromForm(p.sparePartId || p.id)}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-app-muted italic">No inventory parts attached yet. Service is pure labor.</p>
            )}
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

            {/* Bill of Materials list */}
            <div className="p-3 bg-app-card rounded-xl border border-app-border space-y-2">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                <Package size={14} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </p>
              {selectedService.requiredParts && selectedService.requiredParts.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedService.requiredParts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-app-hover/50 border border-app-border">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          {p.quantity}x
                        </span>
                        <span className="font-semibold text-app-text">{p.name}</span>
                        <span className="text-app-muted text-[10px]">({p.partCode})</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-semibold ${p.stockQuantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-app-muted italic text-[11px]">No parts required for this service.</p>
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
        message={t('services.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
