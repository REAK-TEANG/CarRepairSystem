import { useState } from 'react'
import { Plus, Trash, Buildings, User, Phone, EnvelopeSimple } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../../hooks/useSuppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, Button, Input, PageHeader, MobileDataCard } from '../../components/ui'

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

  const { items: suppliers, pagination, totalCount } = usePaginationData(suppliersResponse, {
    page: currentPage,
    limit: 10,
  })


  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
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
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      categories: 'Engine Parts',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (s) => {
    setSelectedSupplier(s)
    setFormData({ ...s })
    setIsEditOpen(true)
  }

  const handleOpenDelete = (s) => {
    setSelectedSupplier(s)
    setIsDeleteOpen(true)
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
      <PageHeader
        title={t('titles.suppliersProcurement')}
        count={totalCount}
        searchQuery={searchQuery}
        onSearch={(e) => {
          setSearchQuery(e.target.value)
          setCurrentPage(1)
        }}
        searchPlaceholder={t('common.quickSearch')}
        actions={
          can('suppliers', 'create') && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="gap-1.5 flex-shrink-0"
              title={t('suppliers.addSupplier')}
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">{t('suppliers.addSupplier')}</span>
            </Button>
          )
        }
      />

      {/* Main Table */}
      {isLoading && suppliers.length === 0 ? (
        <TableSkeleton rows={6} columns={4} />
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
        <>
          {/* Mobile Cards View (< 768px) */}
          <div className="space-y-2.5 md:hidden">
            {suppliers.map((s) => (
              <MobileDataCard
                key={s.id}
                onClick={() => handleOpenEdit(s)}
                icon={<Buildings size={18} className="text-app-accent" />}
                title={s.name}
                subtitle={s.categories || 'Automotive Parts'}
                status={{
                  label: s.categories || 'Supplier',
                  color: 'blue',
                }}
                chips={[
                  ...(s.contactPerson
                    ? [
                        {
                          icon: <User size={13} weight="bold" />,
                          value: s.contactPerson,
                        },
                      ]
                    : []),
                  ...(s.phone
                    ? [
                        {
                          icon: <Phone size={13} weight="bold" />,
                          value: (
                            <a
                              href={`tel:${s.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline text-app-accent font-semibold"
                            >
                              {s.phone}
                            </a>
                          ),
                        },
                      ]
                    : []),
                  ...(s.email
                    ? [
                        {
                          icon: <EnvelopeSimple size={13} weight="bold" />,
                          value: s.email,
                        },
                      ]
                    : []),
                ]}
              />
            ))}
          </div>

          {/* Desktop High-Density Table (>= 768px) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('suppliers.companyName')}</TableHead>
                  <TableHead>{t('suppliers.contactPerson')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('suppliers.categories')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('suppliers.paymentTerms')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow
                    key={s.id}
                    onClick={() => handleOpenEdit(s)}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TableFooterBar pagination={pagination} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Mobile Floating Action Button (FAB) for Add Supplier */}
      {can('suppliers', 'create') && (
        <button
          onClick={handleOpenAdd}
          className="fixed right-4 bottom-20 z-40 md:hidden flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-app-accent text-app-accentText shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer border border-white/20"
          aria-label={t('suppliers.addSupplier')}
        >
          <Plus size={22} weight="bold" />
        </button>
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
              <Plus size={14} weight="bold" className="sm:mr-1" />
              <span className="hidden sm:inline">{t('suppliers.createSupplier')}</span>
              <span className="sm:hidden">Add</span>
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
          <div className="flex items-center justify-between pt-4 border-t border-app-border">
            {can('suppliers', 'delete') ? (
              <button
                type="button"
                onClick={() => {
                  handleOpenDelete(selectedSupplier)
                  setIsEditOpen(false)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash size={14} weight="bold" />
                <span>{t('common.delete')}</span>
              </button>
            ) : <div />}
            <div className="flex items-center gap-2.5">
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
          </div>
        </form>
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
