import { useState } from 'react'
import { Wrench, CheckCircle, WarningCircle, User } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import RepairPipelineTracker from '../../components/workshop/RepairPipelineTracker'

export default function MechanicDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: mechanics = [] } = useMechanics()
  const [selectedMechanicId, setSelectedMechanicId] = useState('all')

  const isMechanicUser = user?.role === 'mechanic'
  const effectiveMechanicId = isMechanicUser
    ? user?.id
    : selectedMechanicId !== 'all'
    ? Number(selectedMechanicId)
    : undefined

  const params = effectiveMechanicId ? { mechanicId: effectiveMechanicId } : {}
  const { data: jobs = [] } = useRepairJobs(params)

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
            {t('dashboard.adminWelcome')}, <span className="font-semibold text-app-text">{user?.name || ''}</span> (
            {user ? t(`roles.${user.role}`, user.roleTitle) : ''}) · {t('dashboard.mechanicSubtitle')}
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

      {/* Active Work Queue & Repair Pipeline */}
      <RepairPipelineTracker mechanicFilter={effectiveMechanicId} />
    </div>
  )
}
