import { useState, useEffect } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, MapPin, User } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmDialog, EmptyState, TableSkeleton, LoadingButton, Button, Input, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar } from '../../components/ui'

export default function CustomersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useCustomers({ page, limit: 10, search: debouncedSearch })
  const customers = Array.isArray(response) ? response : (response?.data || [])
  const pagination = response?.pagination || null
  const totalCount = pagination ? pagination.total : customers.length
  const totalPages = pagination ? pagination.totalPages : 1

  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const deleteCustomerMutation = useDeleteCustomer()

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '' })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || '',
    })
    setIsViewOpen(false); setIsEditOpen(true)
  }

  const handleOpenView = (customer) => {
    setSelectedCustomer(customer)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (customer) => {
    setSelectedCustomer(customer)
    setIsViewOpen(false); setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    createCustomerMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedCustomer) return
    updateCustomerMutation.mutate({ id: selectedCustomer.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return
    deleteCustomerMutation.mutate(selectedCustomer.id)
    setIsDeleteOpen(false)
  }

  return (
    <div className="space-y-3 sm:space-y-4 text-app-text font-sans transition-colors duration-200">
      {/* Page Header with Integrated Search and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.customerDirectory')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>

          {can('customers', 'create') && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="flex-shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span>{t('customers.addCustomer')}</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading && customers.length === 0 ? (
        <TableSkeleton rows={6} columns={5} />
      ) : customers.length === 0 ? (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <EmptyState
            title={t('common.noRecords')}
            description={t('common.noData')}
            actionText={searchQuery ? t('common.filter') : undefined}
            onAction={
              searchQuery
                ? () => {
                    setSearchQuery('')
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
              <TableHead>{t('customers.customerCode')}</TableHead>
              <TableHead>{t('customers.fullName')}</TableHead>
              <TableHead>{t('customers.phone')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('customers.email')}</TableHead>
              <TableHead className="hidden lg:table-cell text-right">{t('customers.totalSpent')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                onClick={() => handleOpenView(customer)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono font-semibold text-app-accent">{customer.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-sm bg-app-hover flex items-center justify-center text-app-muted font-bold text-[10px] flex-shrink-0">
                      {customer.name[0]}
                    </div>
                    <span className="font-semibold text-app-text">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-app-muted">{customer.phone}</TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{customer.email || '—'}</TableCell>
                <TableCell className="font-semibold text-app-text text-right tabular-nums hidden lg:table-cell">
                  {customer.totalSpent || '$0.00'}
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

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('customers.createCustomer')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('customers.fullName')} *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sokha Chan"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('customers.phone')} *</label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 678"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('customers.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('customers.address')}</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Phnom Penh, Cambodia"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={createCustomerMutation.isPending}>
              {t('customers.createCustomer')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('customers.editCustomer')}: ${selectedCustomer?.code}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('customers.fullName')} *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('customers.phone')} *</label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('customers.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('customers.address')}</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={updateCustomerMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('customers.title')}>
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div className="w-10 h-10 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <User size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedCustomer.name}</h3>
                <p className="font-mono text-app-accent font-semibold">{selectedCustomer.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.email')}</p>
                <p className="font-semibold text-app-text mt-0.5 truncate">{selectedCustomer.email || '—'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.totalSpent')}</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedCustomer.totalSpent || '$0.00'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.lastService')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.registrationDate || '2026-01-15'}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="p-3 bg-app-input rounded-sm border border-app-border flex items-start gap-2">
                <MapPin size={16} className="text-app-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.address')}</p>
                  <p className="text-app-text font-medium">{selectedCustomer.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              {can('customers', 'update') && (
                <Button
                  variant="outline"
                  onClick={() => handleOpenEdit(selectedCustomer)}
                >
                  <PencilSimple size={14} weight="bold" />
                  Edit
                </Button>
              )}
              {can('customers', 'delete') && (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenDelete(selectedCustomer)}
                >
                  <Trash size={14} weight="bold" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('customers.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
