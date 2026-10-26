import { useState, useMemo } from 'react'
import {
  Wrench,
  Package,
  CheckCircle,
  Clock,
  Car,
  Sparkle,
  Plus,
  Trash,
  Sliders,
  Check,
  ShieldCheck,
} from '@phosphor-icons/react'
import { StatusBadge, Button } from '@/components/ui'
import { useUpdateRepairJob } from '@/hooks/useRepairJobs'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

const COMMON_SUPPLIES = [
  { name: '5W-30 Synthetic Oil (4L)', price: 38.0, code: 'OIL-5W30' },
  { name: 'OEM Oil Filter', price: 14.0, code: 'FLT-OEM' },
  { name: 'Brake Cleaner Spray', price: 7.5, code: 'BRK-CLN' },
  { name: 'Wiper Blades Pair', price: 24.0, code: 'WIP-SET' },
  { name: 'DOT 4 Brake Fluid (500ml)', price: 12.0, code: 'FLUID-DOT4' },
  { name: 'Coolant Premix (1L)', price: 9.5, code: 'COOL-1L' },
  { name: 'Air Filter Element', price: 18.0, code: 'AIR-FLT' },
  { name: 'Shop Consumables & Cleaners', price: 6.0, code: 'SHOP-SUP' },
]

const QA_ITEMS = [
  { id: 'dtc', label: 'DTC Fault Codes Cleared & Scanned' },
  { id: 'torque', label: 'Lug Nuts & Critical Bolts Torqued' },
  { id: 'fluids', label: 'Oil & Fluid Levels Inspected' },
  { id: 'road_test', label: 'Road Test & Safety Operation Verified' },
]

