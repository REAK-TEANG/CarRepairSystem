import { useState } from 'react'
import { Wrench, CheckCircle, WarningCircle, DeviceTablet, Kanban } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useInventory } from '../../hooks/useInventory'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import RepairPipelineTracker from '../../components/workshop/RepairPipelineTracker'
import BayModeView from '../../components/workshop/BayModeView'
import JobCardDrawer from '../../components/workshop/JobCardDrawer'
import { StaggerGroup } from '../../components/animation/AnimeWrapper'
import { SearchableSelect } from '../../components/ui'

export default function MechanicDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: mechanics = [] } = useMechanics({ all: true })
  const { data: inventory = [] } = useInventory({ all: true })
  const { data: services = [] } = useServicesCatalog({ all: true })
  const [selectedMechanicId, setSelectedMechanicId] = useState('all')
  const [viewMode, setViewMode] = useState('bay') // 'bay' | 'pipeline'

  // Job Card Drawer state
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false)
  const [activeJobForDrawer, setActiveJobForDrawer] = useState(null)

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

  const handleOpenJobDrawer = (job) => {
    setActiveJobForDrawer(job)
    setIsJobDrawerOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-sans text-app-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight">{t('titles.mechanicWorkspace')}</h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 bg-app-card border border-app-border rounded-lg p-0.5 shadow-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('bay')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer touch-manipulation active:scale-[0.98] ${
                viewMode === 'bay'
                  ? 'bg-app-accent text-app-accentText shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              <DeviceTablet size={15} weight="bold" />
              <span>Bay Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer touch-manipulation active:scale-[0.98] ${
                viewMode === 'pipeline'
                  ? 'bg-app-accent text-app-accentText shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              <Kanban size={15} weight="bold" />
              <span>Pipeline Flow</span>
            </button>
          </div>

          {/* Admin / Manager Technician Filter */}
          {!isMechanicUser && (
            <div className="w-full sm:w-56">
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

      {/* Active Work Queue & Mode Display */}
      {viewMode === 'bay' ? (
        <BayModeView jobs={jobs} inventory={inventory} onOpenJobDrawer={handleOpenJobDrawer} />
      ) : (
        <RepairPipelineTracker mechanicFilter={effectiveMechanicId} />
      )}

      {/* Full Job Card Drawer */}
      <JobCardDrawer
        key={activeJobForDrawer?.id || 'none-job'}
        isOpen={isJobDrawerOpen}
        onClose={() => {
          setIsJobDrawerOpen(false)
          setActiveJobForDrawer(null)
        }}
        job={activeJobForDrawer}
        mechanics={mechanics}
        services={services}
        inventory={inventory}
      />
    </div>
  )
}
