import { useState, useMemo } from 'react'
import {
  Car,
  User,
  GasPump,
  Gauge,
  Wrench,
  Sparkle,
  PlusCircle,
  CheckCircle,
  MagnifyingGlass,
  Check,
} from '@phosphor-icons/react'
import { Modal, Button, Input, Textarea, SearchableSelect, LoadingButton } from '@/components/ui'
import { customerService } from '@/services/customerService'
import { vehicleService } from '@/services/vehicleService'
import { useCreateRepairJob } from '@/hooks/useRepairJobs'
import { useVehicles } from '@/hooks/useVehicles'
import { useMechanics } from '@/hooks/useMechanics'
import { useAppStore } from '@/store/useAppStore'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const QUICK_SERVICE_TAGS = [
  'Regular 10k Service',
  'Oil & Filter Change',
  'Brake Pad Service',
  'A/C Not Cold',
  'Engine Check Light',
  'Suspension Noise',
  'Battery / Alternator',
  'Tire Rotation & Balance',
]

const FUEL_OPTIONS = ['1/4', '1/2', '3/4', 'Full']

export default function FastIntakeModal({
  isOpen,
  onClose,
  onSuccess,
  vehicles = [],
  customers = [],
  mechanics = [],
  initialData = null,
}) {
  const queryClient = useQueryClient()
  const createJobMutation = useCreateRepairJob()

  // Fallback to fetch vehicles & mechanics if not passed from parent page
  const { data: fallbackVehicles = [] } = useVehicles({ all: true }, { enabled: !!isOpen && vehicles.length === 0 })
  const { data: fallbackMechanics = [] } = useMechanics({ all: true }, { enabled: !!isOpen && mechanics.length === 0 })
  const activeVehicles = vehicles.length > 0 ? vehicles : (Array.isArray(fallbackVehicles?.data) ? fallbackVehicles.data : (Array.isArray(fallbackVehicles) ? fallbackVehicles : []))
  const activeMechanics = mechanics.length > 0 ? mechanics : (Array.isArray(fallbackMechanics?.data) ? fallbackMechanics.data : (Array.isArray(fallbackMechanics) ? fallbackMechanics : []))

  // State
  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    if (initialData?.vehicleId) {
      return activeVehicles.find((v) => String(v.id) === String(initialData.vehicleId)) || null
    }
    if (initialData?.plate) {
      return activeVehicles.find((v) => v.number?.toLowerCase() === initialData.plate.toLowerCase()) || null
    }
    return null
  })
  const [plateSearch, setPlateSearch] = useState(() => initialData?.plate || '')
  const [isNewVehicleMode, setIsNewVehicleMode] = useState(false)

  // New vehicle & customer fields (when not found in existing list)
  const [newVehicleBrand, setNewVehicleBrand] = useState('')
  const [newVehicleModel, setNewVehicleModel] = useState('')
  const [newCustomerName, setNewCustomerName] = useState(() => initialData?.customer || '')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  // Intake details
  const [odometer, setOdometer] = useState('')
  const [fuelLevel, setFuelLevel] = useState('1/2')
  const [problemDescription, setProblemDescription] = useState(
    () => initialData?.problem || initialData?.service || initialData?.notes || ''
  )
  const [mechanicId, setMechanicId] = useState(() => initialData?.mechanicId || '')
  const [priority, setPriority] = useState('Medium')
  const [estimatedCost, setEstimatedCost] = useState('$150')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Filter existing vehicles by search query
  const matchingVehicles = useMemo(() => {
    if (!plateSearch.trim()) return []
    const q = plateSearch.toLowerCase().trim()
    return activeVehicles.filter(
      (v) =>
        v.number?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.customerName?.toLowerCase().includes(q)
    )
  }, [activeVehicles, plateSearch])

  // Select an existing vehicle
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setIsNewVehicleMode(false)
    setPlateSearch(vehicle.number)
    if (vehicle.mileage) {
      setOdometer(String(vehicle.mileage))
    }
  }

  // Handle Tag Click
  const handleToggleTag = (tag) => {
    setProblemDescription((prev) => {
      if (!prev) return tag
      if (prev.includes(tag)) return prev
      return `${prev}, ${tag}`
    })
  }

  // Reset form
  const handleReset = () => {
    setPlateSearch('')
    setSelectedVehicle(null)
    setIsNewVehicleMode(false)
    setNewVehicleBrand('')
    setNewVehicleModel('')
    setNewCustomerName('')
    setNewCustomerPhone('')
    setOdometer('')
    setFuelLevel('1/2')
    setProblemDescription('')
    setMechanicId('')
    setPriority('Medium')
    setEstimatedCost('$150')
    setError('')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    handleReset()
    onClose?.()
    useAppStore.getState().setFastIntakeModalOpen(false)
  }

  // Submit Fast Intake
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    let targetVehicleId = selectedVehicle?.id
    let targetCustomerId = selectedVehicle?.customerId || selectedVehicle?.ownerId
    let targetCustomerName = selectedVehicle?.customerName || ''
    let targetPlate = selectedVehicle?.number || plateSearch.trim()
    let targetVehicleName = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : ''

    if (!selectedVehicle && !isNewVehicleMode) {
      setError('Please select an existing vehicle or switch to New Vehicle / Walk-in.')
      return
    }

    if (isNewVehicleMode) {
      if (!plateSearch.trim()) {
        setError('License Plate Number is required.')
        return
      }
      if (!newCustomerName.trim()) {
        setError('Customer Name is required for new registration.')
        return
      }
      if (!newVehicleBrand.trim()) {
        setError('Vehicle Make/Brand is required.')
        return
      }
    }

    if (!problemDescription.trim()) {
      setError('Please enter or select at least one reported problem / service needed.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. If New Vehicle mode, register Customer and Vehicle first
      if (isNewVehicleMode) {
        // Create Customer
        const customerPayload = {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
        }
        const createdCustomerRes = await customerService.create(customerPayload)
        const customer = createdCustomerRes.data || createdCustomerRes
        targetCustomerId = customer.id
        targetCustomerName = customer.name || newCustomerName.trim()

        // Create Vehicle
        const vehiclePayload = {
          number: targetPlate,
          brand: newVehicleBrand.trim(),
          model: newVehicleModel.trim(),
          ownerId: targetCustomerId,
          mileage: Number(odometer) || 0,
        }
        const createdVehicleRes = await vehicleService.create(vehiclePayload)
        const vehicle = createdVehicleRes.data || createdVehicleRes
        targetVehicleId = vehicle.id
        targetVehicleName = `${vehicle.brand} ${vehicle.model}`

        // Refresh customers & vehicles in cache
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      }

      // 2. Create Repair Order
      const jobPayload = {
        vehicleId: targetVehicleId,
        customerId: targetCustomerId,
        mechanicId: mechanicId || null,
        problemDescription: problemDescription.trim(),
        status: 'Pending',
        priority,
        estimatedCost,
        odometer: Number(odometer) || 0,
        fuelLevel,
        customerApproval: 'Approved',
      }

      const res = await createJobMutation.mutateAsync(jobPayload)
      const createdJob = res.data || res

      handleClose()
      if (onSuccess) {
        try {
          onSuccess({
            ...createdJob,
            customer: targetCustomerName,
            plate: targetPlate,
            vehicle: targetVehicleName,
          })
        } catch (callbackErr) {
          console.error('FastIntakeModal onSuccess callback error:', callbackErr)
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to create repair order. Please check inputs.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mechanicOptions = activeMechanics.map((m) => ({
    value: m.id,
    label: m.name,
    sublabel: m.specialty || m.role || 'Mechanic',
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Fast Vehicle Intake (Check-in)"
      subtitle="Register drive-in vehicle & create repair order in under 30 seconds"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
            {error}
          </div>
        )}

        {/* Step 1: Vehicle & Customer Lookup */}
        <div className="p-4 rounded-xl border border-app-border bg-app-card/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-app-text flex items-center gap-1.5">
              <Car size={16} className="text-app-accent" weight="bold" />
              Vehicle License Plate *
            </label>
            <button
              type="button"
              onClick={() => {
                setIsNewVehicleMode(!isNewVehicleMode)
                setSelectedVehicle(null)
              }}
              className="text-xs text-app-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              {isNewVehicleMode ? (
                <>
                  <MagnifyingGlass size={13} weight="bold" />
                  <span className="hidden sm:inline">Search Existing Vehicles</span>
                  <span className="sm:hidden">Existing</span>
                </>
              ) : (
                <>
                  <PlusCircle size={13} weight="bold" />
                  <span className="hidden sm:inline">+ New Vehicle / Walk-in</span>
                  <span className="sm:hidden">+ New</span>
                </>
              )}
            </button>
          </div>

          {!isNewVehicleMode ? (
            <div className="space-y-2">
              <div className="relative">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none z-10"
                />
                <Input
                  type="text"
                  value={plateSearch}
                  onChange={(e) => {
                    setPlateSearch(e.target.value)
                    if (selectedVehicle && e.target.value !== selectedVehicle.number) {
                      setSelectedVehicle(null)
                    }
                  }}
                  placeholder="Type license plate, model, or customer name..."
                  className="pl-9 text-xs"
                  autoFocus
                />
              </div>

              {/* Matched vehicle indicator */}
              {selectedVehicle ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-app-accent/10 border border-app-accent/30 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={18} className="text-app-accent flex-shrink-0" weight="fill" />
                    <div>
                      <p className="font-semibold text-app-text">
                        {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.number})
                      </p>
                      <p className="text-[11px] text-app-muted flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {selectedVehicle.customerName || 'No owner recorded'}
                        </span>
                        {selectedVehicle.mileage && (
                          <span className="flex items-center gap-1 font-mono">
                            <Gauge size={12} /> {selectedVehicle.mileage.toLocaleString()} km
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="text-xs text-app-muted hover:text-app-text h-7"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                matchingVehicles.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-app-border divide-y divide-app-border/40 bg-app-card text-xs">
                    {matchingVehicles.slice(0, 5).map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVehicle(v)}
                        className="p-2.5 hover:bg-app-hover cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-app-text font-mono mr-2">{v.number}</span>
                          <span className="text-app-muted">
                            {v.brand} {v.model}
                          </span>
                        </div>
                        <span className="text-[11px] text-app-muted truncate max-w-[150px]">
                          {v.customerName}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ) : (
            /* Inline New Vehicle & Customer Registration */
            <div className="p-3.5 rounded-lg border border-dashed border-app-border bg-app-input/40 space-y-3 animate-in fade-in">
              <p className="text-[11px] font-semibold text-app-accent flex items-center gap-1">
                <Sparkle size={13} weight="fill" />
                Quick Vehicle & Customer Registration (Walk-in)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-app-muted mb-1 block">
                    Plate Number *
                  </label>
                  <Input
                    type="text"
                    value={plateSearch}
                    onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                    placeholder="e.g. 2BD-1234"
                    className="text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-app-muted mb-1 block">
                    Customer Name *
                  </label>
                  <Input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Owner Full Name"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-app-muted mb-1 block">
                    Make / Brand *
                  </label>
                  <Input
                    type="text"
                    value={newVehicleBrand}
                    onChange={(e) => setNewVehicleBrand(e.target.value)}
                    placeholder="e.g. Toyota, Honda, Ford"
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-app-muted mb-1 block">
                    Model
                  </label>
                  <Input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="e.g. Camry, CR-V, Ranger"
                    className="text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-app-muted mb-1 block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Intake Details (Odometer, Fuel, Quick Tags) */}
        <div className="p-4 rounded-xl border border-app-border bg-app-card/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-app-text flex items-center gap-1.5 mb-1.5">
                <Gauge size={15} className="text-app-accent" weight="bold" />
                Current Odometer (km)
              </label>
              <Input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="e.g. 85000"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-app-text flex items-center gap-1.5 mb-1.5">
                <GasPump size={15} className="text-app-accent" weight="bold" />
                Fuel Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {FUEL_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFuelLevel(f)}
                    className={cn(
                      'min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center',
                      fuelLevel === f
                        ? 'bg-app-accent text-app-accentText border-app-accent font-bold shadow-xs'
                        : 'bg-app-input border-app-border text-app-muted hover:text-app-text hover:bg-app-hover'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Issue / Service Tags */}
          <div>
            <label className="text-xs font-semibold text-app-text flex items-center gap-1.5 mb-1.5">
              <Sparkle size={15} className="text-app-accent" weight="bold" />
              Quick Service / Issue Tags (1-Tap Selection)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SERVICE_TAGS.map((tag) => {
                const isActive = problemDescription.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1 cursor-pointer',
                      isActive
                        ? 'bg-app-accent/15 border-app-accent text-app-accent font-semibold'
                        : 'bg-app-input/80 border-app-border text-app-muted hover:border-app-muted/60 hover:text-app-text'
                    )}
                  >
                    {isActive && <Check size={11} weight="bold" />}
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-app-text flex items-center gap-1.5 mb-1.5">
              Reported Problem / Notes *
            </label>
            <Textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describe symptoms, customer requests, or inspection notes..."
              rows={2}
              className="text-xs"
              required
            />
          </div>
        </div>

        {/* Step 3: Assignment & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-app-text flex items-center gap-1 mb-1">
              <Wrench size={14} className="text-app-accent" weight="bold" />
              Assign Mechanic
            </label>
            <SearchableSelect
              value={mechanicId}
              onChange={setMechanicId}
              options={mechanicOptions}
              placeholder="Select Mechanic..."
              searchPlaceholder="Search mechanics..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-app-text mb-1 block">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-lg border border-app-border bg-app-input px-3 text-base sm:text-xs text-app-text focus:outline-none focus:border-app-accent transition-colors"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent (Express)</option>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-app-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="min-h-[44px] sm:min-h-0">
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            className="min-h-[44px] sm:min-h-0 bg-app-accent text-app-accentText hover:bg-app-accentHover font-semibold px-5"
          >
            <span className="hidden sm:inline">Create Job Card &rarr;</span>
            <span className="sm:hidden">Create Job &rarr;</span>
          </LoadingButton>
        </div>
      </form>
    </Modal>
  )
}
