import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, Clock, User, Car, Trash } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs, useCreateRepairJob, useUpdateRepairJob, useDeleteRepairJob } from '../../hooks/useRepairJobs'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, ConfirmDialog, TableSkeleton, LoadingButton } from '../../components/ui'

const statusFilters = ['All', 'Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed']

export default function RepairJobsPage() {
  const { t } = useTranslation()
  const { can, user } = useAuth()
  const params = user.role === 'mechanic' ? { mechanicId: user.id } : {}
  const { data: jobs = [], isLoading } = useRepairJobs(params)
  const { data: customers = [] } = useCustomers()
  const { data: vehicles = [] } = useVehicles()
  const { data: mechanics = [] } = useMechanics()

  const createJobMutation = useCreateRepairJob()
  const updateJobMutation = useUpdateRepairJob()
  const deleteJobMutation = useDeleteRepairJob()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    vehicle: '',
    vehicleId: '',
    plate: '',
    mechanic: '',
    mechanicId: '',
    problem: '',
    diagnosis: '',
    estimatedCost: '$250',
    actualCost: '',
    status: 'Pending',
  })

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultVeh = vehicles[0]
    const defaultMec = mechanics[0]

    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      vehicle: defaultVeh ? `${defaultVeh.brand} ${defaultVeh.model}` : '',
      vehicleId: defaultVeh ? defaultVeh.id : '',
      plate: defaultVeh ? defaultVeh.number : '',
      mechanic: defaultMec ? defaultMec.name : '',
      mechanicId: defaultMec ? defaultMec.id : '',
      problem: '',
      diagnosis: '',
      estimatedCost: '$250',
      actualCost: '',
      status: 'Pending',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (job) => {
    setSelectedJob(job)
    setFormData({ ...job })
    setIsEditOpen(true)
  }

  const handleOpenView = (job) => {
    setSelectedJob(job)
    setIsViewOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.problem) return
    createJobMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedJob) return
    updateJobMutation.mutate({ id: selectedJob.id, data: formData })
    setIsEditOpen(false)
  }

  const handleOpenDelete = (job) => {
    setSelectedJob(job)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedJob) return
    deleteJobMutation.mutate(selectedJob.id)
    setIsDeleteOpen(false)
  }

  const filtered = jobs.filter((j) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (j?.orderNumber || '').toLowerCase().includes(q) ||
      (j?.customer || '').toLowerCase().includes(q) ||
      (j?.vehicle || '').toLowerCase().includes(q) ||
      (j?.plate || '').toLowerCase().includes(q) ||
      (j?.problem || '').toLowerCase().includes(q) ||
      (j?.mechanic || '').toLowerCase().includes(q)

    const matchesStatus = activeFilter === 'All' || j.status === activeFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 font-sans text-app-text animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.repairJobsOrders')}</h1>
          <p className="text-xs text-app-muted mt-1">{t('repairJobs.subtitle')}</p>
        </div>
        {can('repair_jobs', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('repairJobs.newJob')}
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((filter) => {
          const count = filter === 'All' ? jobs.length : jobs.filter((j) => j.status === filter).length
          const isActive = activeFilter === filter
          const translatedFilter = filter === 'All' ? t('common.all') : t(`status.${filter}`, filter)
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-app-accent text-app-accentText shadow-subtle'
                  : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
              }`}
            >
              {translatedFilter}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Jobs Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder={t('common.quickSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>
          {(searchQuery || activeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('All')
              }}
              className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
            >
              {t('common.filter')} ({t('common.cancel')})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && jobs.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
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
            <table className="w-full text-xs">
              <thead>
                <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                  <th className="px-6 py-3 font-semibold">{t('repairJobs.orderNumber')}</th>
                  <th className="px-6 py-3 font-semibold">{t('appointments.customer')} & {t('appointments.vehicle')}</th>
                  <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('common.description')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('repairJobs.technician')}</th>
                  <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('repairJobs.totalCost')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-app-hover/60 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-mono font-semibold text-app-accent">{job.orderNumber}</p>
                      <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {job.createdAt}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-app-text">{job.customer}</p>
                      <p className="text-[10px] text-app-muted">
                        {job.vehicle} · {job.plate}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell max-w-[200px] truncate">
                      {job.problem}
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-app-muted">
                        <User size={13} className="text-app-accent" />
                        {job.mechanic}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-app-text tabular-nums hidden md:table-cell">
                      {job.estimatedCost}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenView(job)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                          title={t('common.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {can('repair_jobs', 'update') && (
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                            title={t('repairJobs.updateProgress')}
                          >
                            <PencilSimple size={15} />
                          </button>
                        )}
                        {can('repair_jobs', 'delete') && (
                          <button
                            onClick={() => handleOpenDelete(job)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title={t('common.delete')}
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

      {/* Create Repair Order Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('repairJobs.createWorkOrder')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.customer')} *</label>
              <select
                value={formData.customer}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, customer: e.target.value, customerId: c ? c.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</label>
              <select
                value={formData.plate}
                onChange={(e) => {
                  const v = vehicles.find((x) => x.number === e.target.value)
                  setFormData({
                    ...formData,
                    plate: e.target.value,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                  })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.number}>
                    {v.number} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')} *</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.totalCost')}</label>
              <input
                type="text"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="$450"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.description')} *</label>
            <textarea
              rows={2}
              required
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="e.g. Engine shaking while idle, check engine light on"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={2}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Cylinder 3 misfire code P0303 detected"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createJobMutation.isPending}>
              {t('repairJobs.createWorkOrder')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit / Update Status Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('repairJobs.updateProgress')}: ${selectedJob?.orderNumber}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                <option value="Pending">{t('status.Pending')}</option>
                <option value="Diagnosing">{t('status.Diagnosing')}</option>
                <option value="Repairing">{t('status.Repairing')}</option>
                <option value="Waiting for Parts">{t('status.Waiting for Parts')}</option>
                <option value="Ready for Pickup">{t('status.Ready for Pickup')}</option>
                <option value="Completed">{t('status.Completed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticReport')}</label>
            <textarea
              rows={3}
              value={formData.diagnosis || ''}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateJobMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Job Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('common.details')}>
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedJob.orderNumber}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedJob.vehicle}</h3>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> {t('appointments.customer')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Car size={12} /> {t('appointments.vehicle')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedJob.plate}</p>
              </div>
            </div>

            <div className="p-3 bg-app-input rounded-xl border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.description')}</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>

            {selectedJob.diagnosis && (
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('repairJobs.diagnosticReport')}</p>
                <p className="text-app-text mt-1">{selectedJob.diagnosis}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('repairJobs.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
