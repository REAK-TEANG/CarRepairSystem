import { useState, useMemo, useRef, useEffect } from 'react'
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowDown,
  Package,
  ClockCounterClockwise,
  CalendarBlank,
  CaretDown,
  ArrowsDownUp,
  X,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInventory, useInventoryTransactions, useCreatePart, useUpdatePart, useAdjustStock, useDeletePart } from '../../hooks/useInventory'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Button, Input, Textarea, ImageUpload, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, SearchableSelect } from '../../components/ui'


export default function InventoryPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'transactions'
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All Stock')
  const [page, setPage] = useState(1)

  // Stock Logs (Transactions) Tab States: Search, Filter, Date Range, Sort, Pagination
  const [txSearch, setTxSearch] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('All') // 'All' | 'Stock Out' | 'Stock In' | 'Adjustment'
  const [txDateRange, setTxDateRange] = useState('all') // 'all' | 'today' | 'this_week' | 'this_month' | 'custom'
  const [txCustomStart, setTxCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [txCustomEnd, setTxCustomEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [isTxDateDropdownOpen, setIsTxDateDropdownOpen] = useState(false)
  const txDateDropdownRef = useRef(null)

  const [txSortField, setTxSortField] = useState('createdAt') // 'createdAt' | 'quantity' | 'partName'
  const [txSortOrder, setTxSortOrder] = useState('desc') // 'desc' | 'asc'
  const [txPage, setTxPage] = useState(1)
  const txPageSize = 10

  useEffect(() => {
    if (!isTxDateDropdownOpen) return
    const handleClickOutside = (e) => {
      if (txDateDropdownRef.current && !txDateDropdownRef.current.contains(e.target)) {
        setIsTxDateDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isTxDateDropdownOpen])


  const { data: response, isLoading } = useInventory({
    page,
    limit: 10,
    search: debouncedSearch,
    category: categoryFilter,
  })
  const { items, totalCount, totalPages } = usePaginationData(response, { page, limit: 10 })

  const { data: rawSuppliers = [] } = useSuppliers({ all: true })
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : (rawSuppliers?.data || [])
  const { data: transactions = [], isLoading: txLoading } = useInventoryTransactions()

  // Stock Logs active date bounds
  const txActiveBounds = useMemo(() => {
    const now = new Date()
    if (txDateRange === 'today') {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: t('common.today', 'Today') }
    }
    if (txDateRange === 'this_week') {
      const day = now.getDay()
      const diff = (day + 6) % 7 // Monday
      const start = new Date(now)
      start.setDate(now.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: t('reports.thisWeek', 'This Week') }
    }
    if (txDateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end, label: t('reports.thisMonth', 'This Month') }
    }
    if (txDateRange === 'custom' && txCustomStart && txCustomEnd) {
      const start = new Date(`${txCustomStart}T00:00:00`)
      const end = new Date(`${txCustomEnd}T23:59:59.999`)
      return { start, end, label: `${txCustomStart} → ${txCustomEnd}` }
    }
    return { start: null, end: null, label: t('reports.allTime', 'All Time') }
  }, [txDateRange, txCustomStart, txCustomEnd, t])

  // Filtered and Sorted Stock Logs (Transactions)
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    // 1. Type Filter
    if (txTypeFilter !== 'All') {
      result = result.filter((tx) => tx.type === txTypeFilter)
    }

    // 2. Search Query
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase()
      result = result.filter(
        (tx) =>
          tx.partName?.toLowerCase().includes(q) ||
          tx.partCode?.toLowerCase().includes(q) ||
          tx.performedBy?.toLowerCase().includes(q) ||
          tx.notes?.toLowerCase().includes(q) ||
          tx.type?.toLowerCase().includes(q) ||
          String(tx.referenceId || '').includes(q)
      )
    }

    // 3. Custom Date Range Filter
    if (txActiveBounds.start && txActiveBounds.end) {
      result = result.filter((tx) => {
        if (!tx.createdAt) return true
        const d = new Date(tx.createdAt)
        return !isNaN(d.getTime()) && d >= txActiveBounds.start && d <= txActiveBounds.end
      })
    }

    // 4. Custom Sort
    result.sort((a, b) => {
      let comparison = 0
      if (txSortField === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        comparison = dateA - dateB
      } else if (txSortField === 'quantity') {
        comparison = (Number(a.quantity) || 0) - (Number(b.quantity) || 0)
      } else if (txSortField === 'partName') {
        comparison = String(a.partName || '').localeCompare(String(b.partName || ''))
      }
      return txSortOrder === 'desc' ? -comparison : comparison
    })

    return result
  }, [transactions, txTypeFilter, txSearch, txActiveBounds, txSortField, txSortOrder])

  // Pagination for Stock Logs
  const txTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / txPageSize))
  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * txPageSize
    return filteredTransactions.slice(start, start + txPageSize)
  }, [filteredTransactions, txPage, txPageSize])

  const handleToggleTxSort = (field) => {
    if (txSortField === field) {
      setTxSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setTxSortField(field)
      setTxSortOrder(field === 'createdAt' ? 'desc' : 'asc')
    }
    setTxPage(1)
  }

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
    const highestNum = items.reduce((max, item) => {
      const match = item.partCode?.match(/(\d+)$/)
      return match ? Math.max(max, parseInt(match[1], 10)) : max
    }, 0)
    const nextNum = Math.max(highestNum + 1, totalCount + 1, 25)
    setFormData({
      partCode: `PRT-2026-${String(nextNum).padStart(3, '0')}`,
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
                  onClick={() => {
                    setCategoryFilter(cat)
                    setPage(1)
                  }}
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
              <Input
                type="text"
                placeholder={t('common.quickSearch')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-8"
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
                    setPage(1)
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
      <div className="p-3.5 sm:p-4 border-b border-app-border flex flex-col gap-3">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-app-text flex items-center gap-2">
              <ClockCounterClockwise size={16} className="text-app-accent" />
              Stock Movement & Auto Stock-Out History
            </h2>
            <p className="text-[11px] text-app-muted mt-0.5">
              Real-time audit trail of parts consumed by services, jobs, and manual adjustments
            </p>
          </div>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-hover border border-app-border rounded self-start sm:self-auto">
            {filteredTransactions.length} logs
          </span>
        </div>

        {/* Toolbar: Search + Type Filter + Custom Date Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-app-border/50">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { key: 'All', label: t('common.all', 'All') },
              { key: 'Stock Out', label: 'Stock Out', icon: ArrowDown, color: 'text-rose-500' },
              { key: 'Stock In', label: 'Stock In', icon: ArrowUp, color: 'text-emerald-500' },
              { key: 'Adjustment', label: 'Adjustments' },
            ].map((typeItem) => (
              <button
                key={typeItem.key}
                type="button"
                onClick={() => {
                  setTxTypeFilter(typeItem.key)
                  setTxPage(1)
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  txTypeFilter === typeItem.key
                    ? 'bg-app-accent text-app-accentText font-semibold'
                    : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                }`}
              >
                {typeItem.icon && <typeItem.icon size={11} weight="bold" className={typeItem.color} />}
                <span>{typeItem.label}</span>
              </button>
            ))}
          </div>

          {/* Search + Custom Date Range Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                type="text"
                placeholder="Search part, reason, user..."
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value)
                  setTxPage(1)
                }}
                className="w-full pl-8 pr-7 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none focus:border-app-accent"
              />
              {txSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setTxSearch('')
                    setTxPage(1)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </div>

            {/* Custom Date Range Filter Dropdown */}
            <div ref={txDateDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsTxDateDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-app-card border border-app-border hover:border-app-accent/50 text-app-text rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer select-none whitespace-nowrap"
              >
                <CalendarBlank size={13} className="text-app-muted" weight="bold" />
                <span>{txActiveBounds.label}</span>
                <CaretDown size={11} className={`text-app-muted transition-transform duration-200 ${isTxDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTxDateDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-app-card border border-app-border rounded-lg shadow-xl p-3 z-50 animate-modal-content space-y-3">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-app-hover/60 rounded-md">
                    {[
                      { key: 'all', label: t('reports.allTime', 'All Time') },
                      { key: 'today', label: t('common.today', 'Today') },
                      { key: 'this_week', label: t('reports.thisWeek', 'This Week') },
                      { key: 'this_month', label: t('reports.thisMonth', 'This Month') },
                      { key: 'custom', label: t('reports.customDate', 'Custom Range') },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setTxDateRange(item.key)
                          setTxPage(1)
                          if (item.key !== 'custom') setIsTxDateDropdownOpen(false)
                        }}
                        className={`py-1 px-2 text-xs font-semibold rounded transition-colors text-center cursor-pointer ${
                          txDateRange === item.key
                            ? 'bg-app-accent text-app-accentText shadow-xs'
                            : 'text-app-muted hover:text-app-text'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {txDateRange === 'custom' && (
                    <div className="space-y-2 pt-1 border-t border-app-border">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-app-muted font-medium mb-1">
                            {t('reports.startDate', 'Start Date')}
                          </label>
                          <input
                            type="date"
                            value={txCustomStart}
                            onChange={(e) => {
                              setTxCustomStart(e.target.value)
                              setTxPage(1)
                            }}
                            className="w-full px-2 py-1 bg-app-input border border-app-border rounded text-xs text-app-text focus:outline-none focus:border-app-accent font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-app-muted font-medium mb-1">
                            {t('reports.endDate', 'End Date')}
                          </label>
                          <input
                            type="date"
                            value={txCustomEnd}
                            onChange={(e) => {
                              setTxCustomEnd(e.target.value)
                              setTxPage(1)
                            }}
                            className="w-full px-2 py-1 bg-app-input border border-app-border rounded text-xs text-app-text focus:outline-none focus:border-app-accent font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTxDateDropdownOpen(false)}
                        className="w-full py-1 px-3 bg-app-accent text-app-accentText font-semibold rounded-md text-xs hover:bg-app-accentHover transition-colors cursor-pointer text-center"
                      >
                        {t('reports.apply', 'Apply Range')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => handleToggleTxSort('createdAt')}
              title={`Sort by Date: currently ${txSortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-app-card border border-app-border hover:border-app-accent/50 text-app-text rounded-md text-xs font-medium transition-colors cursor-pointer select-none"
            >
              <ArrowsDownUp size={13} className="text-app-accent" />
              <span className="hidden sm:inline">
                {txSortField === 'createdAt'
                  ? txSortOrder === 'desc'
                    ? 'Newest'
                    : 'Oldest'
                  : txSortField === 'quantity'
                  ? txSortOrder === 'desc'
                    ? 'Qty: High-Low'
                    : 'Qty: Low-High'
                  : txSortOrder === 'desc'
                  ? 'Z-A'
                  : 'A-Z'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {txLoading && transactions.length === 0 ? (
        <TableSkeleton rows={6} columns={6} />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title="No inventory transactions found"
          description={
            txSearch || txTypeFilter !== 'All' || txDateRange !== 'all'
              ? 'No stock logs matched your search or date filter criteria.'
              : 'Stock movements and auto stock-outs for services will automatically appear here.'
          }
          actionText={txSearch || txTypeFilter !== 'All' || txDateRange !== 'all' ? 'Reset Filters' : undefined}
          onAction={
            txSearch || txTypeFilter !== 'All' || txDateRange !== 'all'
              ? () => {
                  setTxSearch('')
                  setTxTypeFilter('All')
                  setTxDateRange('all')
                  setTxPage(1)
                }
              : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleToggleTxSort('partName')}
                className="cursor-pointer hover:text-app-text select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Part Code / Item</span>
                  {txSortField === 'partName' && (
                    <span className="text-app-accent font-mono text-[10px]">
                      {txSortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                onClick={() => handleToggleTxSort('quantity')}
                className="cursor-pointer hover:text-app-text select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Quantity</span>
                  {txSortField === 'quantity' && (
                    <span className="text-app-accent font-mono text-[10px]">
                      {txSortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Reason / Reference</TableHead>
              <TableHead className="hidden sm:table-cell">Performed By</TableHead>
              <TableHead
                onClick={() => handleToggleTxSort('createdAt')}
                className="text-right cursor-pointer hover:text-app-text select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Date & Time</span>
                  {txSortField === 'createdAt' && (
                    <span className="text-app-accent font-mono text-[10px]">
                      {txSortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((tx) => (
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
                    {tx.type === 'Stock Out' ? (
                      <ArrowDown size={12} weight="bold" />
                    ) : (
                      <ArrowUp size={12} weight="bold" />
                    )}
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
          <TableFooterBar
            totalCount={filteredTransactions.length}
            page={txPage}
            totalPages={txTotalPages}
            pageSize={txPageSize}
            onPrev={() => setTxPage((p) => Math.max(1, p - 1))}
            onNext={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
          />
        </Table>
      )}
    </div>
  )}

      {/* Add Part Modal */}
      {/* Add New Part Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('inventory.createPart')} maxWidth="max-w-2xl">
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
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('inventory.editPart')}: ${selectedPart?.partCode}`} maxWidth="max-w-2xl">
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
            <Input
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="font-semibold"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.notes')}</label>
            <Textarea
              rows={2}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="e.g. Delivery order #PO-9918 received"
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
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('inventory.title')} maxWidth="max-w-2xl">
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
