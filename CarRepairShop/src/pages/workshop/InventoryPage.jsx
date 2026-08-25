import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, ArrowUp, ArrowDown, Eye } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInventory, useCreatePart, useUpdatePart, useAdjustStock, useDeletePart } from '../../hooks/useInventory'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

const stockStatusOptions = ['All Stock', 'In Stock', 'Low Stock', 'Out of Stock']

export default function InventoryPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: items = [], isLoading } = useInventory()
  const { data: suppliers = [] } = useSuppliers()

  const createPartMutation = useCreatePart()
  const updatePartMutation = useUpdatePart()
  const adjustStockMutation = useAdjustStock()
  const deletePartMutation = useDeletePart()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All Stock')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)

  // Adjust Form
  const [adjustType, setAdjustType] = useState('Stock In')
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustNotes, setAdjustNotes] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    partCode: '',
    name: '',
    brand: '',
    category: 'Engine',
    stockQty: 0,
    minThreshold: 5,
    unitPrice: 0.0,
    costPrice: 0.0,
    supplier: '',
    supplierId: '',
    location: 'Shelf A-1',
  })

  const handleOpenAdd = () => {
    const defaultSup = suppliers[0]
    setFormData({
      partCode: `PRT-2026-${String(items.length + 1).padStart(3, '0')}`,
      name: '',
      brand: '',
      category: 'Engine',
      stockQty: 10,
      minThreshold: 5,
      unitPrice: 45.0,
      costPrice: 28.0,
      supplier: defaultSup ? defaultSup.name : 'Bosch Auto Parts',
      supplierId: defaultSup ? defaultSup.id : '',
      location: 'Shelf A-1',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (p) => {
    setSelectedPart(p)
    setFormData({ ...p })
    setIsEditOpen(true)
  }

  const handleOpenAdjust = (p, type) => {
    setSelectedPart(p)
    setAdjustType(type)
    setAdjustQty(type === 'Stock In' ? 10 : 1)
    setAdjustNotes('')
    setIsAdjustOpen(true)
  }

  const handleOpenView = (p) => {
    setSelectedPart(p)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (p) => {
    setSelectedPart(p)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createPartMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedPart) return
    updatePartMutation.mutate({ id: selectedPart.id, data: formData })
    setIsEditOpen(false)
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!selectedPart) return
    adjustStockMutation.mutate({
      id: selectedPart.id,
      type: adjustType,
      quantity: Number(adjustQty),
      notes: adjustNotes,
    })
    setIsAdjustOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedPart) return
    deletePartMutation.mutate(selectedPart.id)
    setIsDeleteOpen(false)
  }

  const categories = ['All', ...new Set(items.map((p) => p.category).filter(Boolean))]

  const filtered = items.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (p?.name || '').toLowerCase().includes(q) ||
      (p?.partCode || '').toLowerCase().includes(q) ||
      (p?.brand || '').toLowerCase().includes(q) ||
      (p?.supplier || '').toLowerCase().includes(q) ||
      (p?.location || '').toLowerCase().includes(q)

    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter

    let matchesStock = true
    if (stockFilter === 'In Stock') matchesStock = p.stockQty > p.minThreshold
    else if (stockFilter === 'Low Stock') matchesStock = p.stockQty <= p.minThreshold && p.stockQty > 0
    else if (stockFilter === 'Out of Stock') matchesStock = p.stockQty === 0

    return matchesSearch && matchesCat && matchesStock
  })

  return (
    <div className="space-y-6 font-sans text-app-text animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.sparePartsInventory')}</h1>
          <p className="text-xs text-app-muted mt-1">{items.length} {t('inventory.subtitle')}</p>
        </div>
        {can('inventory', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('inventory.addPart')}
          </button>
        )}
      </div>

      {/* Category and Status Filters */}
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
          {stockStatusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStockFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                stockFilter === st
                  ? 'bg-app-hover text-app-text border border-app-border font-semibold'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              {st === 'All Stock' ? t('common.all') : t(`status.${st}`, st)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden">
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
          {(searchQuery || categoryFilter !== 'All' || stockFilter !== 'All Stock') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('All')
                setStockFilter('All Stock')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && items.length === 0 ? (
            <TableSkeleton rows={6} columns={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || categoryFilter !== 'All' || stockFilter !== 'All Stock' ? t('common.filter') : undefined}
              onAction={
                searchQuery || categoryFilter !== 'All' || stockFilter !== 'All Stock'
                  ? () => {
                      setSearchQuery('')
                      setCategoryFilter('All')
                      setStockFilter('All Stock')
                    }
                  : undefined
              }
            />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('inventory.partCode')}</th>
                  <th className="px-6 py-3 font-semibold">{t('inventory.partName')}</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">{t('inventory.category')}</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">{t('inventory.location')}</th>
                  <th className="px-6 py-3 font-semibold">{t('inventory.stockQty')}</th>
                  <th className="px-6 py-3 font-semibold">{t('inventory.sellingPrice')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((part) => (
                  <tr key={part.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{part.partCode}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{part.name}</p>
                      <p className="text-[10px] text-app-muted">
                        {part.brand} · {t('inventory.supplier')}: {part.supplier}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{part.category}</td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell font-mono">{part.location}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`font-bold tabular-nums ${part.stockQty <= part.minThreshold ? 'text-red-600 dark:text-red-400' : 'text-app-text'}`}
                      >
                        {part.stockQty}
                      </span>
                      <span className="text-[10px] text-app-muted ml-1">(min {part.minThreshold})</span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums">
                      ${Number(part.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge
                        status={part.stockQty === 0 ? 'Out of Stock' : part.stockQty <= part.minThreshold ? 'Low Stock' : 'In Stock'}
                        variant={part.stockQty === 0 ? 'danger' : part.stockQty <= part.minThreshold ? 'warning' : 'success'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(part)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('inventory', 'update') && (
                          <>
                            <button
                              onClick={() => handleOpenAdjust(part, 'Stock In')}
                              title="Stock In (+)"
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-app-hover transition-colors"
                            >
                              <ArrowUp size={15} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(part, 'Stock Out')}
                              title="Stock Out (-)"
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-app-hover transition-colors"
                            >
                              <ArrowDown size={15} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(part)}
                              title={t('common.edit')}
                              className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            >
                              <PencilSimple size={15} />
                            </button>
                          </>
                        )}
                        {can('inventory', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(part)}
                            title={t('common.delete')}
                            className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
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

      {/* Add Part Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('inventory.createPart')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.partName')} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ceramic Front Brake Pads"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.partCode')}</label>
              <input
                type="text"
                value={formData.partCode}
                onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Engine">Engine</option>
                <option value="Brakes">Brakes</option>
                <option value="Fluids">Fluids</option>
                <option value="Filters">Filters</option>
                <option value="Ignition">Ignition</option>
                <option value="Electrical">Electrical</option>
                <option value="Tires">Tires</option>
                <option value="Suspension">Suspension</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.brand')}</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Bosch, Denso, Mobil..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.location')}</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Shelf A-1"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.stockQty')}</label>
              <input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.minStock')}</label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.unitCost')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.sellingPrice')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
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
            <LoadingButton type="submit" loading={createPartMutation.isPending}>
              {t('inventory.createPart')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Part Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('inventory.editPart')}: ${selectedPart?.partCode}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.partName')} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.brand')}</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.stockQty')}</label>
              <input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.unitCost')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.sellingPrice')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
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
            <LoadingButton type="submit" loading={updatePartMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`${adjustType}: ${selectedPart?.name}`}
      >
        <form onSubmit={handleAdjust} className="space-y-4 text-xs">
          <div className="p-3 bg-app-hover/50 rounded-xl border border-app-border">
            <p className="text-app-muted">
              {t('inventory.partCode')}: <span className="font-mono text-app-accent font-semibold">{selectedPart?.partCode}</span>
            </p>
            <p className="text-app-muted mt-0.5">
              {t('inventory.stockQty')}: <span className="font-bold text-app-text">{selectedPart?.stockQty}</span>
            </p>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.qty')} *</label>
            <input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.notes')}</label>
            <textarea
              rows={2}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="e.g. Delivery order #PO-9918 received"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={adjustStockMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Part Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('inventory.title')}>
        {selectedPart && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedPart.partCode}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedPart.name}</h3>
              </div>
              <StatusBadge status={selectedPart.stockQty === 0 ? 'Out of Stock' : selectedPart.stockQty <= selectedPart.minThreshold ? 'Low Stock' : 'In Stock'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.stockQty')}</p>
                <p className="text-sm font-bold text-app-text mt-0.5">{selectedPart.stockQty} units</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.sellingPrice')}</p>
                <p className="text-sm font-bold text-app-accent mt-0.5">${Number(selectedPart.unitPrice).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.brand')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedPart.brand}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.location')}</p>
                <p className="font-mono text-app-text mt-0.5">{selectedPart.location}</p>
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
        message={t('inventory.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
