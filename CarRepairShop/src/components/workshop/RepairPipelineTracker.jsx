import { useState } from 'react'
import {
  Wrench,
  MagnifyingGlass,
  Package,
  CheckCircle,
  Car,
  User,
  ArrowRight,
  Clock,
  Sparkle,
  Kanban,
  ListNumbers,
  Eye,
  CircleNotch,
  Check,
  ShieldCheck,
  Receipt,
  ChatCircleDots,
  Plus,
  Copy,
} from '@phosphor-icons/react'
import { useRepairJobs, useUpdateRepairJob } from '../../hooks/useRepairJobs'
import { useMechanics } from '../../hooks/useMechanics'
import { useInventory } from '../../hooks/useInventory'
import { useCreateInvoice } from '../../hooks/useInvoices'
import { useToast } from '../../context/ToastContext'
import { StatusBadge, Modal, LoadingButton, SearchableSelect, Input, Checkbox } from '../ui'

const PIPELINE_STEPS = [
  {
    id: 'Pending',
    key: 'Pending',
    stepNumber: 1,
    label: 'Intake / Pending',
    shortLabel: 'Pending',
    description: 'Vehicle received & logged',
    icon: Clock,
  },
  {
    id: 'Diagnosing',
    key: 'Diagnosing',
    stepNumber: 2,
    label: 'Diagnosing',
    shortLabel: 'Diagnosing',
    description: 'Inspection & error scanning',
    icon: MagnifyingGlass,
  },
  {
    id: 'Waiting for Parts',
    key: 'Waiting for Parts',
    stepNumber: 3,
    label: 'Waiting for Parts',
    shortLabel: 'Parts Required',
    description: 'Allocating inventory items',
    icon: Package,
  },
  {
    id: 'Repairing',
    key: 'Repairing',
    stepNumber: 4,
    label: 'Repairing',
    shortLabel: 'Repairing',
    description: 'Active mechanical repair',
    icon: Wrench,
  },
  {
    id: 'Ready for Pickup',
    key: 'Ready for Pickup',
    stepNumber: 5,
    label: 'Ready for Pickup',
    shortLabel: 'Ready for Pickup',
    description: 'Testing & QA passed',
    icon: Sparkle,
  },
  {
    id: 'Completed',
    key: 'Completed',
    stepNumber: 6,
    label: 'Completed',
    shortLabel: 'Completed',
    description: 'Handed over & invoiced',
    icon: CheckCircle,
  },
]