export default function BayModeView({
  jobs = [],
  onOpenJobDrawer,
}) {
  const { addToast } = useToast()
  const updateJobMutation = useUpdateRepairJob()

  // Filter for active shop floor jobs
  const bayJobs = useMemo(() => {
    return jobs.filter((j) => j.status !== 'Cancelled')
  }, [jobs])

  const [selectedJobId, setSelectedJobId] = useState(() => bayJobs[0]?.id || null)

  // Ensure active job is always valid
  const activeJob = useMemo(() => {
    if (!bayJobs.length) return null
    return bayJobs.find((j) => j.id === selectedJobId) || bayJobs[0]
  }, [bayJobs, selectedJobId])

  // Extract or parse parts for the active job
  const activeParts = useMemo(() => {
    if (!activeJob) return []
    if (Array.isArray(activeJob.partsUsed)) return activeJob.partsUsed
    if (typeof activeJob.partsUsed === 'string' && activeJob.partsUsed.trim()) {
      try {
        return JSON.parse(activeJob.partsUsed)
      } catch {
        return []
      }
    }
    return []
  }, [activeJob])

  // Local QA checklist state keyed by job id
  const [qaChecks, setQaChecks] = useState({})

  const activeJobQa = qaChecks[activeJob?.id] || {
    dtc: activeJob?.status === 'Ready for Pickup' || activeJob?.status === 'Completed',
    torque: activeJob?.status === 'Ready for Pickup' || activeJob?.status === 'Completed',
    fluids: activeJob?.status === 'Ready for Pickup' || activeJob?.status === 'Completed',
    road_test: activeJob?.status === 'Ready for Pickup' || activeJob?.status === 'Completed',
  }

  const toggleQaItem = (qaId) => {
    if (!activeJob) return
    setQaChecks((prev) => ({
      ...prev,
      [activeJob.id]: {
        ...activeJobQa,
        [qaId]: !activeJobQa[qaId],
      },
    }))
  }

  const passedQaCount = Object.values(activeJobQa).filter(Boolean).length

  // Quick 1-tap Status Change
  const handleUpdateStatus = async (newStatus) => {
    if (!activeJob) return
    try {
      await updateJobMutation.mutateAsync({
        id: activeJob.id,
        data: { status: newStatus },
      })
      addToast(`Status updated to "${newStatus}"`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to update status', 'warning')
    }
  }

  // Quick 1-tap Part Logger
  const handleQuickAddSupply = async (supply) => {
    if (!activeJob) return
    const newPart = {
      id: `${activeJob.id}-${supply.code}-${activeParts.length + 1}`,
      name: supply.name,
      partNumber: supply.code,
      quantity: 1,
      price: supply.price,
    }
    const updatedParts = [...activeParts, newPart]

    try {
      await updateJobMutation.mutateAsync({
        id: activeJob.id,
        data: {
          usedParts: updatedParts,
        },
      })
      addToast(`Logged +1 ${supply.name}`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to add supply', 'warning')
    }
  }

  // Quick 1-tap Remove Part
  const handleRemovePart = async (partIndex) => {
    if (!activeJob) return
    const updatedParts = activeParts.filter((_, idx) => idx !== partIndex)

    try {
      await updateJobMutation.mutateAsync({
        id: activeJob.id,
        data: {
          usedParts: updatedParts,
        },
      })
      addToast('Item removed', 'info')
    } catch (err) {
      addToast(err?.message || 'Failed to remove part', 'warning')
    }
  }

  if (bayJobs.length === 0) {
    return (
      <div className="bg-app-card rounded-xl border border-app-border p-12 text-center shadow-card">
        <Car size={48} className="mx-auto text-app-muted mb-3 opacity-60" />
        <h3 className="text-base font-bold text-app-text">All Service Bays Clear</h3>
        <p className="text-xs text-app-muted mt-1 max-w-sm mx-auto">
          There are currently no active repair jobs assigned to the shop floor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* BAY SELECTOR: Large Touch Tabs */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-app-muted mb-2 flex items-center gap-1.5">
          <Car size={13} weight="bold" />
          Active Bay Vehicles ({bayJobs.length})
        </p>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {bayJobs.map((job) => {
            const isSelected = activeJob?.id === job.id
            const plate = job.plate || job.licensePlate || 'NO-PLATE'
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border text-left min-w-[220px] transition-all cursor-pointer select-none active:scale-[0.98]',
                  isSelected
                    ? 'bg-app-card border-app-accent shadow-md ring-2 ring-app-accent/20'
                    : 'bg-app-card/60 border-app-border hover:bg-app-hover hover:border-app-border'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 border',
                    isSelected
                      ? 'bg-app-accent text-app-accentText border-app-accent'
                      : 'bg-app-input text-app-text border-app-border'
                  )}
                >
                  {plate.slice(-3).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-app-text truncate">
                    {job.vehicle || `${job.brand || ''} ${job.model || ''}`.trim() || 'Vehicle'}
                  </p>
                  <p className="font-mono text-[11px] text-app-muted truncate">{plate}</p>
                  <div className="mt-1">
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ACTIVE BAY WORKBENCH */}
      {activeJob && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Hero Workspace */}
          <div className="lg:col-span-8 space-y-4">
            {/* Vehicle Hero Card */}
            <div className="bg-app-card rounded-xl border border-app-border p-4 sm:p-5 shadow-card relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="bg-amber-400 text-slate-950 font-mono font-black text-sm tracking-wider px-3 py-1.5 rounded border-2 border-slate-900 shadow-sm shrink-0">
                    {activeJob.plate || activeJob.licensePlate || 'NO PLATE'}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-app-text leading-tight">
                      {activeJob.vehicle || `${activeJob.brand || ''} ${activeJob.model || ''}`.trim() || 'Vehicle'}
                    </h2>
                    <p className="text-xs text-app-muted mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-semibold text-app-accent">{activeJob.orderNumber}</span>
                      <span>•</span>
                      <span>{activeJob.customer || 'Walk-in Customer'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenJobDrawer && onOpenJobDrawer(activeJob)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Sliders size={14} weight="bold" />
                    Open Full Job Card
                  </Button>
                </div>
              </div>

              {/* Service & Problem High-contrast Banner */}
              <div className="mt-4 p-3.5 rounded-lg bg-app-input/80 border border-app-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1">
                  Reported Issue / Work Order Description
                </p>
                <p className="text-xs sm:text-sm font-semibold text-app-text">
                  {activeJob.problemDescription || activeJob.problem || activeJob.service || 'Scheduled Maintenance & Inspection'}
                </p>
              </div>

              {/* 1-Tap Touch Status Progression Bar */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-app-muted mb-2">
                  1-Tap Job Phase Status
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Diagnosing')}
                    disabled={updateJobMutation.isPending}
                    className={cn(
                      'h-13 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 select-none',
                      activeJob.status === 'Diagnosing'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                        : 'bg-app-input hover:bg-app-hover text-app-muted hover:text-app-text border-app-border'
                    )}
                  >
                    <Clock size={16} weight="bold" />
                    <span>Diagnosing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Repairing')}
                    disabled={updateJobMutation.isPending}
                    className={cn(
                      'h-13 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 select-none',
                      activeJob.status === 'Repairing'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-app-input hover:bg-app-hover text-app-muted hover:text-app-text border-app-border'
                    )}
                  >
                    <Wrench size={16} weight="bold" />
                    <span>Repairing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Waiting for Parts')}
                    disabled={updateJobMutation.isPending}
                    className={cn(
                      'h-13 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 select-none',
                      activeJob.status === 'Waiting for Parts'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-app-input hover:bg-app-hover text-app-muted hover:text-app-text border-app-border'
                    )}
                  >
                    <Package size={16} weight="bold" />
                    <span>Waiting Parts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Ready for Pickup')}
                    disabled={updateJobMutation.isPending}
                    className={cn(
                      'h-13 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 select-none',
                      activeJob.status === 'Ready for Pickup' || activeJob.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-app-input hover:bg-app-hover text-app-muted hover:text-app-text border-app-border'
                    )}
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>Ready for Pickup</span>
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK SUPPLIES LOGGER */}
            <div className="bg-app-card rounded-xl border border-app-border p-4 sm:p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={16} weight="bold" className="text-app-accent" />
                  <h3 className="text-xs sm:text-sm font-bold text-app-text">Quick Shop Supplies Logger</h3>
                </div>
                <span className="text-[11px] font-semibold text-app-muted">
                  {activeParts.length} logged
                </span>
              </div>

              {/* 1-Tap Supply Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {COMMON_SUPPLIES.map((supply) => (
                  <button
                    key={supply.name}
                    type="button"
                    onClick={() => handleQuickAddSupply(supply)}
                    disabled={updateJobMutation.isPending}
                    className="p-2.5 rounded-lg border border-app-border bg-app-input hover:bg-app-hover hover:border-app-accent/50 text-left transition-all cursor-pointer select-none active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between text-app-muted group-hover:text-app-accent">
                      <span className="text-[10px] font-mono font-bold">${supply.price.toFixed(2)}</span>
                      <Plus size={12} weight="bold" />
                    </div>
                    <p className="text-xs font-semibold text-app-text mt-1 leading-snug line-clamp-2">
                      {supply.name}
                    </p>
                  </button>
                ))}
              </div>

              {/* Active Logged Parts Table */}
              {activeParts.length > 0 && (
                <div className="border border-app-border rounded-lg overflow-hidden">
                  <div className="bg-app-input px-3 py-2 border-b border-app-border flex items-center justify-between text-[11px] font-bold text-app-muted uppercase">
                    <span>Logged Item</span>
                    <span className="pr-6">Action</span>
                  </div>
                  <div className="divide-y divide-app-border max-h-48 overflow-y-auto">
                    {activeParts.map((part, idx) => (
                      <div key={part.id || idx} className="px-3 py-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-app-text">{part.name}</p>
                          <p className="text-[10px] font-mono text-app-muted">
                            Qty: {part.quantity || 1} • ${Number(part.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: QA Checklist & Technician Verification */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-app-card rounded-xl border border-app-border p-4 sm:p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} weight="bold" className="text-emerald-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-app-text">Shop Floor QA Checks</h3>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full',
                    passedQaCount === QA_ITEMS.length
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  )}
                >
                  {passedQaCount}/{QA_ITEMS.length} Passed
                </span>
              </div>

              {/* QA Progress Bar */}
              <div className="w-full bg-app-input rounded-full h-1.5 overflow-hidden mb-4">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(passedQaCount / QA_ITEMS.length) * 100}%` }}
                />
              </div>

              {/* 1-Tap QA Touch Toggles */}
              <div className="space-y-2">
                {QA_ITEMS.map((item) => {
                  const isChecked = !!activeJobQa[item.id]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQaItem(item.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98]',
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-app-input border-app-border text-app-muted hover:text-app-text hover:bg-app-hover'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors',
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                            : 'bg-app-card border-app-border text-transparent'
                        )}
                      >
                        <Check size={14} weight="bold" />
                      </div>
                      <span className={cn('text-xs font-semibold leading-tight', isChecked && 'text-app-text font-bold')}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Quick QA Complete Action */}
              <div className="mt-4 pt-3 border-t border-app-border">
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  disabled={passedQaCount < QA_ITEMS.length || activeJob.status === 'Ready for Pickup'}
                  onClick={() => handleUpdateStatus('Ready for Pickup')}
                  className="w-full justify-center text-xs font-bold gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Sparkle size={15} weight="bold" />
                  Sign-Off QA & Mark Ready for Pickup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
