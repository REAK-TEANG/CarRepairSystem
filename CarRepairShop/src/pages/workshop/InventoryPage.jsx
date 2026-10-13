import { useState, useEffect } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, ArrowUp, ArrowDown, Package, ClockCounterClockwise } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInventory, useInventoryTransactions, useCreatePart, useUpdatePart, useAdjustStock, useDeletePart } from '../../hooks/useInventory'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Button, Input, ImageUpload, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, SearchableSelect } from '../../components/ui'

const stockStatusOptions = ['All Stock', 'In Stock', 'Low Stock', 'Out of Stock']

export default function InventoryPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'transactions'
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All Stock')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryFilter])

  const { data: response, isLoading } = useInventory({
    page,
    limit: 10,
    search: debouncedSearch,
    category: categoryFilter,
  })
  const items = Array.isArray(response) ? response : (response?.data || [])
  const pagination = response?.pagination || null
  const totalCount = pagination ? pagination.total : items.length
  const totalPages = pagination ? pagination.totalPages : 1

  const { data: rawSuppliers = [] } = useSuppliers({ all: true })
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : (rawSuppliers?.data || [])
  const { data: transactions = [], isLoading: txLoading } = useInventoryTransactions()

  const createPartMutation = useCreatePart()
  const updatePartMutation = useUpdatePart()
  const adjustStockMutation = useAdjustStock()
  const deletePartMutation = useDeletePart()

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
    image: '',
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
      image: '',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (p) => {
    setSelectedPart(p)
    setFormData({
      partCode: p.partCode || '',
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || 'Engine',
      stockQty: p.stockQty || 0,
      minThreshold: p.minThreshold || 5,
      unitPrice: p.unitPrice || 0,
      costPrice: p.costPrice || 0,
      supplier: p.supplier || '',
      supplierId: p.supplierId || '',
      location: p.location || '',
      image: p.image || '',
    })
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenAdjust = (p, type) => {
    setSelectedPart(p)
    setAdjustType(type)
    setAdjustQty(type === 'Stock In' ? 10 : 1)
    setAdjustNotes('')
    setIsViewOpen(false); setIsAdjustOpen(true)
  }

  const handleOpenView = (p) => {
    setSelectedPart(p)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (p) => {
    setSelectedPart(p)
    setIsViewOpen(false); setIsDeleteOpen(true)
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
    if (stockFilter === 'In Stock') return p.stockQty > p.minThreshold
    if (stockFilter === 'Low Stock') return p.stockQty <= p.minThreshold && p.stockQty > 0
    if (stockFilter === 'Out of Stock') return p.stockQty === 0
    return true
  })

  return (
    <div className="space-y-3 sm:space-y-4 font-sans text-app-text">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.sparePartsInventory')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {activeTab === 'inventory' ? totalCount : transactions.length}
          </span>
        </div>
        {can('inventory', 'create') && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
          >
            <Plus size={14} weight="bold" />
            <span>{t('inventory.addPart')}</span>
          </Button>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 border-b border-app-border pb-2.5">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Package size={15} weight="bold" />
          <span>Parts</span>
          <span className="text-[10px] font-mono text-app-muted">{items.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <ClockCounterClockwise size={15} weight="bold" />
          <span>Stock Logs</span>
          <span className="text-[10px] font-mono text-app-muted">{transactions.length}</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Category and Status Filters + Inline Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-app-accent text-app-accentText font-semibold'
                      : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                  }`}
                >
                  {cat === 'All' ? t('common.all') : cat}
                </button>
              ))}
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

      {/* Table */}
      {isLoading && items.length === 0 ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filtered.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
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
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.partCode')}</TableHead>
              <TableHead>{t('inventory.partName')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('inventory.category')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('inventory.location')}</TableHead>
              <TableHead>{t('inventory.stockQty')}</TableHead>
              <TableHead>{t('inventory.sellingPrice')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((part) => (
              <TableRow
                key={part.id}
                onClick={() => handleOpenView(part)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono font-semibold text-app-accent">{part.partCode}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {part.image ? (
                      <img
                        src={part.image}
                        alt={part.name}
                        className="w-8 h-8 rounded-sm object-cover border border-app-border bg-app-card flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-sm bg-app-hover border border-app-border flex items-center justify-center flex-shrink-0 text-app-muted">
                        <Package size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-app-text">{part.name}</p>
                      <p className="text-[10px] text-app-muted">
                        {part.brand} · {t('inventory.supplier')}: {part.supplier}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{part.category}</TableCell>
                <TableCell className="text-app-muted hidden lg:table-cell font-mono">{part.location}</TableCell>
                <TableCell>
                  <span
                    className={`font-bold tabular-nums ${part.stockQty <= part.minThreshold ? 'text-red-600 dark:text-red-400' : 'text-app-text'}`}
                  >
                    {part.stockQty}
                  </span>
                  <span className="text-[10px] text-app-muted ml-1">(min {part.minThreshold})</span>
                </TableCell>
                <TableCell className="font-semibold text-app-text tabular-nums">
                  ${Number(part.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={part.stockQty === 0 ? 'Out of Stock' : part.stockQty <= part.minThreshold ? 'Low Stock' : 'In Stock'}
                    variant={part.stockQty === 0 ? 'danger' : part.stockQty <= part.minThreshold ? 'warning' : 'success'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooterBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={10}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </Table>
      )}
    </>
  ) : (
    /* Stock Movement & Auto Stock-Out Transactions View */
    <div className="bg-app-card rounded-sm border border-app-border shadow-card overflow-hidden">
      <div className="p-4 border-b border-app-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-app-text flex items-center gap-2">
            <ClockCounterClockwise size={16} className="text-app-accent" />
            Stock Movement & Auto Stock-Out History
          </h2>
          <p className="text-[11px] text-app-muted mt-0.5">Real-time audit trail of parts consumed by services, jobs, and manual adjustments</p>
        </div>
      </div>

        {txLoading && transactions.length === 0 ? (
          <TableSkeleton rows={6} columns={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No inventory transactions recorded"
            description="Stock movements and auto stock-outs for services will automatically appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Code / Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason / Reference</TableHead>
                <TableHead className="hidden sm:table-cell">Performed By</TableHead>
                <TableHead className="text-right">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <p className="font-semibold text-app-text">{tx.partName}</p>
                    <p className="font-mono text-[10px] text-app-accent">{tx.partCode}</p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
                        tx.type === 'Stock Out'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : tx.type === 'Stock In'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {tx.type === 'Stock Out' ? <ArrowDown size={12} weight="bold" /> : <ArrowUp size={12} weight="bold" />}
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold tabular-nums text-app-text">
                    {tx.type === 'Stock Out' ? `-${tx.quantity}` : `+${tx.quantity}`} units
                  </TableCell>
                  <TableCell>
                    <p className="text-app-text font-medium max-w-sm">{tx.notes || 'Routine stock operation'}</p>
                    {tx.referenceType && (
                      <span className="text-[10px] text-app-muted uppercase font-mono">
                        Ref: {tx.referenceType} #{tx.referenceId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-app-muted hidden sm:table-cell">
                    {tx.performedBy}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-app-muted">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooterBar totalCount={transactions.length} currentCount={transactions.length} />
          </Table>
        )}
      </div>
    )}

      {/* Add Part Modal */}
      {/* Add New Part Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('inventory.createPart')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.partName')} *</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ceramic Front Brake Pads"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.partCode')}</label>
              <Input
                type="text"
                value={formData.partCode}
                onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                placeholder="Auto-generated if empty"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.category')} *</label>
              <SearchableSelect
                value={formData.category}
                onChange={(cat) => setFormData({ ...formData, category: cat })}
                options={['Engine', 'Brakes', 'Fluids', 'Filters', 'Ignition', 'Electrical', 'Tires', 'Suspension']}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.supplier')}</label>
              <SearchableSelect
                value={formData.supplierId}
                onChange={(val, item) => {
                  setFormData({
                    ...formData,
                    supplierId: val,
                    supplier: item?.label || formData.supplier,
                  })
                }}
                options={suppliers.map((s) => ({
                  value: s.id,
                  label: s.name,
                  sublabel: s.phone || s.address || null,
                }))}
                placeholder="Search or select supplier..."
                searchPlaceholder="Type supplier name..."
                clearable
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.brand')}</label>
              <Input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Bosch, Denso, Mobil..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.location')}</label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Shelf A-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.stockQty')}</label>
              <Input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.minStock')}</label>
              <Input
                type="number"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.unitCost')} ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.sellingPrice')} ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="font-semibold text-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Part Photo / Image (Optional)</label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              label=""
            />
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
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.brand')}</label>
              <Input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.category')}</label>
              <SearchableSelect
                value={formData.category}
                onChange={(cat) => setFormData({ ...formData, category: cat })}
                options={['Engine', 'Brakes', 'Fluids', 'Filters', 'Ignition', 'Electrical', 'Tires', 'Suspension']}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.supplier')}</label>
              <SearchableSelect
                value={formData.supplierId}
                onChange={(val, item) => {
                  setFormData({
                    ...formData,
                    supplierId: val,
                    supplier: item?.label || formData.supplier,
                  })
                }}
                options={suppliers.map((s) => ({
                  value: s.id,
                  label: s.name,
                  sublabel: s.phone || s.address || null,
                }))}
                placeholder="Select Supplier"
                searchPlaceholder="Search supplier..."
                clearable
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.location')}</label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.stockQty')}</label>
              <Input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                className="font-semibold"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.unitCost')} ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('inventory.sellingPrice')} ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="font-semibold text-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Part Photo / Image (Optional)</label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              label=""
            />
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
          <div className="p-3 bg-app-hover/50 rounded-sm border border-app-border">
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
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent font-semibold"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.notes')}</label>
            <textarea
              rows={2}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="e.g. Delivery order #PO-9918 received"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-sm text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
            {selectedPart.image && (
              <div className="w-full h-44 rounded-sm overflow-hidden border border-app-border bg-app-card">
                <img
                  src={selectedPart.image}
                  alt={selectedPart.name}
                  className="w-full h-full object-contain bg-black/5 dark:bg-white/5"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedPart.partCode}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedPart.name}</h3>
              </div>
              <StatusBadge status={selectedPart.stockQty === 0 ? 'Out of Stock' : selectedPart.stockQty <= selectedPart.minThreshold ? 'Low Stock' : 'In Stock'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.stockQty')}</p>
                <p className="text-sm font-bold text-app-text mt-0.5">{selectedPart.stockQty} units</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.sellingPrice')}</p>
                <p className="text-sm font-bold text-app-accent mt-0.5">${Number(selectedPart.unitPrice).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.brand')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedPart.brand}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.category')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedPart.category}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.supplier')}</p>
                <p className="text-app-text mt-0.5">{selectedPart.supplier || 'N/A'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('inventory.location')}</p>
                <p className="font-mono text-app-text mt-0.5">{selectedPart.location || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 flex-wrap">
              {can('inventory', 'update') && (
                <>
                  {selectedPart.stockQty <= selectedPart.minThreshold && (
                    <button
                      onClick={() =>
                        adjustStockMutation.mutate({
                          id: selectedPart.id,
                          type: 'Stock In',
                          quantity: 10,
                          notes: `Quick Reorder Restock from ${selectedPart.supplier || 'Supplier'}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-sm text-xs transition-colors cursor-pointer border border-emerald-500/20"
                    >
                      <ArrowUp size={14} weight="bold" />
                      Quick Restock (+10)
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenAdjust(selectedPart, 'Stock In')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                  >
                    <ArrowUp size={14} weight="bold" />
                    Stock In (+)
                  </button>
                  <button
                    onClick={() => handleOpenAdjust(selectedPart, 'Stock Out')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                  >
                    <ArrowDown size={14} weight="bold" />
                    Stock Out (-)
                  </button>
                  <button
                    onClick={() => handleOpenEdit(selectedPart)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit
                  </button>
                </>
              )}
              {can('inventory', 'delete') && (
                <button
                  onClick={() => handleOpenDelete(selectedPart)}
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
        isLoading={deletePartMutation.isPending}
        title={t('common.delete')}
        message={t('inventory.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
