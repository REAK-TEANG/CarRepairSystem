import { useState } from 'react'
import { Plus, Trash, Phone, EnvelopeSimple, MapPin } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import {
  Modal,
  ConfirmDialog,
  EmptyState,
  TableSkeleton,
  LoadingButton,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooterBar,
  PageHeader,
  MobileDataCard,
} from '../../components/ui'

export default function CustomersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useCustomers({ page, limit: 10, search: debouncedSearch })
  const { items: customers, totalCount, totalPages } = usePaginationData(response, { page, limit: 10 })

  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const deleteCustomerMutation = useDeleteCustomer()

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
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
    setIsEditOpen(true)
  }

  const handleOpenDelete = (customer) => {
    setSelectedCustomer(customer)
    setIsDeleteOpen(true)
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
      <PageHeader
        title={t('titles.customerDirectory')}
        count={totalCount}
        searchQuery={searchQuery}
        onSearch={(e) => {
          setSearchQuery(e.target.value)
          setPage(1)
        }}
        searchPlaceholder={t('common.quickSearch')}
        actions={
          can('customers', 'create') && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="flex-shrink-0"
              title={t('customers.addCustomer')}
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">{t('customers.addCustomer')}</span>
            </Button>
          )
        }
      />

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
        <>
          {/* 1. Mobile Native Card View (< 768px) */}
          <div className="space-y-2.5 md:hidden">
            {customers.map((customer) => (
              <MobileDataCard
                key={customer.id}
                title={customer.name}
                subtitle={customer.code}
                avatar={customer.name ? customer.name[0]?.toUpperCase() : 'C'}
                badge={customer.totalSpent || '$0.00'}
                badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                onClick={() => handleOpenEdit(customer)}
                metadata={[
                  {
                    icon: <Phone size={13} weight="bold" />,
                    value: (
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline text-app-accent font-semibold"
                      >
                        {customer.phone}
                      </a>
                    ),
                  },
                  {
                    icon: <EnvelopeSimple size={13} weight="bold" />,
                    value: customer.email || 'No email',
                  },
                  ...(customer.address
                    ? [
                        {
                          icon: <MapPin size={13} weight="bold" />,
                          value: customer.address,
                        },
                      ]
                    : []),
                ]}
              />
            ))}
          </div>

          {/* 2. Desktop High-Density Table (>= 768px) */}
          <div className="hidden md:block">
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
                    onClick={() => handleOpenEdit(customer)}
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
            </Table>
          </div>

          {/* Universal Responsive Pagination Bar */}
          <TableFooterBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={10}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      )}

      {/* Mobile Floating Action Button (FAB) for adding customer */}
      {can('customers', 'create') && (
        <button
          onClick={handleOpenAdd}
          className="fixed right-4 bottom-20 z-40 md:hidden flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-app-accent text-app-accentText shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer border border-white/20"
          aria-label={t('customers.addCustomer')}
        >
          <Plus size={22} weight="bold" />
        </button>
      )}

      {/* Add Customer Modal (Bottom Sheet on Mobile) */}
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
                type="tel"
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
              <Plus size={14} weight="bold" className="sm:mr-1" />
              <span className="hidden sm:inline">{t('customers.createCustomer')}</span>
              <span className="sm:hidden">Create</span>
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal (Bottom Sheet on Mobile) */}
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
                type="tel"
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
          <div className="flex items-center justify-between pt-4 border-t border-app-border">
            {can('customers', 'delete') ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                onClick={() => {
                  handleOpenDelete(selectedCustomer)
                  setIsEditOpen(false)
                }}
              >
                <Trash size={14} className="mr-1.5" />
                {t('common.delete')}
              </Button>
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
              <LoadingButton type="submit" loading={updateCustomerMutation.isPending}>
                {t('common.saveChanges')}
              </LoadingButton>
            </div>
          </div>
        </form>
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
