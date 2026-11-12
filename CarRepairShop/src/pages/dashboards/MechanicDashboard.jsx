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
    ? (user?.employeeId || user?.id)
    : selectedMechanicId !== 'all'
    ? Number(selectedMechanicId)
    : undefined

  const params = effectiveMechanicId ? { mechanicId: effectiveMechanicId, all: true } : { all: true }
  const { data: rawJobs = [] } = useRepairJobs(params)
  const jobs = Array.isArray(rawJobs) ? rawJobs : (rawJobs?.data || [])

  const activeJobs = jobs.filter((j) => j.status === 'Pending' || j.status === 'Diagnosing' || j.status === 'Repairing')
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
          <div className="grid grid-cols-2 bg-app-card border border-app-border rounded-xl p-1 shadow-2xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('bay')}
              title="Bay Mode"
              className={`flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation active-press ${
                viewMode === 'bay'
                  ? 'bg-app-accent text-app-accentText shadow-xs'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover/50'
              }`}
            >
              <DeviceTablet size={16} weight="bold" />
              <span>Bay</span>
              <span className="hidden sm:inline">&nbsp;Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              title="Pipeline Flow"
              className={`flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation active-press ${
                viewMode === 'pipeline'
                  ? 'bg-app-accent text-app-accentText shadow-xs'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover/50'
              }`}
            >
              <Kanban size={16} weight="bold" />
              <span>Pipeline</span>
              <span className="hidden sm:inline">&nbsp;Flow</span>
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
      <StaggerGroup staggerDelay={75} duration={600} className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Bento Metric 1: In Progress */}
        <div className="col-span-1 bg-app-card rounded-xl p-4 border border-app-border border-l-4 border-l-blue-500 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-app-muted tracking-tight">
              {t('dashboard.activeJobs')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wrench size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-app-text tabular-nums tracking-tight">{activeJobs.length}</h2>
            <p className="text-[11px] text-app-muted mt-0.5">Currently on shop floor</p>
          </div>
        </div>

        {/* Bento Metric 2: Waiting Parts */}
        <div className="col-span-1 bg-app-card rounded-xl p-4 border border-app-border border-l-4 border-l-amber-500 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-app-muted tracking-tight truncate">
              {t('status.Waiting for Parts')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <WarningCircle size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-app-text tabular-nums tracking-tight">{waitingParts.length}</h2>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Pending parts delivery</p>
          </div>
        </div>

        {/* Bento Metric 3: Ready / Completed */}
        <div className="col-span-2 sm:col-span-1 bg-app-card rounded-xl p-4 border border-app-border border-l-4 border-l-emerald-500 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-app-muted tracking-tight">
              {t('status.Completed')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-app-text tabular-nums tracking-tight">{completedJobs.length}</h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Ready for customer</p>
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
