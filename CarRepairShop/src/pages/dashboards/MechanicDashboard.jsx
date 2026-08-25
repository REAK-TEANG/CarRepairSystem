import { useState } from 'react'
import { Wrench, CheckCircle, WarningCircle, Car, Eye, User, Sparkle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs, useUpdateRepairJob } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

export default function MechanicDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: mechanics = [] } = useMechanics()
  const [selectedMechanicId, setSelectedMechanicId] = useState('all')

  const isMechanicUser = user.role === 'mechanic'
  const effectiveMechanicId = isMechanicUser
    ? user.id
    : selectedMechanicId !== 'all'
    ? Number(selectedMechanicId)
    : undefined

  const params = effectiveMechanicId ? { mechanicId: effectiveMechanicId } : {}
  const { data: jobs = [] } = useRepairJobs(params)
  const updateJobMutation = useUpdateRepairJob()

  const [selectedJob, setSelectedJob] = useState(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [statusVal, setStatusVal] = useState('Repairing')
  const [diagNotes, setDiagNotes] = useState('')

  const handleOpenUpdate = (job) => {
    setSelectedJob(job)
    setStatusVal(job.status)
    setDiagNotes(job.diagnosis || '')
    setIsUpdateOpen(true)
  }

  const handleOpenView = (job) => {
    setSelectedJob(job)
    setIsViewOpen(true)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJob) return
    updateJobMutation.mutate({
      id: selectedJob.id,
      data: {
        status: statusVal,
        diagnosis: diagNotes,
      },
    })
    setIsUpdateOpen(false)
  }

  const activeJobs = jobs.filter((j) => j.status === 'Diagnosing' || j.status === 'Repairing')
  const waitingParts = jobs.filter((j) => j.status === 'Waiting for Parts')
  const completedJobs = jobs.filter((j) => j.status === 'Completed' || j.status === 'Ready for Pickup')

  return (
    <div className="space-y-4 sm:space-y-6 font-sans text-app-text animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('titles.mechanicWorkspace')}</h1>
          <p className="text-xs text-app-muted mt-1">
            {t('dashboard.adminWelcome')}, <span className="font-semibold text-app-text">{user.name}</span> (
            {t(`roles.${user.role}`, user.roleTitle)}) · {t('dashboard.mechanicSubtitle')}
          </p>
        </div>

        {/* Admin / Manager Technician Filter */}
        {!isMechanicUser && (
          <div className="flex items-center gap-2 bg-app-card border border-app-border p-1.5 rounded-xl shadow-subtle text-xs self-start sm:self-auto">
            <User size={15} className="text-app-accent ml-1" />
            <span className="text-app-muted font-medium">{t('repairJobs.technician')}:</span>
            <select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className="bg-app-input border border-app-border rounded-lg px-2.5 py-1 text-xs text-app-text focus:outline-none focus:border-app-accent font-medium"
            >
              <option value="all">
                {t('common.all')} ({jobs.length} {t('nav.repairJobs')})
              </option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.specialty})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* BENTO GRID: 3-Tile Work Status Cards for Mobile & Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Bento Metric 1: In Progress */}
        <div className="col-span-1 bg-app-card rounded-2xl p-4 border border-app-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div className="w-8 h-8 bg-app-accent/15 text-app-accent rounded-xl flex items-center justify-center">
              <Wrench size={18} weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-app-text tabular-nums">{activeJobs.length}</h2>
            <p className="text-[10px] sm:text-xs text-app-muted font-semibold uppercase tracking-wider mt-0.5">
              {t('dashboard.activeJobs')}
            </p>
          </div>
        </div>

        {/* Bento Metric 2: Waiting Parts */}
        <div className="col-span-1 bg-app-card rounded-2xl p-4 border border-app-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-8 h-8 bg-amber-500/15 text-amber-500 rounded-xl flex items-center justify-center">
              <WarningCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-app-text tabular-nums">{waitingParts.length}</h2>
            <p className="text-[10px] sm:text-xs text-app-muted font-semibold uppercase tracking-wider truncate mt-0.5">
              {t('status.Waiting for Parts')}
            </p>
          </div>
        </div>

        {/* Bento Metric 3: Ready / Completed (Spans 2 on small mobile, 1 on tablet+) */}
        <div className="col-span-2 sm:col-span-1 bg-app-card rounded-2xl p-4 border border-app-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="w-8 h-8 bg-emerald-500/15 text-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-app-text tabular-nums">{completedJobs.length}</h2>
            <p className="text-[10px] sm:text-xs text-app-muted font-semibold uppercase tracking-wider mt-0.5">
              {t('status.Completed')} / {t('status.Ready for Pickup')}
            </p>
          </div>
        </div>
      </div>

      {/* Active Work Queue Bento Card */}
      <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-5 shadow-card transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-app-text">{t('dashboard.myAssignedJobs')}</h3>
            <p className="text-[11px] text-app-muted">{jobs.length} jobs assigned</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-app-hover text-app-muted">
            {jobs.length} {t('common.total')}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-app-muted">{t('common.noRecords')}</div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-app-hover/40 rounded-2xl border border-app-border gap-3 hover:border-app-border/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0 mt-0.5">
                    <Car size={18} weight="bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-app-accent text-xs">{job.orderNumber}</span>
                      <StatusBadge status={job.status} />
                      <span className="text-[10px] text-app-muted">
                        · {t('repairJobs.technician')}: {job.mechanic}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-app-text mt-1">
                      {job.vehicle} · <span className="font-mono text-app-muted font-normal">{job.plate}</span>
                    </h4>
                    <p className="text-[11px] text-app-muted mt-0.5">
                      {t('customers.customerCode')}: {job.customer} · {t('common.description')}:{' '}
                      <span className="text-app-text">{job.problem}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-app-border/40">
                  <button
                    onClick={() => handleOpenView(job)}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> {t('common.view')}
                  </button>
                  <button
                    onClick={() => handleOpenUpdate(job)}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle flex items-center justify-center gap-1.5"
                  >
                    <Sparkle size={14} weight="bold" /> {t('repairJobs.updateStatus')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Job Status Modal */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title={`${t('repairJobs.updateStatus')}: ${selectedJob?.orderNumber}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-app-muted font-medium mb-1">{t('common.status')}</label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
            >
              <option value="Diagnosing">{t('status.Diagnosing')}</option>
              <option value="Repairing">{t('status.Repairing')}</option>
              <option value="Waiting for Parts">{t('status.Waiting for Parts')}</option>
              <option value="Ready for Pickup">{t('status.Ready for Pickup')}</option>
              <option value="Completed">{t('status.Completed')}</option>
            </select>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('repairJobs.diagnosticsNotes')}</label>
            <textarea
              rows={3}
              value={diagNotes}
              onChange={(e) => setDiagNotes(e.target.value)}
              placeholder="Record diagnostic findings, torque specs, or required part codes..."
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsUpdateOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
            >
              {t('common.saveChanges')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Job Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('titles.repairJobsOrders')}>
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-bold">{selectedJob.orderNumber}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedJob.vehicle}</h3>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.customer')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('vehicles.plateNumber')}</p>
                <p className="font-mono text-app-text mt-0.5">{selectedJob.plate}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('repairJobs.technician')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.mechanic}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('repairJobs.totalCost')}</p>
                <p className="font-bold text-app-accent mt-0.5">{selectedJob.estimatedCost}</p>
              </div>
            </div>

            <div className="p-3 bg-app-input rounded-xl border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.description')}</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
