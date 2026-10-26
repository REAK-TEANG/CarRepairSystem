import { useState, useMemo } from 'react'
import {
  Car,
  Wrench,
  ClockCounterClockwise,
  CheckCircle,
  User,
  Phone,
  EnvelopeSimple,
  Gauge,
  Copy,
  Check,
  CalendarBlank,
  Plus,
  PencilSimple,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Drawer, StatusBadge, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function VehicleHistoryDrawer({
  isOpen,
  onClose,
  vehicle,
  owner,
  repairJobs = [],
  onStartRepair,
  onEditVehicle,
}) {
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('All') // 'All' | 'Completed' | 'In Progress' | 'Pending'
  const [copiedVin, setCopiedVin] = useState(false)

  // Find all repair jobs for this vehicle
  const vehicleJobs = useMemo(() => {
    if (!vehicle) return []
    return repairJobs.filter(
      (job) =>
        job.vehicleId === vehicle.id ||
        (job.plate && vehicle.number && job.plate.toUpperCase() === vehicle.number.toUpperCase()) ||
        (job.vehicle &&
          vehicle.brand &&
          job.vehicle.toLowerCase().includes(vehicle.brand.toLowerCase()))
    )
  }, [vehicle, repairJobs])

  const completedCount = useMemo(() => {
    return vehicleJobs.filter((j) => j.status === 'Completed' || j.status === 'Ready for Pickup').length
  }, [vehicleJobs])

  const activeCount = useMemo(() => {
    return vehicleJobs.filter(
      (j) => j.status === 'Diagnosing' || j.status === 'Repairing' || j.status === 'Waiting for Parts'
    ).length
  }, [vehicleJobs])

  const totalLifetimeSpent = useMemo(() => {
    return vehicleJobs.reduce((sum, j) => {
      const val = parseFloat(String(j.actualCost || j.estimatedCost || '0').replace(/[^0-9.]/g, '')) || 0
      return sum + val
    }, 0)
  }, [vehicleJobs])

  // Active Job if currently in shop
  const activeJob = useMemo(() => {
    return vehicleJobs.find(
      (j) => j.status === 'Diagnosing' || j.status === 'Repairing' || j.status === 'Waiting for Parts'
    )
  }, [vehicleJobs])

  // Filtered History
  const filteredHistory = useMemo(() => {
    return vehicleJobs.filter((job) => {
      // Filter tab
      if (historyFilter === 'Completed' && job.status !== 'Completed' && job.status !== 'Ready for Pickup') return false
      if (
        historyFilter === 'In Progress' &&
        job.status !== 'Diagnosing' &&
        job.status !== 'Repairing' &&
        job.status !== 'Waiting for Parts'
      )
        return false
      if (historyFilter === 'Pending' && job.status !== 'Pending') return false

      // Search
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase()
        const matchNumber = job.orderNumber?.toLowerCase().includes(q)
        const matchProblem = job.problem?.toLowerCase().includes(q)
        const matchDiagnosis = job.diagnosis?.toLowerCase().includes(q)
        const matchMechanic = job.mechanic?.toLowerCase().includes(q)
        return matchNumber || matchProblem || matchDiagnosis || matchMechanic
      }
      return true
    })
  }, [vehicleJobs, historyFilter, historySearch])

  const handleCopyVin = (vin) => {
    if (!vin) return
    navigator.clipboard.writeText(vin)
    setCopiedVin(true)
    setTimeout(() => setCopiedVin(false), 2000)
  }

  if (!vehicle) return null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle 360° Passport & History"
      subtitle={`${vehicle.brand} ${vehicle.model} (${vehicle.year || 'N/A'}) • ${vehicle.number}`}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {onEditVehicle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onEditVehicle(vehicle)
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <PencilSimple size={14} weight="bold" />
                Edit Vehicle
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            {onStartRepair && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose()
                  onStartRepair(vehicle)
                }}
                className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus size={14} weight="bold" />
                Start Repair Order
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* VEHICLE PASSPORT HERO */}
        <div className="p-4 bg-app-card rounded-xl border border-app-border flex items-start gap-3.5 shadow-xs">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-16 h-16 rounded-lg object-cover ring-1 ring-app-border bg-app-hover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-app-input border border-app-border flex items-center justify-center text-app-accent shrink-0">
              <Car size={32} weight="duotone" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-app-text truncate">
                {vehicle.brand} {vehicle.model}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-app-input border border-app-border text-app-muted">
                {vehicle.year}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono font-black text-xs text-app-accent px-2 py-0.5 rounded bg-app-accent/10 border border-app-accent/20">
                {vehicle.number}
              </span>
              {vehicle.vin && (
                <button
                  type="button"
                  onClick={() => handleCopyVin(vehicle.vin)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-app-muted hover:text-app-text px-2 py-0.5 rounded bg-app-input border border-app-border transition-colors cursor-pointer"
                  title="Click to copy VIN"
                >
                  {copiedVin ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  VIN: {vehicle.vin}
                </button>
              )}
              <span className="text-[11px] text-app-muted">
                {vehicle.color || 'Standard'} • {vehicle.fuelType || 'Petrol'}
              </span>
            </div>
          </div>
        </div>

        {/* OWNER & ODOMETER TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Owner Card */}
          <div className="p-3.5 bg-app-card rounded-xl border border-app-border space-y-1.5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1">
              <User size={12} className="text-app-accent" /> Registered Customer
            </p>
            <p className="font-bold text-xs text-app-text">{vehicle.owner || 'Walk-in'}</p>
            {owner?.phone && (
              <p className="text-[11px] text-app-muted flex items-center gap-1.5 font-mono">
                <Phone size={11} /> {owner.phone}
              </p>
            )}
            {owner?.email && (
              <p className="text-[11px] text-app-muted flex items-center gap-1.5 truncate">
                <EnvelopeSimple size={11} /> {owner.email}
              </p>
            )}
          </div>

          {/* Odometer & Workshop Status */}
          <div className="p-3.5 bg-app-card rounded-xl border border-app-border space-y-1.5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1">
              <Gauge size={12} className="text-emerald-500" /> Odometer & Health
            </p>
            <p className="font-mono font-black text-base text-app-text">
              {Number(vehicle.mileage || 0).toLocaleString()} <span className="text-xs font-normal text-app-muted">km</span>
            </p>
            <div>
              {activeJob ? (
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                  <Wrench size={13} weight="bold" />
                  <span>In Workshop: {activeJob.orderNumber} ({activeJob.status})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle size={13} weight="fill" />
                  <span>Roadworthy / Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIFETIME METRICS BAR */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-app-input/60 border border-app-border">
            <span className="text-[10px] font-medium text-app-muted block">Total Visits</span>
            <span className="font-mono font-bold text-sm text-app-text mt-0.5 block">{vehicleJobs.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-app-input/60 border border-app-border">
            <span className="text-[10px] font-medium text-app-muted block">Completed</span>
            <span className="font-mono font-bold text-sm text-emerald-400 mt-0.5 block">{completedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-app-input/60 border border-app-border">
            <span className="text-[10px] font-medium text-app-muted block">Active</span>
            <span className="font-mono font-bold text-sm text-amber-400 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-app-input/60 border border-app-border">
            <span className="text-[10px] font-medium text-app-muted block">Lifetime Spend</span>
            <span className="font-mono font-bold text-sm text-app-accent mt-0.5 block">
              ${totalLifetimeSpent.toFixed(0)}
            </span>
          </div>
        </div>

        {/* SERVICE HISTORY LIFECYCLE */}
        <div className="p-4 bg-app-card rounded-xl border border-app-border space-y-3.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-app-border pb-2.5">
            <h4 className="text-xs sm:text-sm font-bold text-app-text flex items-center gap-2">
              <ClockCounterClockwise size={16} className="text-emerald-500" weight="bold" />
              Service & Repair Timeline
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {['All', 'Completed', 'In Progress', 'Pending'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer',
                    historyFilter === f
                      ? 'bg-app-accent text-app-accentText'
                      : 'bg-app-input text-app-muted hover:text-app-text'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search inside History */}
          {vehicleJobs.length > 0 && (
            <div className="relative">
              <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <Input
                type="text"
                placeholder="Search orders, diagnoses, technicians..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 py-1 text-xs h-8"
              />
            </div>
          )}

          {/* Chronological Timeline List */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredHistory.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg bg-app-input/50 border border-app-border space-y-2 hover:border-app-accent/40 transition-colors"
                >
                  {/* Job Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-app-accent">{job.orderNumber}</span>
                      <span className="text-[10px] text-app-muted flex items-center gap-1">
                        <CalendarBlank size={11} /> {job.createdAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} size="sm" />
                      <span className="font-mono font-bold text-xs text-app-text">
                        {job.actualCost || job.estimatedCost || '$0'}
                      </span>
                    </div>
                  </div>

                  {/* Problem & Diagnosis */}
                  <div>
                    <p className="text-xs font-semibold text-app-text flex items-start gap-1.5">
                      <Wrench size={13} className="text-app-accent shrink-0 mt-0.5" />
                      <span>{job.problem || job.service || 'Service Performed'}</span>
                    </p>
                    {job.diagnosis && (
                      <p className="mt-1 text-[11px] text-app-muted pl-4 italic">
                        Findings: {job.diagnosis}
                      </p>
                    )}
                  </div>

                  {/* Meta Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-app-muted pt-1 border-t border-app-border/40">
                    {job.odometer && (
                      <span className="flex items-center gap-1 font-mono">
                        <Gauge size={11} /> {job.odometer} km
                      </span>
                    )}
                    {job.mechanic && (
                      <span className="flex items-center gap-1">
                        <User size={11} /> {job.mechanic}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : vehicleJobs.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ClockCounterClockwise size={28} className="text-app-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-app-text">No Service History Yet</p>
              <p className="text-[11px] text-app-muted">
                This vehicle does not have any recorded repair jobs.
              </p>
            </div>
          ) : (
            <p className="text-xs text-app-muted text-center py-4 italic">
              No service records matching "{historySearch}".
            </p>
          )}
        </div>
      </div>
    </Drawer>
  )
}
