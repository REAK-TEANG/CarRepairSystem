import { useState } from 'react'
import { Wrench, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useAuth } from '../../context/AuthContext'
import RepairPipelineTracker from '../../components/workshop/RepairPipelineTracker'
import { StaggerGroup } from '../../components/animation/AnimeWrapper'
import { SearchableSelect } from '../../components/ui'

export default function MechanicDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: mechanics = [] } = useMechanics({ all: true })
  const [selectedMechanicId, setSelectedMechanicId] = useState('all')

  const isMechanicUser = user?.role === 'mechanic'
  const effectiveMechanicId = isMechanicUser
    ? user?.id
    : selectedMechanicId !== 'all'
    ? Number(selectedMechanicId)
    : undefined

  const params = effectiveMechanicId ? { mechanicId: effectiveMechanicId, all: true } : { all: true }
  const { data: rawJobs = [] } = useRepairJobs(params)
  const jobs = Array.isArray(rawJobs) ? rawJobs : (rawJobs?.data || [])

  const activeJobs = jobs.filter((j) => j.status === 'Diagnosing' || j.status === 'Repairing')
  const waitingParts = jobs.filter((j) => j.status === 'Waiting for Parts')
  const completedJobs = jobs.filter((j) => j.status === 'Completed' || j.status === 'Ready for Pickup')

  return (
    <div className="space-y-4 sm:space-y-5 font-sans text-app-text">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight">{t('titles.mechanicWorkspace')}</h1>
          {user?.name && (
            <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md hidden sm:inline">
              {user.name}
            </span>
          )}
        </div>

        {/* Admin / Manager Technician Filter */}
        {!isMechanicUser && (
          <div className="w-64">
            <SearchableSelect
              value={selectedMechanicId}
              onChange={(val) => setSelectedMechanicId(val)}
              options={[
                { value: 'all', label: `${t('common.all')} (${jobs.length})` },
                ...mechanics.map((m) => ({
                  value: String(m.id),
                  label: m.name,
                  sublabel: m.specialization ? `Spec: ${m.specialization}` : undefined,
                })),
              ]}
              placeholder="Filter technician..."
              searchPlaceholder="Search technician..."
            />
          </div>
        )}
      </div>

      {/* BENTO GRID: 3-Tile Work Status Cards */}
      <StaggerGroup staggerDelay={75} duration={600} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Bento Metric 1: In Progress */}
        <div className="col-span-1 bg-app-card rounded-lg p-3.5 border border-app-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-app-muted tracking-tight">
              {t('dashboard.activeJobs')}
            </p>
            <Wrench size={15} weight="bold" className="text-blue-500" />
          </div>
          <div className="mt-1">
            <h2 className="text-2xl font-semibold text-app-text tabular-nums">{activeJobs.length}</h2>
          </div>
        </div>

        {/* Bento Metric 2: Waiting Parts */}
        <div className="col-span-1 bg-app-card rounded-lg p-3.5 border border-app-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-app-muted tracking-tight truncate">
              {t('status.Waiting for Parts')}
            </p>
            <WarningCircle size={15} weight="bold" className="text-amber-500" />
          </div>
          <div className="mt-1">
            <h2 className="text-2xl font-semibold text-app-text tabular-nums">{waitingParts.length}</h2>
          </div>
        </div>

        {/* Bento Metric 3: Ready / Completed */}
        <div className="col-span-2 sm:col-span-1 bg-app-card rounded-lg p-3.5 border border-app-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-app-muted tracking-tight">
              {t('status.Completed')}
            </p>
            <CheckCircle size={15} weight="bold" className="text-emerald-500" />
          </div>
          <div className="mt-1">
            <h2 className="text-2xl font-semibold text-app-text tabular-nums">{completedJobs.length}</h2>
          </div>
        </div>
      </StaggerGroup>

      {/* Active Work Queue & Repair Pipeline */}
      <RepairPipelineTracker mechanicFilter={effectiveMechanicId} />
    </div>
  )
}
