import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Buildings, Star, Eye } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers'
import { useAuth } from '@/context/AuthContext'
import { ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SuppliersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  const [searchQuery, setSearchQuery] = useState('')

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
    setIsEditOpen(true)
  }

  const handleOpenView = (s) => {
    setSelectedSupplier(s)
    setIsViewOpen(true)
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

  const query = searchQuery.trim().toLowerCase()
  const supplierList = Array.isArray(suppliers) ? suppliers : []
  const filtered = supplierList.filter((s) => {
    if (!query) return true
    return (
      (s?.name || '').toLowerCase().includes(query) ||
      (s?.categories || '').toLowerCase().includes(query) ||
      (s?.contactPerson || '').toLowerCase().includes(query) ||
      (s?.phone || '').toLowerCase().includes(query) ||
      (s?.email || '').toLowerCase().includes(query) ||
      (s?.address || '').toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('titles.suppliersProcurement')}</h1>
          <Badge variant="outline" className="text-xs font-mono">{suppliers.length}</Badge>
        </div>
        {can('suppliers', 'create') && (
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={16} weight="bold" />
            {t('suppliers.addSupplier')}
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
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
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              {t('common.cancel')}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && suppliers.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery ? t('common.filter') : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
            />
          ) : (
            <Table className="w-full text-xs"><TableHeader><TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-app-hover/50"><TableHead className="px-6 py-3 font-semibold">{t('suppliers.companyName')}</TableHead><TableHead className="px-6 py-3 font-semibold">{t('suppliers.contactPerson')}</TableHead><TableHead className="px-6 py-3 hidden md:table-cell font-semibold">{t('suppliers.categories')}</TableHead><TableHead className="px-6 py-3 hidden lg:table-cell font-semibold">{t('suppliers.paymentTerms')}</TableHead><TableHead className="px-6 py-3 font-semibold">Rating</TableHead><TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead></TableRow></TableHeader><TableBody className="divide-y divide-app-border">
                {filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-app-hover/60 transition-colors group">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                          <Buildings size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-app-text">{s.name}</p>
                          <p className="text-[10px] text-app-muted">{s.email || 'supplier@domain.com'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <p className="font-medium text-app-text">{s.contactPerson}</p>
                      <p className="text-[10px] text-app-muted font-mono">{s.phone}</p>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted hidden md:table-cell">{s.categories}</TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted hidden lg:table-cell">{s.address || 'Net 30 Days'}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                        <Star size={13} weight="fill" />
                        {s.rating || 4.8}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenView(s)} className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover" title={t('common.view')}>
                          <Eye size={15} />
                        </Button>
                        {can('suppliers', 'update') && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)} className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover" title={t('common.edit')}>
                            <PencilSimple size={15} />
                          </Button>
                        )}
                        {can('suppliers', 'delete') && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(s)} className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" title={t('common.delete')}>
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

      {/* Add Supplier Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) setIsAddOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('suppliers.createSupplier')}</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('suppliers.companyName')} *</Label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bosch Auto Parts Cambodia"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.contactPerson')}</Label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Manager / Rep Name"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.phone')} *</Label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="023 888 999"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.email')}</Label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@supplier.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.categories')}</Label>
              <input
                type="text"
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="Brakes, Filters, Engine"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)} className="h-9 rounded-xl">
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={createSupplierMutation.isPending}>
              {t('suppliers.createSupplier')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* Edit Supplier Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) setIsEditOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('suppliers.editSupplier')}: {selectedSupplier?.name}</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('suppliers.companyName')} *</Label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.contactPerson')}</Label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('suppliers.phone')} *</Label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)} className="h-9 rounded-xl">
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={updateSupplierMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* View Supplier Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('suppliers.title')}</DialogTitle></DialogHeader>
        {selectedSupplier && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Buildings size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedSupplier.name}</h3>
                <p className="text-app-muted">{selectedSupplier.categories}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.contactPerson')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.contactPerson}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.email')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.email || '—'}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('suppliers.address')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedSupplier.address || 'Phnom Penh'}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent></Dialog>

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
