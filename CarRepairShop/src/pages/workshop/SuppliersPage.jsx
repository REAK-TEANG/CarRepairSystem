import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Buildings, Star } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../../hooks/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, Input } from '../../components/ui'

export default function SuppliersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [currentPage, setCurrentPage] = useState(1)


  const { data: suppliersResponse, isLoading } = useSuppliers({
    search: debouncedSearch,
    page: currentPage,
    limit: 10,
  })

  const suppliers = suppliersResponse?.data || (Array.isArray(suppliersResponse) ? suppliersResponse : [])
  const pagination = suppliersResponse?.pagination || {
    page: currentPage,
    limit: 10,
    total: suppliers.length,
    totalPages: Math.ceil(suppliers.length / 10) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    categories: 'Engine Parts',
    rating: 4.8,
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      categories: 'Engine Parts',
      rating: 4.8,
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedSupplier(s)
    setFormData({ ...s })
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedSupplier(s)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedSupplier(s)
    setIsViewOpen(false); setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createSupplierMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedSupplier) return
    updateSupplierMutation.mutate({ id: selectedSupplier.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedSupplier) return
    deleteSupplierMutation.mutate(selectedSupplier.id)
    setIsDeleteOpen(false)
  }

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.suppliersProcurement')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {pagination.total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <Input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8"
            />
          </div>

          {can('suppliers', 'create') && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="gap-1.5 flex-shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span>{t('suppliers.addSupplier')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading && suppliers.length === 0 ? (
        <TableSkeleton rows={6} columns={5} />
      ) : suppliers.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery ? t('common.filter') : undefined}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('')
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
              <TableHead>{t('suppliers.companyName')}</TableHead>
              <TableHead>{t('suppliers.contactPerson')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('suppliers.categories')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('suppliers.paymentTerms')}</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow
                key={s.id}
                onClick={() => handleOpenView(s)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                      <Buildings size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-app-text">{s.name}</p>
                      <p className="text-[10px] text-app-muted">{s.email || 'supplier@domain.com'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-app-text">{s.contactPerson}</p>
                  <p className="text-[10px] text-app-muted font-mono">{s.phone}</p>
                </TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{s.categories}</TableCell>
                <TableCell className="text-app-muted hidden lg:table-cell">{s.address || 'Net 30 Days'}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                    <Star size={12} weight="fill" />
                    {s.rating || 4.8}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
        </Table>
      )}

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('suppliers.createSupplier')} maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('suppliers.companyName')} *</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bosch Auto Parts Cambodia"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.contactPerson')}</label>
              <Input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Manager / Rep Name"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.phone')} *</label>
              <Input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="023 888 999"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@supplier.com"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.categories')}</label>
              <Input
                type="text"
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="Brakes, Filters, Engine"
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
            <LoadingButton type="submit" loading={createSupplierMutation.isPending}>
              {t('suppliers.createSupplier')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('suppliers.editSupplier')}: ${selectedSupplier?.name}`} maxWidth="max-w-xl">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('suppliers.companyName')} *</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.contactPerson')}</label>
              <Input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('suppliers.phone')} *</label>
              <Input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            <LoadingButton type="submit" loading={updateSupplierMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Supplier Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('suppliers.title')} maxWidth="max-w-xl">
        {selectedSupplier && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div className="w-10 h-10 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Buildings size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedSupplier.name}</h3>
                <p className="text-app-muted">{selectedSupplier.categories}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.contactPerson')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.contactPerson}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.email')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.email || '—'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.address')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.address || 'Phnom Penh'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              {can('suppliers', 'update') && (
                <button
                  onClick={() => handleOpenEdit(selectedSupplier)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text font-semibold rounded-sm text-xs transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} weight="bold" />
                  Edit
                </button>
              )}
              {can('suppliers', 'delete') && (
                <button
                  onClick={() => handleOpenDelete(selectedSupplier)}
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
        message={t('suppliers.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
