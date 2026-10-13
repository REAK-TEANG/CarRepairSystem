import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, CheckCircle, XCircle, Package } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useServicesCatalog, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServicesCatalog'
import { useInventory } from '../../hooks/useInventory'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, SearchableSelect } from '../../components/ui'

const statusOptions = ['All Status', 'Active Only', 'Inactive Only']

export default function ServicesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All Status')


  const { data: servicesResponse, isLoading } = useServicesCatalog({
    search: debouncedSearch,
    status: statusFilter,
    page: currentPage,
    limit: 10,
  })

  const { data: invData } = useInventory({ all: true })
  const inventory = Array.isArray(invData) ? invData : (invData?.data || [])

  const services = servicesResponse?.data || (Array.isArray(servicesResponse) ? servicesResponse : [])
  const pagination = servicesResponse?.pagination || {
    page: currentPage,
    limit: 10,
    total: services.length,
    totalPages: Math.ceil(services.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

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
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedService(s)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedService(s)
    setIsViewOpen(false); setIsDeleteOpen(true)
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

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.serviceCatalog')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {pagination.total}
          </span>
        </div>
        {can('services', 'create') && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} weight="bold" />
            <span>{t('services.addService')}</span>
          </Button>
        )}
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setCurrentPage(1)
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-app-accent text-app-accentText font-semibold'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

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
      {isLoading && services.length === 0 ? (
        <TableSkeleton rows={6} columns={6} />
      ) : services.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery || statusFilter !== 'All Status' ? t('common.filter') : undefined}
            onAction={
              searchQuery || statusFilter !== 'All Status'
                ? () => {
                    setSearchQuery('')
                    setStatusFilter('All Status')
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
              <TableHead>{t('services.serviceName')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('services.category')}</TableHead>
              <TableHead>Auto Stock-Out Parts</TableHead>
              <TableHead className="hidden lg:table-cell">{t('services.estimatedHours')}</TableHead>
              <TableHead>{t('services.standardPrice')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow
                key={s.id}
                onClick={() => handleOpenView(s)}
                className="cursor-pointer"
              >
                <TableCell>
                  <p className="font-semibold text-app-text">{s.name}</p>
                  <p className="text-[10px] text-app-muted truncate max-w-xs">{s.description || 'Standard service procedure'}</p>
                </TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{s.category}</TableCell>
                <TableCell>
                  {s.requiredParts && s.requiredParts.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {s.requiredParts.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                          title={`${p.name} (${p.partCode}) - Qty: ${p.quantity}`}
                        >
                          <Package size={11} />
                          <span>{p.quantity}x {p.partCode || p.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-app-muted italic">Labor only (No parts)</span>
                  )}
                </TableCell>
                <TableCell className="text-app-muted tabular-nums hidden lg:table-cell">{s.laborHours} hrs</TableCell>
                <TableCell className="font-bold text-app-text tabular-nums">
                  ${Number(s.estimatedCost || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      can('services', 'update') && handleToggleActive(s)
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold transition-colors cursor-pointer ${
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
        </Table>
      )}

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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.category')}</label>
              <SearchableSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  'Routine Maintenance',
                  'Brake System',
                  'Engine & Transmission',
                  'Electrical Diagnostics',
                  'Suspension & Steering',
                  'HVAC & AC System',
                ]}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.estimatedHours')}</label>
              <input
                type="number"
                step="0.5"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.standardPrice')} ($)</label>
              <input
                type="number"
                step="1"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          {/* Required Parts (Bill of Materials / Auto Stock-Out) */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-app-text flex items-center gap-1.5">
                <Package size={15} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </label>
              <span className="text-[10px] text-app-muted">Parts auto-deducted when service is used</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedPartId}
                  onChange={(val) => setSelectedPartId(val)}
                  options={inventory.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.partCode})`,
                    sublabel: `Stock: ${p.stockQty} · $${Number(p.unitPrice || 0).toFixed(2)}`,
                  }))}
                  placeholder="-- Select Spare Part from Inventory --"
                  searchPlaceholder="Search part by name or code..."
                />
              </div>
              <input
                type="number"
                min="1"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1.5 bg-app-input border border-app-border rounded-sm text-app-text text-center text-xs"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddPartToForm}
                disabled={!selectedPartId}
                className="px-3 py-1.5 bg-app-accent disabled:opacity-50 text-app-accentText font-semibold rounded-sm text-xs flex items-center gap-1"
              >
                <Plus size={14} weight="bold" /> Add
              </button>
            </div>

            {formData.requiredParts.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {formData.requiredParts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-app-card rounded-sm border border-app-border text-xs"
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.category')}</label>
              <SearchableSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  'Routine Maintenance',
                  'Brake System',
                  'Engine & Transmission',
                  'Electrical Diagnostics',
                  'Suspension & Steering',
                  'HVAC & AC System',
                ]}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.estimatedHours')}</label>
              <input
                type="number"
                step="0.5"
                value={formData.laborHours}
                onChange={(e) => setFormData({ ...formData, laborHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('services.standardPrice')} ($)</label>
              <input
                type="number"
                step="1"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('services.description')}</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          {/* Required Parts (Bill of Materials / Auto Stock-Out) */}
          <div className="p-3 bg-app-hover/40 border border-app-border rounded-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-app-text flex items-center gap-1.5">
                <Package size={15} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </label>
              <span className="text-[10px] text-app-muted">Parts auto-deducted when service is used</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedPartId}
                  onChange={(val) => setSelectedPartId(val)}
                  options={inventory.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.partCode})`,
                    sublabel: `Stock: ${p.stockQty} · $${Number(p.unitPrice || 0).toFixed(2)}`,
                  }))}
                  placeholder="-- Select Spare Part from Inventory --"
                  searchPlaceholder="Search part by name or code..."
                />
              </div>
              <input
                type="number"
                min="1"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1.5 bg-app-input border border-app-border rounded-sm text-app-text text-center text-xs"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddPartToForm}
                disabled={!selectedPartId}
                className="px-3 py-1.5 bg-app-accent disabled:opacity-50 text-app-accentText font-semibold rounded-sm text-xs flex items-center gap-1"
              >
                <Plus size={14} weight="bold" /> Add
              </button>
            </div>

            {formData.requiredParts.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {formData.requiredParts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-app-card rounded-sm border border-app-border text-xs"
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedService.name}</h3>
                <p className="text-app-muted">{selectedService.category}</p>
              </div>
              <span className="text-sm font-bold text-app-accent">${selectedService.estimatedCost}</span>
            </div>

            <div className="p-3 bg-app-input rounded-sm border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('services.description')}</p>
              <p className="text-app-text mt-1">{selectedService.description || 'Standard workshop procedure.'}</p>
            </div>

            {/* Bill of Materials list */}
            <div className="p-3 bg-app-card rounded-sm border border-app-border space-y-2">
              <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                <Package size={14} className="text-amber-500" />
                Required Spare Parts (Auto Stock-Out)
              </p>
              {selectedService.requiredParts && selectedService.requiredParts.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedService.requiredParts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-sm bg-app-hover/50 border border-app-border">
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

            <div className="flex items-center justify-end gap-2 pt-4">
              {can('services', 'update') && (
                <button
                  onClick={() => handleOpenEdit(selectedService)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} weight="bold" />
                  Edit
                </button>
              )}
              {can('services', 'delete') && (
                <button
                  onClick={() => handleOpenDelete(selectedService)}
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
        message={t('services.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
