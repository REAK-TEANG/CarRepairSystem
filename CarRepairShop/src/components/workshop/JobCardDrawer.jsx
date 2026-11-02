import { useState, useMemo } from 'react'
import {
  Car,
  User,
  Phone,
  Wrench,
  Clock,
  Sparkle,
  CheckCircle,
  Receipt,
  Trash,
  Package,
  Plus,
  FloppyDisk,
} from '@phosphor-icons/react'
import { Drawer, StatusBadge, Button, Input, Textarea, SearchableSelect, LoadingButton } from '@/components/ui'
import { useUpdateRepairJob } from '@/hooks/useRepairJobs'
import { useCreateInvoice } from '@/hooks/useInvoices'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
  { key: 'Pending', label: '1. Pending', icon: Clock },
  { key: 'In Progress', label: '2. In Progress', icon: Wrench },
  { key: 'Completed', label: '3. Completed', icon: CheckCircle },
]

export default function JobCardDrawer({
  isOpen,
  onClose,
  job,
  mechanics = [],
  services = [],
  inventory = [],
  onDelete,
}) {
  const { addToast } = useToast()
  const updateJobMutation = useUpdateRepairJob()
  const createInvoiceMutation = useCreateInvoice()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'parts' | 'invoice'
  const [status, setStatus] = useState(() => job?.status || 'Pending')
  const [mechanicId, setMechanicId] = useState(() => job?.mechanicId || '')
  const [problemDescription, setProblemDescription] = useState(() => job?.problemDescription || job?.problem || '')
  const [diagnosis, setDiagnosis] = useState(() => job?.diagnosis || '')
  const [priority, setPriority] = useState(() => job?.priority || 'Medium')
  const [estimatedCost, setEstimatedCost] = useState(() => job?.estimatedCost || '$150')
  const [actualCost, setActualCost] = useState(() => job?.actualCost || '')
  const [odometer, setOdometer] = useState(() => (job?.odometer ? String(job.odometer) : ''))
  const [fuelLevel, setFuelLevel] = useState(() => job?.fuelLevel || '1/2')
  const [selectedServiceId, setSelectedServiceId] = useState('')

  // Parts used in this job
  const [partsUsed, setPartsUsed] = useState(() => {
    if (!job) return []
    if (Array.isArray(job.partsUsed)) return job.partsUsed
    if (typeof job.partsUsed === 'string' && job.partsUsed.trim()) {
      try {
        return JSON.parse(job.partsUsed)
      } catch {
        return []
      }
    }
    return []
  })
  const [newPartId, setNewPartId] = useState('')
  const [newPartQty, setNewPartQty] = useState(1)

  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  // Mechanic Options for SearchableSelect
  const mechanicOptions = useMemo(() => {
    return mechanics.map((m) => ({
      value: m.id,
      label: m.name,
      sublabel: m.specialty || m.role || 'Mechanic',
    }))
  }, [mechanics])

  // Inventory Options for SearchableSelect
  const inventoryOptions = useMemo(() => {
    return inventory.map((item) => {
      const stock = item.stockQty ?? item.quantity ?? item.stock ?? 0
      const price = Number(item.unitPrice ?? item.price ?? 0).toFixed(2)
      const code = item.partCode || item.sku || item.code || 'Part'
      return {
        value: item.id,
        label: `${item.name} (${code})`,
        sublabel: `Stock: ${stock} | $${price}`,
      }
    })
  }, [inventory])

  // Service Catalog Options
  const serviceOptions = useMemo(() => {
    return services.map((s) => ({
      value: s.id,
      label: `${s.name || s.title} ($${Number(s.price || s.cost || 0).toFixed(2)})`,
      sublabel: s.description || s.category,
    }))
  }, [services])

  // Calculated totals
  const partsSubtotal = useMemo(() => {
    return partsUsed.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.quantity || 1)), 0)
  }, [partsUsed])

  const parsedBaseCost = useMemo(() => {
    const raw = actualCost || estimatedCost || '0'
    return parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0
  }, [actualCost, estimatedCost])

  const totalCalculatedCost = useMemo(() => {
    return Math.max(parsedBaseCost, partsSubtotal)
  }, [parsedBaseCost, partsSubtotal])

  // Add Part to Job
  const handleAddPart = () => {
    if (!newPartId) return
    const matched = inventory.find((i) => String(i.id) === String(newPartId))
    if (!matched) return

    const price = Number(matched.price || matched.unitPrice || 0)
    const existingIndex = partsUsed.findIndex(
      (p) => String(p.sparePartId || p.id) === String(matched.id)
    )

    if (existingIndex >= 0) {
      const updated = [...partsUsed]
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + Number(newPartQty)
      setPartsUsed(updated)
    } else {
      setPartsUsed([
        ...partsUsed,
        {
          id: matched.id,
          sparePartId: matched.id,
          name: matched.name,
          sku: matched.sku || matched.code || matched.partCode || 'PART',
          partCode: matched.partCode || matched.sku || matched.code || 'PART',
          price,
          unitPrice: price,
          quantity: Number(newPartQty) || 1,
        },
      ])
    }
    setNewPartId('')
    setNewPartQty(1)
  }

  // Remove Part
  const handleRemovePart = (index) => {
    setPartsUsed((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Quick 1-Click Status Step
  const handleStepStatus = async (newStatus) => {
    if (!job) return
    setStatus(newStatus)
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status: newStatus,
          mechanicId: mechanicId || null,
        },
      })
      addToast(`Status updated to "${newStatus}"`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to update status', 'warning')
    }
  }

  // Save All Changes
  const handleSave = async () => {
    if (!job) return
    setIsSaving(true)
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: {
          status,
          mechanicId: mechanicId || null,
          problemDescription,
          diagnosis,
          priority,
          estimatedCost,
          actualCost: `$${totalCalculatedCost.toFixed(2)}`,
          odometer: Number(odometer) || 0,
          fuelLevel,
          usedParts: partsUsed,
        },
      })
      addToast('Repair Job updated successfully', 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to save changes', 'warning')
    } finally {
      setIsSaving(false)
    }
  }

  // 1-Click Convert to Invoice
  const handleGenerateInvoice = async () => {
    if (!job) return
    setIsGeneratingInvoice(true)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const dueDateStr = nextWeek.toISOString().split('T')[0]

    try {
      await createInvoiceMutation.mutateAsync({
        customerId: job.customerId,
        customer: job.customer,
        orderNumber: job.orderNumber,
        amount: totalCalculatedCost,
        dueDate: dueDateStr,
      })
      // Update job to completed if not already
      if (status !== 'Completed') {
        await updateJobMutation.mutateAsync({
          id: job.id,
          data: { status: 'Completed', actualCost: `$${totalCalculatedCost.toFixed(2)}` },
        })
        setStatus('Completed')
      }
      addToast(`Invoice generated for ${job.orderNumber} ($${totalCalculatedCost.toFixed(2)})`, 'success')
      setActiveTab('invoice')
    } catch (err) {
      addToast(err?.message || 'Failed to generate invoice', 'warning')
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  if (!job) return null

  const vehiclePlate = job.plate || job.vehicleNumber || 'NO PLATE'
  const vehicleName = job.vehicle || `${job.brand || ''} ${job.model || ''}`.trim() || 'Vehicle'
  const customerName = job.customer || job.customerName || 'Walk-in Customer'

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={job.orderNumber || `Job #${job.id}`}
      badge={<StatusBadge status={status} />}
      subtitle={`Created ${job.startDate || job.createdAt || 'Recently'}`}
      width="max-w-2xl sm:max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(job)}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-9 px-2.5"
                title="Delete Job Order"
              >
                <Trash size={16} />
              </Button>
            )}
            <span className="text-xs text-app-muted">
              Running Total: <strong className="text-app-text font-mono text-sm">${totalCalculatedCost.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <LoadingButton
              type="button"
              isLoading={isSaving}
              onClick={handleSave}
              className="bg-app-accent text-app-accentText hover:bg-app-accentHover font-semibold px-4"
            >
              <FloppyDisk size={14} weight="bold" className="sm:mr-1" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </LoadingButton>
          </div>
        </div>
      }
    >
      {/* 1. Hero Summary Card */}
      <div className="p-4 rounded-xl border border-app-border bg-app-card/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent flex-shrink-0">
            <Car size={26} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono tracking-tight text-app-text">
                {vehiclePlate}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-app-input border border-app-border text-app-text">
                {vehicleName}
              </span>
            </div>
            <p className="text-xs text-app-muted flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <User size={13} /> {customerName}
              </span>
              {job.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={13} /> {job.phone}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="text-right">
          <p className="text-xs font-medium text-app-muted">Job Total</p>
          <p className="text-xl font-bold font-mono text-app-accent">
            ${totalCalculatedCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 2. Interactive Status Stepper */}
      <div className="p-3 rounded-xl border border-app-border bg-app-input/40 space-y-1.5">
        <p className="text-xs font-medium text-app-muted px-1">
          Pipeline Status
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {STATUS_STEPS.map((step) => {
            const Icon = step.icon
            const isCurrent = status === step.key
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => handleStepStatus(step.key)}
                className={cn(
                  'flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer touch-manipulation active:scale-[0.98]',
                  isCurrent
                    ? 'bg-app-accent text-app-accentText border-app-accent shadow-xs'
                    : 'bg-app-card border-app-border text-app-muted hover:border-app-muted/60 hover:text-app-text'
                )}
              >
                <Icon size={14} weight={isCurrent ? 'bold' : 'regular'} />
                <span className="truncate">{step.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-app-border gap-4 sm:gap-6 overflow-x-auto pb-1 text-xs font-semibold whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          title="Overview & Work Order"
          className={cn(
            'pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 touch-manipulation',
            activeTab === 'overview'
              ? 'border-app-accent text-app-accent'
              : 'border-transparent text-app-muted hover:text-app-text'
          )}
        >
          <Wrench size={15} />
          <span>Overview</span>
          <span className="hidden sm:inline">&nbsp;& Work Order</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          title={`Services & Parts (${partsUsed.length})`}
          className={cn(
            'pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 touch-manipulation',
            activeTab === 'parts'
              ? 'border-app-accent text-app-accent'
              : 'border-transparent text-app-muted hover:text-app-text'
          )}
        >
          <Package size={15} />
          <span>Parts</span>
          <span className="hidden sm:inline">&nbsp;& Services</span>
          <span>&nbsp;({partsUsed.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          title="Billing & Invoicing"
          className={cn(
            'pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 touch-manipulation',
            activeTab === 'invoice'
              ? 'border-app-accent text-app-accent'
              : 'border-transparent text-app-muted hover:text-app-text'
          )}
        >
          <Receipt size={15} />
          <span>Billing</span>
          <span className="hidden sm:inline">&nbsp;& Invoicing</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Assignment, Priority & Estimated Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-app-text mb-1 block">
                Assigned Mechanic
              </label>
              <SearchableSelect
                value={mechanicId}
                onChange={setMechanicId}
                options={mechanicOptions}
                placeholder="Assign Technician..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-app-text mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 rounded-lg border border-app-border bg-app-input px-3 text-xs text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-app-text mb-1 block">Estimated Cost</label>
              <Input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="$150"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Odometer & Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-app-border bg-app-card/60">
            <div>
              <label className="text-xs font-medium text-app-muted mb-1 block">
                Odometer Reading (km)
              </label>
              <Input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="e.g. 95000"
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-app-muted mb-1 block">Fuel Level</label>
              <div className="grid grid-cols-4 gap-1">
                {['1/4', '1/2', '3/4', 'Full'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFuelLevel(f)}
                    className={cn(
                      'py-1 rounded text-xs border text-center transition-all cursor-pointer font-medium',
                      fuelLevel === f
                        ? 'bg-app-accent text-app-accentText border-app-accent font-bold'
                        : 'bg-app-input border-app-border text-app-muted hover:text-app-text'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problem & Diagnosis Notes */}
          <div>
            <label className="text-xs font-semibold text-app-text mb-1 block">
              Customer Complaint / Reported Issue
            </label>
            <Textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="Reported symptoms..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-app-text mb-1 block">
              Technician Diagnosis & Inspection Findings
            </label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="text-xs"
              placeholder="Detailed mechanical inspection findings and recommendations..."
            />
          </div>
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Service Quick Add */}
          <div className="p-3.5 rounded-xl border border-app-border bg-app-card/60 space-y-2">
            <label className="text-xs font-semibold text-app-text flex items-center gap-1.5">
              <Sparkle size={14} className="text-app-accent" weight="bold" />
              Service Catalog Quick Add
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedServiceId}
                  onChange={setSelectedServiceId}
                  options={serviceOptions}
                  placeholder="Select standard service package..."
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const s = services.find((item) => String(item.id) === String(selectedServiceId))
                  if (s) {
                    const cost = Number(s.price || s.cost || 0)
                    setActualCost(`$${(parsedBaseCost + cost).toFixed(2)}`)
                    addToast(`Added service: ${s.name}`, 'success')
                    setSelectedServiceId('')
                  }
                }}
                disabled={!selectedServiceId}
                className="bg-app-accent text-app-accentText hover:bg-app-accentHover text-xs h-9 px-3"
              >
                <Plus size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Add Inventory Part */}
          <div className="p-3.5 rounded-xl border border-app-border bg-app-card/60 space-y-2">
            <label className="text-xs font-semibold text-app-text flex items-center gap-1.5">
              <Package size={14} className="text-app-accent" weight="bold" />
              Log Parts Used from Inventory
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <SearchableSelect
                  value={newPartId}
                  onChange={setNewPartId}
                  options={inventoryOptions}
                  placeholder="Select inventory part..."
                />
              </div>
              <div>
                <Input
                  type="number"
                  min="1"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Qty"
                  className="text-xs font-mono h-9"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddPart}
                disabled={!newPartId}
                className="bg-app-accent text-app-accentText hover:bg-app-accentHover text-xs h-9"
              >
                <Plus size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Add Part</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Parts Used Table */}
          <div className="rounded-xl border border-app-border overflow-hidden">
            <div className="px-4 py-2.5 bg-app-hover/50 border-b border-app-border flex items-center justify-between">
              <span className="text-xs font-semibold text-app-text">Logged Parts ({partsUsed.length})</span>
              <span className="text-xs font-mono font-bold text-app-text">
                Subtotal: ${partsSubtotal.toFixed(2)}
              </span>
            </div>

            {partsUsed.length === 0 ? (
              <div className="py-8 text-center text-xs text-app-muted">
                No parts logged yet. Select a part from inventory above.
              </div>
            ) : (
              <div className="divide-y divide-app-border/40">
                {partsUsed.map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="p-3 flex items-center justify-between text-xs hover:bg-app-hover/30 transition-colors">
                    <div>
                      <p className="font-semibold text-app-text">{p.name}</p>
                      <p className="text-[11px] text-app-muted font-mono">
                        SKU: {p.sku || 'N/A'} | Qty: {p.quantity} &times; ${Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-app-text">
                        ${(Number(p.price) * Number(p.quantity)).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="text-app-muted hover:text-red-500 p-1 cursor-pointer"
                        title="Remove part"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Invoice Summary Box */}
          <div className="p-5 rounded-xl border border-app-border bg-app-card/60 space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div>
                <p className="text-xs text-app-muted">Work Order Reference</p>
                <p className="text-sm font-bold font-mono text-app-text">{job.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-app-muted">Customer</p>
                <p className="text-xs font-semibold text-app-text">{customerName}</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-app-muted">
                <span>Labor & Base Service</span>
                <span className="font-mono text-app-text">${parsedBaseCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-app-muted">
                <span>Parts & Materials ({partsUsed.length} items)</span>
                <span className="font-mono text-app-text">${partsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-app-muted">
                <span>Tax & Fees</span>
                <span className="font-mono text-app-text">$0.00</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-app-border text-sm font-bold">
                <span className="text-app-text">Grand Total</span>
                <span className="font-mono text-app-accent text-base">
                  ${totalCalculatedCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 1-Click Convert to Invoice Button */}
            <div className="pt-2">
              <LoadingButton
                type="button"
                isLoading={isGeneratingInvoice}
                onClick={handleGenerateInvoice}
                className="w-full bg-app-accent text-app-accentText hover:bg-app-accentHover font-semibold py-2.5 flex items-center justify-center gap-2"
              >
                <Receipt size={16} weight="bold" />
                <span className="hidden sm:inline">Generate Official Invoice & Settle</span>
                <span className="sm:hidden">Generate Invoice</span>
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
