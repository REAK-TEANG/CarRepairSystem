import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Eye,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  XCircle,
  Bell,
  ChatCircleDots,
  CalendarCheck,
  Trash,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment } from '../../hooks/useAppointments'
import { useServiceReminders, useCreateServiceReminder, useUpdateServiceReminder, useDeleteServiceReminder } from '../../hooks/useServiceReminders'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
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
  const { addToast } = useToast()

  const { data: appointments = [], isLoading } = useAppointments()
  const { data: reminders = [], isLoading: remLoading } = useServiceReminders()
  const { data: customers = [] } = useCustomers()
  const { data: vehicles = [] } = useVehicles()
  const { data: mechanics = [] } = useMechanics()
  const { data: services = [] } = useServicesCatalog()

  const createAptMutation = useCreateAppointment()
  const updateAptMutation = useUpdateAppointment()
  const cancelAptMutation = useCancelAppointment()
  const createReminderMutation = useCreateServiceReminder()
  const updateReminderMutation = useUpdateServiceReminder()
  const deleteReminderMutation = useDeleteServiceReminder()

  const [activeTab, setActiveTab] = useState('calendar') // 'calendar' | 'reminders'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState(null)

  // Appointment Form
  const [formData, setFormData] = useState(() => ({
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
  }))

  // Reminder Form
  const [reminderForm, setReminderForm] = useState(() => ({
    customerId: '',
    vehicleId: '',
    serviceType: 'Routine Oil & Filter Change (5,000 km)',
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueOdometer: '',
    notes: '',
  }))

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

  const handleBookFromReminder = (rem) => {
    setFormData({
      customer: rem.customer,
      customerId: rem.customerId,
      vehicle: rem.vehicle,
      vehicleId: rem.vehicleId,
      plate: rem.plate,
      mechanic: mechanics[0]?.name || '',
      mechanicId: mechanics[0]?.id || '',
      service: rem.serviceType,
      date: rem.dueDate || new Date().toISOString().split('T')[0],
      time: '09:00',
      notes: `Booked from maintenance reminder: ${rem.serviceType}`,
      status: 'Confirmed',
    })
    updateReminderMutation.mutate({ id: rem.id, data: { status: 'Booked' } })
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

  const handleCreateReminder = async (e) => {
    e.preventDefault()
    if (!reminderForm.customerId || !reminderForm.vehicleId) return
    createReminderMutation.mutate(reminderForm, {
      onSuccess: () => {
        setIsAddReminderOpen(false)
        setReminderForm({
          customerId: '',
          vehicleId: '',
          serviceType: 'Routine Oil & Filter Change (5,000 km)',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueOdometer: '',
          notes: '',
        })
      },
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
  const today = new Date()
  const calDays = getMiniCalendarDays(calYear, calMonth)
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

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
        <div className="flex items-center gap-2">
          {activeTab === 'reminders' ? (
            <button
              onClick={() => {
                setReminderForm({
                  customerId: customers[0]?.id || '',
                  vehicleId: vehicles[0]?.id || '',
                  serviceType: 'Routine Oil & Filter Change (5,000 km)',
                  dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  dueOdometer: '',
                  notes: '',
                })
                setIsAddReminderOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-subtle cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Schedule Service Reminder</span>
            </button>
          ) : (
            can('appointments', 'create') && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-xl transition-colors shadow-subtle cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                {t('appointments.newAppointment')}
              </button>
            )
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-app-border pb-3">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <CalendarBlank size={16} weight="bold" />
          <span>Appointments & Calendar Schedule</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{appointments.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Bell size={16} weight="bold" />
          <span>Maintenance Reminders (CRM)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{reminders.length}</span>
        </button>
      </div>

      {activeTab === 'calendar' ? (
        /* Grid: Left Calendar + Right Main Table */
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
                className="p-1.5 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors cursor-pointer"
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
                const isToday =
                  day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
                const isSelected = selectedDate === day
                const count = appointmentsByDay[day] || 0

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`h-8 rounded-lg flex flex-col items-center justify-center relative text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-app-accent text-app-accentText font-bold shadow-subtle'
                        : isToday
                        ? 'border border-app-accent text-app-accent font-bold'
                        : 'hover:bg-app-hover text-app-text'
                    }`}
                  >
                    <span>{day}</span>
                    {count > 0 && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
                    )}
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="mt-3 pt-3 border-t border-app-border flex items-center justify-between text-xs">
                <span className="text-app-muted">
                  Filtered: {calYear}-{String(calMonth + 1).padStart(2, '0')}-{String(selectedDate).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-app-accent hover:underline font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Right Main Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {statusFilters.map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeFilter === st
                      ? 'bg-app-accent text-app-accentText shadow-subtle'
                      : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  {st === 'All' ? t('common.all') : t(`status.${st}`, st)}
                </button>
              ))}
            </div>

            <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
              <div className="p-4 border-b border-app-border">
                <div className="relative max-w-md">
                  <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                  <input
                    type="text"
                    placeholder={t('common.quickSearch')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading && appointments.length === 0 ? (
                  <TableSkeleton rows={6} columns={7} />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    title={t('common.noRecords')}
                    description={t('common.noData')}
                    actionText={searchQuery || activeFilter !== 'All' ? t('common.filter') : undefined}
                    onAction={
                      searchQuery || activeFilter !== 'All'
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
                        <th className="px-6 py-3 font-semibold">{t('appointments.code')}</th>
                        <th className="px-6 py-3 font-semibold">{t('appointments.customer')}</th>
                        <th className="px-6 py-3 font-semibold">{t('appointments.vehicle')}</th>
                        <th className="px-6 py-3 hidden md:table-cell font-semibold">{t('appointments.service')}</th>
                        <th className="px-6 py-3 hidden lg:table-cell font-semibold">{t('common.date')} / {t('common.time')}</th>
                        <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                        <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {filtered.map((apt) => (
                        <tr key={apt.id} className="hover:bg-app-hover/60 transition-colors group">
                          <td className="px-6 py-3.5 font-mono font-bold text-app-accent">{apt.code}</td>
                          <td className="px-6 py-3.5 font-semibold text-app-text">{apt.customer}</td>
                          <td className="px-6 py-3.5">
                            <p className="font-semibold text-app-text">{apt.vehicle}</p>
                            <p className="text-[10px] text-app-muted font-mono">{apt.plate}</p>
                          </td>
                          <td className="px-6 py-3.5 text-app-muted hidden md:table-cell">{apt.service}</td>
                          <td className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                            <span className="font-medium text-app-text">{apt.date}</span>
                            <span className="text-[10px] text-app-muted block">{apt.time}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={apt.status} />
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenView(apt)}
                                className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                                title={t('common.view')}
                              >
                                <Eye size={15} />
                              </button>
                              {can('appointments', 'update') && (
                                <button
                                  onClick={() => handleOpenEdit(apt)}
                                  className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                                  title={t('common.edit')}
                                >
                                  <PencilSimple size={15} />
                                </button>
                              )}
                              {can('appointments', 'delete') && apt.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleCancelApt(apt.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title={t('appointments.cancelAppointment')}
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
      ) : (
        /* Maintenance Reminders (Service CRM) Tab */
        <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden space-y-3">
          <div className="p-4 border-b border-app-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-app-text flex items-center gap-2">
                <Bell size={16} className="text-amber-500" />
                Customer Maintenance Reminders & Recurring Service CRM
              </h2>
              <p className="text-[11px] text-app-muted mt-0.5">
                Automatically tracks when regular maintenance (oil, brakes, fluid flushes) is due to retain customers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {remLoading && reminders.length === 0 ? (
              <TableSkeleton rows={5} columns={6} />
            ) : reminders.length === 0 ? (
              <EmptyState
                title="No maintenance reminders scheduled"
                description="Click 'Schedule Service Reminder' to set an oil change or service recall alert for a customer."
              />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                    <th className="px-6 py-3 font-semibold">Customer & Contact</th>
                    <th className="px-6 py-3 font-semibold">Vehicle</th>
                    <th className="px-6 py-3 font-semibold">Service Type</th>
                    <th className="px-6 py-3 font-semibold">Due Date / Mileage</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {reminders.map((rem) => (
                    <tr key={rem.id} className="hover:bg-app-hover/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.customer}</p>
                        <p className="text-[10px] text-app-muted">{rem.customerPhone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.vehicle}</p>
                        <p className="text-[10px] font-mono text-app-accent font-bold">{rem.plate}</p>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-app-text">{rem.serviceType}</td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.dueDate || 'Upon mileage'}</p>
                        {rem.dueOdometer && (
                          <p className="text-[10px] text-app-muted font-mono">Target: {rem.dueOdometer} km</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            rem.status === 'Booked'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : rem.status === 'Notified'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {rem.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Notification */}
                          <button
                            onClick={() => {
                              const msg = `Hello ${rem.customer}, your vehicle ${rem.vehicle} (${rem.plate}) is due for ${rem.serviceType} at CarRepair Workshop. Reply to this message or call us to reserve your service slot!`
                              navigator.clipboard?.writeText(msg)
                              updateReminderMutation.mutate({ id: rem.id, data: { status: 'Notified' } })
                              addToast('Reminder text copied & status updated to Notified!', 'success')
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                            title="Copy SMS / WhatsApp text"
                          >
                            <ChatCircleDots size={13} />
                            <span>Notify</span>
                          </button>

                          {/* 1-Click Book Appointment */}
                          <button
                            onClick={() => handleBookFromReminder(rem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-app-accent hover:bg-app-accentHover text-app-accentText text-[11px] font-semibold transition-colors shadow-subtle cursor-pointer"
                            title="Book appointment from this reminder"
                          >
                            <CalendarCheck size={13} weight="bold" />
                            <span>Book</span>
                          </button>

                          <button
                            onClick={() => deleteReminderMutation.mutate(rem.id)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete reminder"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Schedule Custom Reminder Modal */}
      <Modal isOpen={isAddReminderOpen} onClose={() => setIsAddReminderOpen(false)} title="Schedule Maintenance Reminder">
        <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Customer *</label>
              <select
                required
                value={reminderForm.customerId}
                onChange={(e) => setReminderForm({ ...reminderForm, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Vehicle *</label>
              <select
                required
                value={reminderForm.vehicleId}
                onChange={(e) => setReminderForm({ ...reminderForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.number} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Maintenance Service Type *</label>
            <input
              type="text"
              required
              value={reminderForm.serviceType}
              onChange={(e) => setReminderForm({ ...reminderForm, serviceType: e.target.value })}
              placeholder="e.g. 5,000 km Oil & Filter Service or Brake Pad Inspection"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={reminderForm.dueDate}
                onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Due Mileage (km)</label>
              <input
                type="number"
                value={reminderForm.dueOdometer}
                onChange={(e) => setReminderForm({ ...reminderForm, dueOdometer: e.target.value })}
                placeholder="e.g. 60000"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text font-mono focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddReminderOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton type="submit" loading={createReminderMutation.isPending}>
              Schedule Reminder
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Create Appointment Modal */}
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
                    {c.name}
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
                    {s.name} (${s.estimatedCost})
                  </option>
                ))}
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
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer"
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
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.customer')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-xl border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.vehicle')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedApt.plate}</p>
              </div>
            </div>

            <div className="p-3 bg-app-input rounded-xl border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.date')} & {t('common.time')}</p>
              <p className="font-semibold text-app-text mt-0.5">{selectedApt.date} at {selectedApt.time}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
