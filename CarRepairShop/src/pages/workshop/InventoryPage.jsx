import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Warning, ArrowUp, ArrowDown, Funnel, Eye } from '@phosphor-icons/react'
import { useInventory, useCreatePart, useUpdatePart, useAdjustStock, useDeletePart } from '../../hooks/useInventory'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

export default function InventoryPage() {
  const { can } = useAuth()
  const { data: items = [], isLoading } = useInventory()
  const { data: suppliers = [] } = useSuppliers()

  const createPartMutation = useCreatePart()
  const updatePartMutation = useUpdatePart()
  const adjustStockMutation = useAdjustStock()
  const deletePartMutation = useDeletePart()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [adjustType, setAdjustType] = useState('Stock In')

  // Form
  const [formData, setFormData] = useState({
    partCode: '',
    name: '',
    category: 'Brakes',
    brand: '',
    unitPrice: 50,
    stockQty: 20,
    minThreshold: 10,
    location: 'Shelf A-01',
    supplier: 'AutoParts Direct',
  })

  // Stock Adjustment Form
  const [adjustQty, setAdjustQty] = useState(10)
  const [adjustNotes, setAdjustNotes] = useState('')

  const handleOpenAdd = () => {
    setFormData({
      partCode: '',
      name: '',
      category: 'Brakes',
      brand: '',
      unitPrice: 45,
      stockQty: 20,
      minThreshold: 8,
      location: 'Shelf A-01',
      supplier: suppliers[0] ? suppliers[0].name : 'AutoParts Direct',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (p) => {
    setSelectedPart(p)
    setFormData({
      partCode: p.partCode,
      name: p.name,
      category: p.category,
      brand: p.brand,
      unitPrice: p.unitPrice,
      stockQty: p.stockQty,
      minThreshold: p.minThreshold,
      location: p.location,
      supplier: p.supplier,
    })
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

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPart) return
    adjustStockMutation.mutate({
      id: selectedPart.id,
      quantity: adjustQty,
      type: adjustType,
      notes: adjustNotes,
    })
    setIsAdjustOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedPart) return
    deletePartMutation.mutate(selectedPart.id)
    setIsDeleteOpen(false)
  }

  const categories = ['All', ...new Set(items.map((i) => i.category))]

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockCount = items.filter((i) => i.stockQty <= i.minThreshold).length

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Spare Parts Inventory</h1>
          <p className="text-xs text-app-muted mt-1">{items.length} parts cataloged · {lowStockCount} low stock alerts</p>
        </div>
        {can('inventory', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Add Spare Part
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Cataloged Parts</p>
          <p className="text-xl font-bold tabular-nums text-app-text">{items.length}</p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Low Stock Alerts</p>
          <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            {lowStockCount > 0 && <Warning size={18} weight="fill" />}
            {lowStockCount} items
          </p>
        </div>
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Units In Stock</p>
          <p className="text-xl font-bold tabular-nums text-app-accent">
            {items.reduce((sum, i) => sum + i.stockQty, 0)} units
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-app-muted flex items-center gap-1 mr-1">
          <Funnel size={14} /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search part name, code, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && items.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted">Loading spare parts inventory...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">Part Code</th>
                  <th className="px-6 py-3 font-semibold">Part Details</th>
                  <th className="px-6 py-3 font-semibold hidden md:table-cell">Category</th>
                  <th className="px-6 py-3 font-semibold hidden lg:table-cell">Location</th>
                  <th className="px-6 py-3 font-semibold">Stock Qty</th>
                  <th className="px-6 py-3 font-semibold">Unit Price</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((part) => (
                  <tr key={part.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{part.partCode}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{part.name}</p>
                      <p className="text-[10px] text-app-muted">{part.brand} · Supplier: {part.supplier}</p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{part.category}</td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell font-mono">{part.location}</td>
                    <td className="px-6 py-3.5">
                      <span className={`font-bold tabular-nums ${part.stockQty <= part.minThreshold ? 'text-red-600 dark:text-red-400' : 'text-app-text'}`}>
                        {part.stockQty}
                      </span>
                      <span className="text-[10px] text-app-muted ml-1">(min {part.minThreshold})</span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums">${Number(part.unitPrice).toFixed(2)}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge
                        status={part.status}
                        variant={part.stockQty === 0 ? 'danger' : part.stockQty <= part.minThreshold ? 'warning' : 'success'}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(part)}
                          className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {can('inventory', 'update') && (
                          <>
                            <button
                              onClick={() => handleOpenAdjust(part, 'Stock In')}
                              title="Stock In (+)"
                              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-app-hover transition-colors"
                            >
                              <ArrowUp size={15} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(part, 'Stock Out')}
                              title="Stock Out (-)"
                              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-app-hover transition-colors"
                            >
                              <ArrowDown size={15} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(part)}
                              title="Edit Part"
                              className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            >
                              <PencilSimple size={15} />
                            </button>
                          </>
                        )}
                        {can('inventory', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(part)}
                            title="Delete Part"
                            className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Spare Part">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Part Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ceramic Front Brake Pads"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Part Code / SKU</label>
              <input
                type="text"
                value={formData.partCode}
                onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
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
              <label className="block text-app-muted font-medium mb-1">Brand / OEM</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Brembo, Mobil 1..."
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Initial Stock Qty</label>
              <input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Min. Alert Threshold</label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value, 10) || 5 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Warehouse Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Shelf B-04"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Primary Supplier</label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Save Spare Part
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Part Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Part: ${selectedPart?.partCode}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">Part Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Min. Alert Threshold</label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value, 10) || 5 })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={`${adjustType}: ${selectedPart?.name}`}>
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
            <div>
              <p className="font-mono text-app-accent font-semibold">{selectedPart?.partCode}</p>
              <p className="text-app-muted">Current Stock: <span className="font-bold text-app-text">{selectedPart?.stockQty} units</span></p>
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">
              {adjustType === 'Stock In' ? 'Quantity to Add (+)' : 'Quantity to Remove (-)'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text font-bold text-base focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Reason / Reference PO #</label>
            <input
              type="text"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="e.g. PO-2026-88 Received from supplier"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${
                adjustType === 'Stock In' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Confirm {adjustType}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Part Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Spare Part Specification">
        {selectedPart && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedPart.name}</h3>
                <p className="font-mono text-app-accent font-semibold">{selectedPart.partCode}</p>
              </div>
              <StatusBadge status={selectedPart.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Brand / Manufacturer</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedPart.brand}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Unit Price</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">${Number(selectedPart.unitPrice).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Current Stock Qty</p>
                <p className="font-bold text-app-accent mt-0.5">{selectedPart.stockQty} units</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Storage Location</p>
                <p className="font-mono font-semibold text-app-text mt-0.5">{selectedPart.location}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Part Deletion">
        <div className="space-y-4 text-xs">
          <p className="text-app-text">
            Are you sure you want to delete <span className="font-bold">{selectedPart?.name}</span> ({selectedPart?.partCode})?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Delete Part
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
