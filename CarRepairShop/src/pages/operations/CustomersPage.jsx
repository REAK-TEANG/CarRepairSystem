import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, MapPin, User } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers'
import { useAuth } from '@/context/AuthContext'
import { ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CustomersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()
  const deleteCustomerMutation = useDeleteCustomer()

  const [searchQuery, setSearchQuery] = useState('')

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
    setIsEditOpen(true)
  }

  const handleOpenView = (customer) => {
    setSelectedCustomer(customer)
    setIsViewOpen(true)
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

  const customerList = Array.isArray(customers) ? customers : []
  const query = searchQuery.trim().toLowerCase()
  const filtered = customerList.filter((c) => {
    if (!query) return true
    return (
      (c?.name || '').toLowerCase().includes(query) ||
      (c?.phone || '').toLowerCase().includes(query) ||
      (c?.code || '').toLowerCase().includes(query) ||
      (c?.email || '').toLowerCase().includes(query) ||
      (c?.address || '').toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4 text-app-text font-sans transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.customerDirectory')}</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-app-hover text-app-muted border border-app-border">
            {customers.length}
          </span>
        </div>
        {can('customers', 'create') && (
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="inline-flex items-center gap-1.5"
          >
            <Plus size={15} weight="bold" />
            {t('customers.addCustomer')}
          </Button>
        )}
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-3.5 border-b border-app-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-xs">
              {t('common.cancel')}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && customers.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery ? t('common.filter') : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
            />
          ) : (
            <Table className="w-full text-xs">
              <TableHeader>
                <TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-transparent">
                  <TableHead className="px-6 py-3 font-semibold">{t('customers.customerCode')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('customers.fullName')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">{t('customers.phone')}</TableHead>
                  <TableHead className="px-6 py-3 hidden md:table-cell font-semibold">{t('customers.email')}</TableHead>
                  <TableHead className="px-6 py-3 hidden lg:table-cell font-semibold text-right">{t('customers.totalSpent')}</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-app-border">
                {filtered.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-app-hover/60 transition-colors group">
                    <TableCell className="px-6 py-3.5 font-mono font-semibold text-app-accent">{customer.code}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-app-hover flex items-center justify-center text-app-muted font-bold text-[11px] flex-shrink-0">
                          {customer.name[0]}
                        </div>
                        <span className="font-semibold text-app-text">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted">{customer.phone}</TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted hidden md:table-cell">{customer.email || '—'}</TableCell>
                    <TableCell className="px-6 py-3.5 font-semibold text-app-text text-right tabular-nums hidden lg:table-cell">
                      {customer.totalSpent || '$0.00'}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenView(customer)}
                          className="h-7 w-7 p-0 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </Button>
                        {can('customers', 'update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(customer)}
                            className="h-7 w-7 p-0 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                            title={t('common.edit')}
                          >
                            <PencilSimple size={15} />
                          </Button>
                        )}
                        {can('customers', 'delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(customer)}
                            className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash size={15} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('customers.createCustomer')}</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('customers.fullName')} *</Label>
            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Sokha Chan" className="w-full h-9 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('customers.phone')} *</Label>
              <Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="012 345 678" className="w-full h-9 rounded-xl font-mono" />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('customers.email')}</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="customer@email.com" className="w-full h-9 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('customers.address')}</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Phnom Penh, Cambodia" className="w-full h-9 rounded-xl" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer">{t('common.cancel')}</Button>
            <LoadingButton type="submit" loading={createCustomerMutation.isPending}>
              {t('customers.createCustomer')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{`${t('customers.editCustomer')}: ${selectedCustomer?.code}`}</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('customers.fullName')} *</Label>
            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-9 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('customers.phone')} *</Label>
              <Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full h-9 rounded-xl font-mono" />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('customers.email')}</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-9 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('customers.address')}</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full h-9 rounded-xl" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer">{t('common.cancel')}</Button>
            <LoadingButton type="submit" loading={updateCustomerMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* View Customer Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('customers.title')}</DialogTitle></DialogHeader>
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <User size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedCustomer.name}</h3>
                <p className="font-mono text-app-accent font-semibold">{selectedCustomer.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.email')}</p>
                <p className="font-semibold text-app-text mt-0.5 truncate">{selectedCustomer.email || '—'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.totalSpent')}</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedCustomer.totalSpent || '$0.00'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.lastService')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedCustomer.registrationDate || '2026-01-15'}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="p-3 bg-app-input rounded-xl border border-app-border flex items-start gap-2">
                <MapPin size={16} className="text-app-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-app-muted uppercase font-semibold">{t('customers.address')}</p>
                  <p className="text-app-text font-medium">{selectedCustomer.address}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent></Dialog>

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