export default function RepairPipelineTracker({ mechanicFilter = null }) {
  const { addToast } = useToast()
  const params = mechanicFilter ? { mechanicId: mechanicFilter, all: true } : { all: true }
  const { data: rawJobs = [] } = useRepairJobs(params)
  const { data: rawMechanics = [] } = useMechanics({ all: true })
  const { data: rawInventory = [] } = useInventory({ all: true })

  const jobs = Array.isArray(rawJobs) ? rawJobs : (rawJobs?.data || [])
  const mechanics = Array.isArray(rawMechanics) ? rawMechanics : (rawMechanics?.data || [])
  const inventory = Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])

  const updateJobMutation = useUpdateRepairJob()
  const createInvoiceMutation = useCreateInvoice()

  const [selectedMechanic, setSelectedMechanic] = useState(mechanicFilter || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState('pipeline') // 'pipeline' | 'columns'
  const [selectedJob, setSelectedJob] = useState(null)
  const [updatingJobId, setUpdatingJobId] = useState(null)

  // Modals
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isQAGateOpen, setIsQAGateOpen] = useState(false)
  const [isAddPartOpen, setIsAddPartOpen] = useState(false)
  const [isNotifyOpen, setIsNotifyOpen] = useState(false)

  // QA Gate Checklist State
  const [qaChecks, setQaChecks] = useState({
    roadTest: true,
    dtcCleared: true,
    fluidsTorque: true,
    cleaned: true,
  })

  // Add Part Form State
  const [partSelection, setPartSelection] = useState({
    sparePartId: '',
    quantity: 1,
  })

  // 1-Click Fast Step Transition
  const handleSetStatus = async (job, newStatus) => {
    if (!job || job.status === newStatus) return

    // If attempting to move to 'Ready for Pickup', open QA inspection gate first
    if (newStatus === 'Ready for Pickup' && job.status === 'Repairing') {
      setSelectedJob(job)
      setIsQAGateOpen(true)
      return
    }

    setUpdatingJobId(job.id)
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: { status: newStatus },
      })
      addToast(`Vehicle ${job.plate || job.orderNumber} advanced to ${newStatus}`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to advance status. Please try again.', 'warning')
    } finally {
      setUpdatingJobId(null)
    }
  }

  // Confirm QA Inspection Gate
  const handleConfirmQAGate = async () => {
    if (!selectedJob) return
    setIsQAGateOpen(false)
    setUpdatingJobId(selectedJob.id)
    try {
      await updateJobMutation.mutateAsync({
        id: selectedJob.id,
        data: {
          status: 'Ready for Pickup',
          diagnosis: selectedJob.diagnosis
            ? `${selectedJob.diagnosis} | QA Passed (Road test & DTC verified)`
            : 'QA Passed (Road test & DTC verified)',
        },
      })
      addToast(`Vehicle ${selectedJob.plate} passed QA and is Ready for Pickup!`, 'success')
    } finally {
      setUpdatingJobId(null)
    }
  }

  // Add Extra Spare Part Mid-Repair
  const handleAddPartSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJob || !partSelection.sparePartId) return

    const chosenPart = inventory.find((p) => String(p.id) === String(partSelection.sparePartId))
    if (!chosenPart) return

    try {
      await updateJobMutation.mutateAsync({
        id: selectedJob.id,
        data: {
          usedParts: [
            {
              sparePartId: chosenPart.id,
              quantity: Number(partSelection.quantity) || 1,
            },
          ],
        },
      })
      addToast(`Added ${partSelection.quantity}x ${chosenPart.name} to ${selectedJob.orderNumber}`, 'success')
      setIsAddPartOpen(false)
      setPartSelection({ sparePartId: '', quantity: 1 })
    } catch (err) {
      addToast(err?.message || 'Failed to add part to order', 'warning')
    }
  }

  // 1-Click Generate Invoice
  const handleGenerateInvoice = async (job) => {
    if (!job) return
    const costNum = parseFloat(String(job.actualCost || job.estimatedCost || '350').replace(/[^0-9.]/g, '')) || 350

    try {
      await createInvoiceMutation.mutateAsync({
        customerId: job.customerId,
        customer: job.customer,
        orderNumber: job.orderNumber,
        amount: costNum,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      addToast(`Invoice generated for ${job.orderNumber} ($${costNum.toFixed(2)})`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to generate invoice', 'warning')
    }
  }

  // Get Next Step in the Pipeline
  const getNextStep = (currentStatus) => {
    const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStatus)
    if (currentIndex >= 0 && currentIndex < PIPELINE_STEPS.length - 1) {
      return PIPELINE_STEPS[currentIndex + 1]
    }
    return null
  }

  const getStepIndex = (status) => {
    const idx = PIPELINE_STEPS.findIndex((s) => s.id === status)
    return idx >= 0 ? idx : 0
  }

  // Filter Jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesMechanic =
      selectedMechanic === 'all' ||
      String(job.mechanicId) === String(selectedMechanic) ||
      (job.mechanic && job.mechanic.toLowerCase().includes(String(selectedMechanic).toLowerCase()))

    const matchesStatus = statusFilter === 'All' || job.status === statusFilter

    const q = searchQuery.trim().toLowerCase()
    const matchesQuery =
      !q ||
      (job.orderNumber || '').toLowerCase().includes(q) ||
      (job.vehicle || '').toLowerCase().includes(q) ||
      (job.plate || '').toLowerCase().includes(q) ||
      (job.customer || '').toLowerCase().includes(q) ||
      (job.problem || '').toLowerCase().includes(q) ||
      (job.mechanic || '').toLowerCase().includes(q)

    return matchesMechanic && matchesStatus && matchesQuery
  })

  return (
    <div className="space-y-5 text-app-text font-sans">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Count Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-subtle">
              <Car size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-app-text flex items-center gap-2">
                Vehicle Repair Pipeline
                <span className="text-xs text-app-muted font-mono">
                  {filteredJobs.length}
                </span>
              </h2>
            </div>
          </div>

          {/* Controls: Search, Mechanic Dropdown & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search plate, vehicle, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5"
              />
            </div>

            {/* Mechanic Filter */}
            {!mechanicFilter && (
              <div className="w-56">
                <SearchableSelect
                  value={selectedMechanic}
                  onChange={(val) => setSelectedMechanic(val)}
                  options={[
                    { value: 'all', label: `All Mechanics (${mechanics.length})` },
                    ...mechanics.map((m) => ({
                      value: m.id,
                      label: m.name,
                      sublabel: m.specialization ? `Spec: ${m.specialization}` : undefined,
                    })),
                  ]}
                  placeholder="Filter mechanic..."
                  searchPlaceholder="Search mechanic..."
                />
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-app-input border border-app-border rounded-sm">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-2.5 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'pipeline'
                    ? 'bg-app-accent text-app-accentText shadow-subtle'
                    : 'text-app-muted hover:text-app-text'
                }`}
                title="Visual Pipeline Stepper"
              >
                <ListNumbers size={14} weight="bold" />
                <span>Stepper</span>
              </button>
              <button
                onClick={() => setViewMode('columns')}
                className={`px-2.5 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'columns'
                    ? 'bg-app-accent text-app-accentText shadow-subtle'
                    : 'text-app-muted hover:text-app-text'
                }`}
                title="Kanban Board View"
              >
                <Kanban size={14} weight="bold" />
                <span>Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-app-border/60 pb-0.5">
          <span className="text-[11px] font-semibold text-app-muted mr-1 flex-shrink-0">Stage Filter:</span>
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'All'
                ? 'bg-app-text text-app-card shadow-subtle'
                : 'bg-app-input text-app-muted hover:text-app-text border border-app-border'
            }`}
          >
            All Stages ({jobs.length})
          </button>
          {PIPELINE_STEPS.map((s) => {
            const count = jobs.filter((j) => j.status === s.id).length
            const isSelected = statusFilter === s.id
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-subtle'
                    : 'bg-app-input text-app-muted hover:text-app-text border border-app-border'
                }`}
              >
                <span>{s.shortLabel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-app-hover text-app-text'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredJobs.length === 0 ? (
        <div className="bg-app-card rounded-sm border border-app-border p-10 text-center shadow-card">
          <Car size={40} className="mx-auto text-app-muted mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-app-text">No vehicles match current filters</h3>
          <p className="text-xs text-app-muted mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All'
              ? 'Try resetting your search query or selecting "All Stages".'
              : 'Create a new repair order to begin tracking its repair journey.'}
          </p>
          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('All')
                setSelectedMechanic('all')
              }}
              className="mt-4 px-3.5 py-1.5 rounded-sm bg-app-hover hover:bg-app-border text-xs font-semibold text-app-text transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'pipeline' ? (
        /* STEPPER PIPELINE LIST */
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const currentStepIdx = getStepIndex(job.status)
            const nextStep = getNextStep(job.status)
            const isUpdating = updatingJobId === job.id

            return (
              <div
                key={job.id}
                className="bg-app-card rounded-md border border-app-border shadow-subtle hover:border-app-border/90 hover:shadow-card transition-all duration-200 overflow-hidden"
              >
                {/* Header: Identity, Metadata & Primary Actions */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-app-border/60 bg-app-card">
                  {/* Left: Vehicle, Customer & Issue */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                      <Car size={20} weight="duotone" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      {/* Vehicle & Plate */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-app-text tracking-tight truncate">
                          {job.vehicle || 'Vehicle Unit'}
                        </h3>
                        {job.plate && (
                          <span className="px-2 py-0.5 rounded bg-app-input border border-app-border font-mono text-[11px] font-bold text-app-text">
                            {job.plate}
                          </span>
                        )}
                        <span className="font-mono text-xs text-app-muted">
                          {job.orderNumber}
                        </span>
                        <StatusBadge status={job.status} size="sm" />
                      </div>

                      {/* Customer, Mechanic & Problem */}
                      <div className="flex items-center gap-2.5 text-xs text-app-muted flex-wrap">
                        <span className="text-app-text font-medium">{job.customer}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Wrench size={12} className="text-emerald-500" />
                          <span>{job.mechanic || 'Unassigned'}</span>
                        </span>
                        {job.problem && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs text-app-text/90 italic" title={job.problem}>
                              "{job.problem}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Cost & Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0 flex-wrap">
                    {job.estimatedCost && (
                      <span className="font-mono font-bold text-sm text-app-text px-2.5 py-1 rounded bg-app-input border border-app-border">
                        {job.estimatedCost}
                      </span>
                    )}

                    {/* Fast Advance Action */}
                    {nextStep ? (
                      <button
                        onClick={() => handleSetStatus(job, nextStep.id)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-subtle transition-all disabled:opacity-50 cursor-pointer"
                        title={`Advance status to ${nextStep.label}`}
                      >
                        {isUpdating ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <ArrowRight size={14} weight="bold" />
                        )}
                        <span>Next: {nextStep.shortLabel}</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle size={14} weight="fill" />
                        <span>Done</span>
                      </div>
                    )}

                    {/* Add Part Button */}
                    {(job.status === 'Diagnosing' || job.status === 'Repairing' || job.status === 'Waiting for Parts') && (
                      <button
                        onClick={() => {
                          setSelectedJob(job)
                          setPartSelection({ sparePartId: inventory[0]?.id || '', quantity: 1 })
                          setIsAddPartOpen(true)
                        }}
                        className="px-2.5 py-1.5 rounded text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Add extra spare part"
                      >
                        <Plus size={13} weight="bold" />
                        <span>Part</span>
                      </button>
                    )}

                    {/* Pickup Notification */}
                    {(job.status === 'Ready for Pickup' || job.status === 'Completed') && (
                      <button
                        onClick={() => {
                          setSelectedJob(job)
                          setIsNotifyOpen(true)
                        }}
                        className="px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Notify Customer"
                      >
                        <ChatCircleDots size={14} weight="bold" />
                        <span>Notify</span>
                      </button>
                    )}

                    {/* Generate Invoice */}
                    {job.status === 'Completed' && (
                      <button
                        onClick={() => handleGenerateInvoice(job)}
                        className="px-2.5 py-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Create Invoice"
                      >
                        <Receipt size={14} weight="bold" />
                        <span>Invoice</span>
                      </button>
                    )}

                    {/* View Details */}
                    <button
                      onClick={() => {
                        setSelectedJob(job)
                        setIsViewOpen(true)
                      }}
                      className="px-2.5 py-1.5 rounded text-app-muted hover:text-app-text bg-app-input hover:bg-app-hover border border-app-border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="View Details"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Bottom: Minimal Connected Segmented Pipeline */}
                <div className="px-4 py-2.5 bg-app-card/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isCompleted = idx < currentStepIdx
                      const isCurrent = idx === currentStepIdx

                      return (
                        <button
                          key={step.id}
                          onClick={() => handleSetStatus(job, step.id)}
                          disabled={isUpdating}
                          className={`group relative h-8 px-2 rounded flex items-center gap-1.5 text-left transition-all duration-150 cursor-pointer border ${
                            isCurrent
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold'
                              : isCompleted
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                              : 'bg-app-input/60 text-app-muted hover:text-app-text hover:bg-app-hover border-app-border/70'
                          }`}
                          title={`Jump to ${step.label}`}
                        >
                          {/* Step indicator dot / check */}
                          <span
                            className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                              isCurrent
                                ? 'bg-white text-emerald-700'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-app-hover text-app-muted border border-app-border'
                            }`}
                          >
                            {isCompleted ? <Check size={10} weight="bold" /> : step.stepNumber}
                          </span>

                          {/* Label */}
                          <span className="text-[11px] truncate tracking-tight">
                            {step.shortLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* KANBAN COLUMNS VIEW (1-click move between columns) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {PIPELINE_STEPS.map((step) => {
            const columnJobs = filteredJobs.filter((j) => j.status === step.id)
            const StepIcon = step.icon

            return (
              <div
                key={step.id}
                className="bg-app-card rounded-sm border border-app-border p-3.5 flex flex-col space-y-3 shadow-card"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-app-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <StepIcon size={15} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-app-text leading-tight">{step.shortLabel}</h4>
                      <span className="text-[10px] text-app-muted">Step {step.stepNumber}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-app-input border border-app-border text-app-text font-mono">
                    {columnJobs.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 min-h-[120px]">
                  {columnJobs.map((job) => {
                    const nextStep = getNextStep(job.status)
                    return (
                      <div
                        key={job.id}
                        className="bg-app-card rounded-sm p-3 border border-app-border shadow-subtle hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 space-y-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {job.orderNumber}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-app-input border border-app-border font-bold">
                              {job.plate}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-app-text mt-1 truncate">{job.vehicle}</h5>
                          <p className="text-[11px] text-app-muted truncate mt-0.5">{job.customer}</p>
                          <p className="text-[10px] text-app-text/80 line-clamp-2 mt-1 bg-app-hover/50 p-1.5 rounded-sm border border-app-border/40">
                            {job.problem}
                          </p>
                        </div>

                        {/* 1-Click Fast Step Transition in Kanban */}
                        {nextStep ? (
                          <button
                            onClick={() => handleSetStatus(job, nextStep.id)}
                            className="w-full py-1.5 px-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-subtle cursor-pointer"
                          >
                            <span>Move to {nextStep.shortLabel}</span>
                            <ArrowRight size={12} weight="bold" />
                          </button>
                        ) : (
                          <div className="w-full py-1 text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
                            ✓ Job Completed
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {columnJobs.length === 0 && (
                    <div className="h-28 flex items-center justify-center text-center text-xs text-app-muted italic border-2 border-dashed border-app-border/60 rounded-sm">
                      No vehicles
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* QA Pre-Delivery Inspection Gate Modal */}
      <Modal isOpen={isQAGateOpen} onClose={() => setIsQAGateOpen(false)} title="Quality Assurance Pre-Delivery Gate" maxWidth="max-w-xl">
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-500 flex-shrink-0" weight="duotone" />
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                  Pre-Delivery Quality Inspection for {selectedJob.vehicle} ({selectedJob.plate})
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Verify the 4 QA checklist criteria before notifying customer that vehicle is ready for pickup.
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3 bg-app-input rounded-sm border border-app-border">
              <label className="flex items-center gap-2.5 p-2 rounded-sm bg-app-card border border-app-border cursor-pointer hover:bg-app-hover active:scale-[0.98]">
                <Checkbox
                  checked={qaChecks.roadTest}
                  onCheckedChange={(val) => setQaChecks({ ...qaChecks, roadTest: !!val })}
                />
                <span className="font-medium">1. Road test completed & initial customer symptoms resolved</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-sm bg-app-card border border-app-border cursor-pointer hover:bg-app-hover active:scale-[0.98]">
                <Checkbox
                  checked={qaChecks.dtcCleared}
                  onCheckedChange={(val) => setQaChecks({ ...qaChecks, dtcCleared: !!val })}
                />
                <span className="font-medium">2. Diagnostic Trouble Codes (DTC / OBD-II) scanned & cleared</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-sm bg-app-card border border-app-border cursor-pointer hover:bg-app-hover active:scale-[0.98]">
                <Checkbox
                  checked={qaChecks.fluidsTorque}
                  onCheckedChange={(val) => setQaChecks({ ...qaChecks, fluidsTorque: !!val })}
                />
                <span className="font-medium">3. Fluid levels topped up & wheel lug nut torque verified</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-sm bg-app-card border border-app-border cursor-pointer hover:bg-app-hover active:scale-[0.98]">
                <Checkbox
                  checked={qaChecks.cleaned}
                  onCheckedChange={(val) => setQaChecks({ ...qaChecks, cleaned: !!val })}
                />
                <span className="font-medium">4. Vehicle exterior washed & interior protection removed</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <button
                type="button"
                onClick={() => setIsQAGateOpen(false)}
                className="px-3.5 py-2 rounded-sm text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQAGate}
                disabled={!qaChecks.roadTest || !qaChecks.dtcCleared}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-bold transition-colors shadow-subtle flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle size={15} weight="bold" />
                <span>Pass QA & Mark Ready for Pickup</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mid-Repair Add Extra Spare Part Modal */}
      <Modal isOpen={isAddPartOpen} onClose={() => setIsAddPartOpen(false)} title="Add Extra Spare Part to Order">
        {selectedJob && (
          <form onSubmit={handleAddPartSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
              <p className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                <Package size={15} />
                Live Stock-Out for {selectedJob.orderNumber} ({selectedJob.vehicle})
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Adding parts will immediately deduct inventory in PostgreSQL and append to this repair order.
              </p>
            </div>

            <div>
              <label className="block text-app-muted font-medium mb-1">Select Spare Part *</label>
              <SearchableSelect
                value={partSelection.sparePartId}
                onChange={(val) => setPartSelection({ ...partSelection, sparePartId: val })}
                options={inventory.map((p) => ({
                  value: p.id,
                  label: `${p.partCode} - ${p.name} ($${Number(p.unitPrice).toFixed(2)})`,
                  sublabel: `${p.stockQty} in stock`,
                }))}
                placeholder="-- Choose Spare Part --"
                searchPlaceholder="Search spare part by code or name..."
              />
            </div>

            <div>
              <label className="block text-app-muted font-medium mb-1">Quantity to Deduct *</label>
              <Input
                type="number"
                min="1"
                required
                value={partSelection.quantity}
                onChange={(e) => setPartSelection({ ...partSelection, quantity: e.target.value })}
                className="font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <button
                type="button"
                onClick={() => setIsAddPartOpen(false)}
                className="px-3.5 py-2 rounded-sm text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <LoadingButton type="submit" loading={updateJobMutation.isPending}>
                Deduct & Add to Order
              </LoadingButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Customer Pickup Readiness Notification Modal */}
      <Modal isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} title="Customer Pickup Notification">
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-app-input rounded-sm border border-app-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-app-text flex items-center gap-1.5">
                  <ChatCircleDots size={15} className="text-emerald-500" />
                  SMS / WhatsApp / Telegram Ready Template
                </span>
                <button
                  onClick={() => {
                    const msg = `Dear ${selectedJob.customer}, your vehicle ${selectedJob.vehicle} (Plate: ${selectedJob.plate}) is READY FOR PICKUP at CarRepair Workshop. Total Amount: ${selectedJob.estimatedCost || '$350'}. Order: #${selectedJob.orderNumber}. Workshop open until 6:00 PM.`
                    navigator.clipboard?.writeText(msg)
                    addToast('Pickup message copied to clipboard!', 'success')
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-app-card border border-app-border text-app-text hover:bg-app-hover active:scale-[0.98] font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Text</span>
                </button>
              </div>

              <div className="p-3 bg-app-card rounded-sm border border-app-border font-mono text-[11px] text-app-text leading-relaxed">
                Dear <span className="text-emerald-600 font-bold">{selectedJob.customer}</span>, your vehicle{' '}
                <span className="text-app-text font-bold">{selectedJob.vehicle}</span> (Plate:{' '}
                <span className="font-bold">{selectedJob.plate}</span>) is{' '}
                <span className="text-emerald-600 font-bold">READY FOR PICKUP</span> at CarRepair Workshop.
                <br />
                <br />
                • Work Order: <span className="font-bold">#{selectedJob.orderNumber}</span>
                <br />
                • Total Balance: <span className="font-bold">{selectedJob.estimatedCost || '$350'}</span>
                <br />• Location: Main Workshop Bay 2, Open Mon-Sat 8:00 AM - 6:00 PM.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <button
                type="button"
                onClick={() => setIsNotifyOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-bold transition-colors shadow-subtle cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Vehicle Order Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Vehicle Repair Pipeline Details" maxWidth="max-w-2xl">
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-app-hover/50 rounded-sm border border-app-border">
              <div>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedJob.orderNumber}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedJob.vehicle}</h3>
                <p className="text-[11px] font-mono text-app-muted">License Plate: {selectedJob.plate}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            {/* Quick 1-Click Status Bar inside modal */}
            <div className="p-3.5 bg-app-input rounded-sm border border-app-border space-y-2">
              <label className="text-[11px] text-app-muted uppercase font-bold">1-Click Fast Pipeline Stage Jump:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PIPELINE_STEPS.map((s) => {
                  const isCurrent = selectedJob.status === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        handleSetStatus(selectedJob, s.id)
                        setSelectedJob((prev) => ({ ...prev, status: s.id }))
                      }}
                      className={`px-3 py-2 rounded-sm text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover active:scale-[0.98] hover:text-app-text'
                      }`}
                    >
                      <CheckCircle size={14} weight={isCurrent ? 'fill' : 'regular'} />
                      <span className="truncate">{s.shortLabel}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-card rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> Customer
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.customer}</p>
              </div>
              <div className="p-3 bg-app-card rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Wrench size={12} /> Assigned Technician
                </p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedJob.mechanic || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-app-card rounded-sm border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">Problem / Work Requested</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>

            {selectedJob.diagnosis && (
              <div className="p-3 bg-app-card rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Diagnosis & Tech Notes</p>
                <p className="text-app-text mt-1">{selectedJob.diagnosis}</p>
              </div>
            )}

            {/* Deducted Spare Parts */}
            <div className="p-3 bg-app-card rounded-sm border border-app-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1.5">
                  <Package size={14} className="text-amber-500" />
                  Parts Consumed from Inventory (Auto Stock-Out)
                </p>
                <button
                  onClick={() => {
                    setIsViewOpen(false)
                    setIsAddPartOpen(true)
                  }}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} weight="bold" /> Add Extra Part
                </button>
              </div>

              {selectedJob.partsUsed && selectedJob.partsUsed.length > 0 ? (
                <div className="space-y-1">
                  {selectedJob.partsUsed.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-sm bg-app-hover/50 border border-app-border text-xs"
                    >
                      <span className="font-medium">
                        {p.quantity}x {p.name} ({p.partCode})
                      </span>
                      <span className="font-mono text-app-muted font-semibold">
                        ${Number(p.unitPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-app-muted italic">No inventory parts logged yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
