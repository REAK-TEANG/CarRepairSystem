import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, CalendarBlank, Clock, User, CaretLeft, CaretRight, Car, Toolbox, XCircle } from '@phosphor-icons/react'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment } from '../../hooks/useAppointments'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

const statusFilters = ['All', 'Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMiniCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function AppointmentsPage() {
  const { can } = useAuth()
  const { data: appointments = [], isLoading } = useAppointments()
  const { data: customers = [] } = useCustomers()
  const { data: vehicles = [] } = useVehicles()
  const { data: mechanics = [] } = useMechanics()
  const { data: services = [] } = useServicesCatalog()

  const createAptMutation = useCreateAppointment()
  const updateAptMutation = useUpdateAppointment()
  const cancelAptMutation = useCancelAppointment()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    vehicle: '',
    vehicleId: '',
    plate: '',
    mechanic: '',
    mechanicId: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'Scheduled',
    notes: '',
  })

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultVeh = vehicles[0]
    const defaultMec = mechanics[0]
    const defaultSrv = services[0]

    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      vehicle: defaultVeh ? `${defaultVeh.brand} ${defaultVeh.model}` : '',
      vehicleId: defaultVeh ? defaultVeh.id : '',
      plate: defaultVeh ? defaultVeh.number : '',
      mechanic: defaultMec ? defaultMec.name : '',
      mechanicId: defaultMec ? defaultMec.id : '',
      service: defaultSrv ? defaultSrv.name : 'General Inspection',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      status: 'Scheduled',
      notes: '',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (apt) => {
    setSelectedApt(apt)
    setFormData({ ...apt })
    setIsEditOpen(true)
  }

  const handleOpenView = (apt) => {
    setSelectedApt(apt)
    setIsViewOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    createAptMutation.mutate(formData)
    setIsAddOpen(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedApt) return
    updateAptMutation.mutate({ id: selectedApt.id, data: formData })
    setIsEditOpen(false)
  }

  const handleCancelApt = async (id) => {
    cancelAptMutation.mutate(id)
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const calDays = getMiniCalendarDays(calYear, calMonth)
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  const appointmentsByDay = {}
  appointments.forEach((a) => {
    if (!a.date) return
    const parts = a.date.split('-')
    const day = parseInt(parts[2], 10)
    const m = parseInt(parts[1], 10) - 1
    const y = parseInt(parts[0], 10)
    if (m === calMonth && y === calYear) {
      appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1
    }
  })

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.plate.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || a.status === activeFilter
    const matchesDate = selectedDate
      ? a.date === `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
      : true
    return matchesSearch && matchesFilter && matchesDate
  })

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">Appointments Schedule</h1>
          <p className="text-xs text-app-muted mt-1">{appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length} upcoming appointments</p>
        </div>
        {can('appointments', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            Book Appointment
          </button>
        )}
      </div>

      {/* Calendar + Table Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        {/* Mini Calendar */}
        <div className="bg-app-card rounded-xl border border-app-border p-4 shadow-card transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }} className="p-1.5 rounded-md text-app-muted hover:bg-app-hover hover:text-app-text transition-colors">
              <CaretLeft size={14} weight="bold" />
            </button>
            <h3 className="text-xs font-semibold text-app-text">{monthName}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }} className="p-1.5 rounded-md text-app-muted hover:bg-app-hover hover:text-app-text transition-colors">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-app-muted uppercase">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = day === selectedDate
              const hasAppointments = appointmentsByDay[day]
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-md text-[11px] font-medium transition-colors
                    ${isSelected ? 'bg-app-accent text-app-accentText font-bold shadow-subtle' : isToday ? 'bg-app-accent/15 text-app-accent font-bold ring-1 ring-app-accent/40' : 'text-app-muted hover:bg-app-hover hover:text-app-text'}`}
                >
                  {day}
                  {hasAppointments && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-app-accent rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-3 w-full text-[10px] text-app-accent hover:underline transition-colors"
            >
              Clear date filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => {
              const count = filter === 'All'
                ? appointments.length
                : appointments.filter(a => a.status === filter).length
              const isActive = activeFilter === filter
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-app-accent text-app-accentText shadow-subtle'
                      : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  {filter}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="bg-app-card rounded-xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
            <div className="p-4 border-b border-app-border">
              <div className="relative max-w-md">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  placeholder="Search code, customer, plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading && appointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-app-muted">Loading appointments...</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                      <th className="px-6 py-3 font-semibold">Code</th>
                      <th className="px-6 py-3 font-semibold">Customer & Vehicle</th>
                      <th className="px-6 py-3 font-semibold hidden lg:table-cell">Service</th>
                      <th className="px-6 py-3 font-semibold hidden md:table-cell">Mechanic</th>
                      <th className="px-6 py-3 font-semibold">Date & Time</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-app-hover/60 transition-colors group">
                        <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{a.code}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-app-text">{a.customer}</p>
                          <p className="text-[10px] text-app-muted">{a.vehicle} · {a.plate}</p>
                        </td>
                        <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">{a.service}</td>
                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-app-muted">
                            <User size={13} className="text-app-accent" />
                            {a.mechanic}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-app-text flex items-center gap-1.5">
                            <CalendarBlank size={13} className="text-app-accent" />
                            {a.date}
                          </p>
                          <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                            <Clock size={11} />
                            {a.time}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenView(a)}
                              className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                              title="View appointment"
                            >
                              <Eye size={15} />
                            </button>
                            {can('appointments', 'update') && (
                              <button
                                onClick={() => handleOpenEdit(a)}
                                className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                                title="Edit appointment"
                              >
                                <PencilSimple size={15} />
                              </button>
                            )}
                            {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                              <button
                                onClick={() => handleCancelApt(a.id)}
                                className="p-1.5 rounded-md text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                                title="Cancel appointment"
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Book New Service Appointment">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Customer *</label>
              <select
                value={formData.customer}
                onChange={(e) => {
                  const c = customers.find(x => x.name === e.target.value)
                  setFormData({ ...formData, customer: e.target.value, customerId: c ? c.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Vehicle *</label>
              <select
                value={formData.plate}
                onChange={(e) => {
                  const v = vehicles.find(x => x.number === e.target.value)
                  setFormData({
                    ...formData,
                    plate: e.target.value,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                  })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.number}>{v.number} - {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Requested Service *</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} (~${s.estimatedCost})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Assigned Mechanic *</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find(x => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>{m.name} ({m.specialization})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Customer Complaint / Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Engine rattling at high speed"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Update Appointment: ${selectedApt?.code}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Assigned Mechanic</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find(x => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* View Appointment Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Appointment Card">
        {selectedApt && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-lg border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedApt.code}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedApt.service}</h3>
              </div>
              <StatusBadge status={selectedApt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> Customer
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Car size={12} /> Vehicle
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedApt.plate}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Toolbox size={12} /> Assigned Mechanic
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.mechanic}</p>
              </div>
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Clock size={12} /> Schedule
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.date} at {selectedApt.time}</p>
              </div>
            </div>

            {selectedApt.notes && (
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Customer Notes</p>
                <p className="text-app-text mt-1">{selectedApt.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
