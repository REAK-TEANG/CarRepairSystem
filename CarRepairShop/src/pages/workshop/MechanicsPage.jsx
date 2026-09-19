import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Wrench, Car, UsersThree } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useMechanics, useCreateMechanic, useUpdateMechanic, useDeleteMechanic } from '@/hooks/useMechanics'
import { useAuth } from '@/context/AuthContext'
import { ConfirmDialog, EmptyState, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import RepairPipelineTracker from '@/components/workshop/RepairPipelineTracker'

const statusFilters = ['All', 'Active', 'On Leave', 'Terminated']

export default function MechanicsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data: mechanics = [], isLoading } = useMechanics()
  const createMechanicMutation = useCreateMechanic()
  const updateMechanicMutation = useUpdateMechanic()
  const deleteMechanicMutation = useDeleteMechanic()

  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' | 'roster'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    specialization: 'Engine & Transmission',
    experienceYears: 3,
    hourlyRate: 40,
    status: 'Active',
  })

  const handleOpenAdd = () => {
    setFormData({
      code: `MEC-${String(mechanics.length + 1).padStart(3, '0')}`,
      name: '',
      phone: '',
      email: '',
      specialization: 'Engine & Transmission',
      experienceYears: 3,
      hourlyRate: 40,
      status: 'Active',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (m) => {
    setSelectedMechanic(m)
    setFormData({ ...m })
    setIsEditOpen(true)
  }

  const handleOpenView = (m) => {
    setSelectedMechanic(m)
    setIsViewOpen(true)
  }

  const handleOpenDelete = (m) => {
    setSelectedMechanic(m)
    setIsDeleteOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name) return
    createMechanicMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedMechanic) return
    updateMechanicMutation.mutate({ id: selectedMechanic.id, data: formData })
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedMechanic) return
    deleteMechanicMutation.mutate(selectedMechanic.id)
    setIsDeleteOpen(false)
  }

  const query = searchQuery.trim().toLowerCase()
  const mechanicList = Array.isArray(mechanics) ? mechanics : []
  const filtered = mechanicList.filter((m) => {
    const matchesSearch =
      !query ||
      (m?.name || '').toLowerCase().includes(query) ||
      (m?.code || '').toLowerCase().includes(query) ||
      (m?.specialization || '').toLowerCase().includes(query) ||
      (m?.phone || '').toLowerCase().includes(query) ||
      (m?.email || '').toLowerCase().includes(query)

    const matchesFilter = activeFilter === 'All' || m.status === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('titles.mechanicsStaffRoster')}</h1>
          <Badge variant="outline" className="text-xs font-mono">{mechanics.length}</Badge>
        </div>
        {can('mechanics', 'create') && activeTab === 'roster' && (
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={16} weight="bold" />
            {t('mechanics.addMechanic')}
          </Button>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-app-border pb-3">
        <Button variant="ghost" onClick={() => setActiveTab('pipeline')} className={`h-9 px-3.5 rounded-xl font-semibold ${
            activeTab === 'pipeline'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}>
          <Car size={16} weight="bold" />
          <span>Vehicle Repair Pipeline Tracker</span>
        </Button>

        <Button variant="ghost" onClick={() => setActiveTab('roster')} className={`h-9 px-3.5 rounded-xl font-semibold ${
            activeTab === 'roster'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}>
          <UsersThree size={16} weight="bold" />
          <span>Mechanics Staff Roster</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{mechanics.length}</span>
        </Button>
      </div>

      {activeTab === 'pipeline' ? (
        <RepairPipelineTracker />
      ) : (
        <>
          {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((st) => {
          const count = st === 'All' ? mechanics.length : mechanics.filter((m) => m.status === st).length
          const isActive = activeFilter === st
          const translatedSt = st === 'All' ? t('common.all') : t(`status.${st}`, st)
          return (
            <Button variant="ghost" key={st} onClick={() => setActiveFilter(st)} className={`h-8 px-3 rounded-xl whitespace-nowrap ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}>
              {translatedSt}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                }`}
              >
                {count}
              </span>
            </Button>
          )
        })}
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
          {(searchQuery || activeFilter !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('All')
              }}
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && mechanics.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('common.noRecords')}
              description={t('common.noData')}
              actionText={searchQuery || activeFilter !== 'All' ? t('common.filter') : undefined}
              onAction={
                searchQuery || activeFilter !== 'All'
                  ? () => {
                      setSearchQuery('')
                      setActiveFilter('All')
                    }
                  : undefined
              }
            />
          ) : (
            <Table className="w-full text-xs"><TableHeader><TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-app-hover/50"><TableHead className="px-6 py-3 font-semibold">{t('mechanics.name')}</TableHead><TableHead className="px-6 py-3 font-semibold">{t('mechanics.specialization')}</TableHead><TableHead className="px-6 py-3 hidden md:table-cell font-semibold">{t('mechanics.experience')}</TableHead><TableHead className="px-6 py-3 hidden lg:table-cell font-semibold">{t('mechanics.hourlyRate')}</TableHead><TableHead className="px-6 py-3 font-semibold">{t('mechanics.status')}</TableHead><TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead></TableRow></TableHeader><TableBody className="divide-y divide-app-border">
                {filtered.map((m) => (
                  <TableRow key={m.id} className="hover:bg-app-hover/60 transition-colors group">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent font-bold text-xs flex-shrink-0">
                          <Wrench size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-app-text">{m.name}</p>
                          <p className="text-[10px] text-app-muted font-mono">{m.code} · {m.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-app-text font-medium">{m.specialization}</TableCell>
                    <TableCell className="px-6 py-3.5 text-app-muted tabular-nums hidden md:table-cell">
                      {m.experienceYears} {t('mechanics.experience')}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 font-bold text-app-accent tabular-nums hidden lg:table-cell">
                      ${m.hourlyRate}/hr
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          m.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : m.status === 'On Leave'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {t(`status.${m.status}`, m.status)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenView(m)} className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover" title={t('common.view')}>
                          <Eye size={15} />
                        </Button>
                        {can('mechanics', 'update') && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)} className="h-8 w-8 text-app-muted hover:text-app-text hover:bg-app-hover" title={t('common.edit')}>
                            <PencilSimple size={15} />
                          </Button>
                        )}
                        {can('mechanics', 'delete') && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(m)} className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" title={t('common.delete')}>
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
      </>
      )}

      {/* Add Mechanic Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) setIsAddOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('mechanics.createMechanic')}</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('mechanics.name')} *</Label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mike Johnson"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.phone')} *</Label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 999 888"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.email')}</Label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mechanic@workshop.com"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.specialization')}</Label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="Engine Diagnostics"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.experience')} (Years)</Label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</Label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)} className="h-9 rounded-xl">
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={createMechanicMutation.isPending}>
              {t('mechanics.createMechanic')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* Edit Mechanic Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) setIsEditOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('mechanics.editMechanic')}: {selectedMechanic?.name}</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <Label className="block text-app-muted font-medium mb-1">{t('mechanics.name')} *</Label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.specialization')}</Label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.hourlyRate')} ($)</Label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('mechanics.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('mechanics.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('status.Active')}</SelectItem>
                  <SelectItem value="On Leave">{t('status.On Leave')}</SelectItem>
                  <SelectItem value="Terminated">{t('status.Terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)} className="h-9 rounded-xl">
              {t('common.cancel')}
            </Button>
            <LoadingButton type="submit" loading={updateMechanicMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* View Mechanic Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('mechanics.title')}</DialogTitle></DialogHeader>
        {selectedMechanic && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0">
                <Wrench size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{selectedMechanic.name}</h3>
                <p className="text-app-muted">{selectedMechanic.specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.phone')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedMechanic.phone}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('mechanics.hourlyRate')}</p>
                <p className="font-bold text-app-accent mt-0.5">${selectedMechanic.hourlyRate}/hr</p>
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
        message={t('mechanics.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
