import { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, CalendarBlank, Clock, User, CaretLeft, CaretRight, Car, Toolbox, XCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment } from '../../hooks/useAppointments'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import { Modal, StatusBadge, EmptyState, TableSkeleton, LoadingButton } from '../../components/ui'

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
  const { t } = useTranslation()
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
    notes: '',
    status: 'Scheduled',
  })

  const handleOpenAdd = () => {
    const defaultCust = customers[0]
    const defaultVeh = vehicles[0]
    const defaultMec = mechanics[0]
    const defaultSvc = services[0]

    setFormData({
      customer: defaultCust ? defaultCust.name : '',
      customerId: defaultCust ? defaultCust.id : '',
      vehicle: defaultVeh ? `${defaultVeh.brand} ${defaultVeh.model}` : '',
      vehicleId: defaultVeh ? defaultVeh.id : '',
      plate: defaultVeh ? defaultVeh.number : '',
      mechanic: defaultMec ? defaultMec.name : '',
      mechanicId: defaultMec ? defaultMec.id : '',
      service: defaultSvc ? defaultSvc.name : '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      notes: '',
      status: 'Scheduled',
    })
    setIsAddOpen(true)
  }

  const handleOpenEdit = (apt) => {
    setSelectedApt(apt)
    setFormData({
      customer: apt.customer,
      customerId: apt.customerId,
      vehicle: apt.vehicle,
      vehicleId: apt.vehicleId,
      plate: apt.plate,
      mechanic: apt.mechanic,
      mechanicId: apt.mechanicId,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      notes: apt.notes || '',
      status: apt.status,
    })
    setIsEditOpen(true)
  }

  const handleOpenView = (apt) => {
    setSelectedApt(apt)
    setIsViewOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    createAptMutation.mutate(formData, {
      onSuccess: () => setIsAddOpen(false),
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedApt) return
    updateAptMutation.mutate(
      { id: selectedApt.id, data: formData },
      { onSuccess: () => setIsEditOpen(false) }
    )
  }

  const handleCancelApt = (id) => {
    if (window.confirm(t('appointments.confirmDelete'))) {
      cancelAptMutation.mutate(id)
    }
  }

  // Filter pipeline
  const filtered = appointments.filter((a) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (a?.code || '').toLowerCase().includes(q) ||
      (a?.customer || '').toLowerCase().includes(q) ||
      (a?.vehicle || '').toLowerCase().includes(q) ||
      (a?.plate || '').toLowerCase().includes(q) ||
      (a?.mechanic || '').toLowerCase().includes(q)

    const matchesStatus = activeFilter === 'All' || a.status === activeFilter

    let matchesDate = true
    if (selectedDate) {
      const targetDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
      matchesDate = a.date === targetDateStr
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Mini calendar data
  const calDays = getMiniCalendarDays(calYear, calMonth)
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Count per day in active month
  const appointmentsByDay = {}
  appointments.forEach((a) => {
    if (!a.date) return
    const [y, m, d] = a.date.split('-').map(Number)
    if (y === calYear && m === calMonth + 1) {
      appointmentsByDay[d] = (appointmentsByDay[d] || 0) + 1
    }
  })

  return (
    <div className="space-y-6 font-sans text-app-text animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.appointmentsSchedule')}</h1>
          <p className="text-xs text-app-muted mt-1">{t('appointments.subtitle')}</p>
        </div>
        {can('appointments', 'create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle"
          >
            <Plus size={16} weight="bold" />
            {t('appointments.newAppointment')}
          </button>
        )}
      </div>

      {/* Grid: Left Calendar + Right Main Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Calendar Picker */}
        <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card self-start transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11)
                  setCalYear(calYear - 1)
                } else setCalMonth(calMonth - 1)
              }}
              className="p-1.5 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <h3 className="text-xs font-semibold text-app-text">{monthName}</h3>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0)
                  setCalYear(calYear + 1)
                } else setCalMonth(calMonth + 1)
              }}
              className="p-1.5 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-app-muted uppercase">
                {d}
              </span>
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
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium transition-colors
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
              {t('common.filter')} (Clear date filter)
            </button>
          )}
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => {
              const count =
                filter === 'All'
                  ? appointments.length
                  : appointments.filter((a) => a.status === filter).length
              const isActive = activeFilter === filter
              const translatedLabel = filter === 'All' ? t('common.all') : t(`status.${filter}`, filter)
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-app-accent text-app-accentText shadow-subtle'
                      : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  {translatedLabel}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-black/20 text-app-accentText font-semibold' : 'bg-app-hover text-app-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
            <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  placeholder={t('common.quickSearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                />
              </div>
              {(searchQuery || activeFilter !== 'All' || selectedDate) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setActiveFilter('All')
                    setSelectedDate(null)
                  }}
                  className="text-xs text-app-muted hover:text-app-text px-2 py-1 transition-colors"
                >
                  {t('common.filter')} ({t('common.cancel')})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              {isLoading && appointments.length === 0 ? (
                <TableSkeleton rows={6} columns={7} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={t('common.noRecords')}
                  description={
                    searchQuery || activeFilter !== 'All' || selectedDate
                      ? t('common.noRecords')
                      : t('common.noData')
                  }
                  actionText={searchQuery || activeFilter !== 'All' || selectedDate ? t('common.filter') : undefined}
                  onAction={
                    searchQuery || activeFilter !== 'All' || selectedDate
                      ? () => {
                          setSearchQuery('')
                          setActiveFilter('All')
                          setSelectedDate(null)
                        }
                      : undefined
                  }
                />
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                      <th className="px-6 py-3 font-semibold">{t('appointments.dateFilter')} #</th>
                      <th className="px-6 py-3 font-semibold">{t('appointments.customer')} & {t('appointments.vehicle')}</th>
                      <th className="px-6 py-3 font-semibold hidden lg:table-cell">{t('appointments.service')}</th>
                      <th className="px-6 py-3 font-semibold hidden md:table-cell">{t('repairJobs.technician')}</th>
                      <th className="px-6 py-3 font-semibold">{t('common.date')} & {t('common.time')}</th>
                      <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                      <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-app-hover/60 transition-colors group">
                        <td className="px-6 py-3.5 font-mono font-semibold text-app-accent">{a.code}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-app-text">{a.customer}</p>
                          <p className="text-[10px] text-app-muted">
                            {a.vehicle} · {a.plate}
                          </p>
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
                              className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                              title={t('common.view')}
                            >
                              <Eye size={15} />
                            </button>
                            {can('appointments', 'update') && (
                              <button
                                onClick={() => handleOpenEdit(a)}
                                className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                                title={t('common.edit')}
                              >
                                <PencilSimple size={15} />
                              </button>
                            )}
                            {can('appointments', 'delete') && a.status !== 'Cancelled' && a.status !== 'Completed' && (
                              <button
                                onClick={() => handleCancelApt(a.id)}
                                className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-app-hover transition-colors"
                                title={t('common.delete')}
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('appointments.createAppointment')}>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.customer')} *</label>
              <select
                value={formData.customer}
                onChange={(e) => {
                  const c = customers.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, customer: e.target.value, customerId: c ? c.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</label>
              <select
                value={formData.plate}
                onChange={(e) => {
                  const v = vehicles.find((x) => x.number === e.target.value)
                  setFormData({
                    ...formData,
                    plate: e.target.value,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                  })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.number}>
                    {v.number} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.service')} *</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} (~${s.estimatedCost})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')} *</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.date')} *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.time')} *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('appointments.notes')}</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Engine rattling at high speed"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={createAptMutation.isPending}>
              {t('appointments.createAppointment')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('appointments.editAppointment')}: ${selectedApt?.code}`}>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                <option value="Scheduled">{t('status.Scheduled')}</option>
                <option value="Confirmed">{t('status.Confirmed')}</option>
                <option value="In Progress">{t('status.In Progress')}</option>
                <option value="Completed">{t('status.Completed')}</option>
                <option value="Cancelled">{t('status.Cancelled')}</option>
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <select
                value={formData.mechanic}
                onChange={(e) => {
                  const m = mechanics.find((x) => x.name === e.target.value)
                  setFormData({ ...formData, mechanic: e.target.value, mechanicId: m ? m.id : '' })
                }}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-semibold"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.date')}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.time')}</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('appointments.notes')}</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium"
            >
              {t('common.cancel')}
            </button>
            <LoadingButton type="submit" loading={updateAptMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* View Appointment Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={t('common.details')}>
        {selectedApt && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-xl border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedApt.code}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedApt.service}</h3>
              </div>
              <StatusBadge status={selectedApt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <User size={12} /> {t('appointments.customer')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Car size={12} /> {t('appointments.vehicle')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedApt.plate}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Toolbox size={12} /> {t('repairJobs.technician')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.mechanic}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold flex items-center gap-1">
                  <Clock size={12} /> {t('common.date')} & {t('common.time')}
                </p>
                <p className="font-semibold text-app-text mt-0.5">
                  {selectedApt.date} at {selectedApt.time}
                </p>
              </div>
            </div>

            {selectedApt.notes && (
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.notes')}</p>
                <p className="text-app-text mt-1">{selectedApt.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
