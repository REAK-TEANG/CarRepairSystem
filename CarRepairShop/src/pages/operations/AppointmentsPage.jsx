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
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal, StatusBadge, EmptyState, TableSkeleton, LoadingButton, Button, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooterBar, SearchableSelect, Input, Textarea } from '../../components/ui'

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

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useAppointments({ page, limit: 10, search: debouncedSearch, status: activeFilter })
  const appointments = Array.isArray(response) ? response : (response?.data || [])
  const pagination = response?.pagination || null
  const totalCount = pagination ? pagination.total : appointments.length
  const totalPages = pagination ? pagination.totalPages : 1

  const { data: rawReminders = [], isLoading: remLoading } = useServiceReminders()
  const { data: rawCustomers = [] } = useCustomers({ all: true })
  const { data: rawVehicles = [] } = useVehicles({ all: true })
  const { data: rawMechanics = [] } = useMechanics({ all: true })
  const { data: rawServices = [] } = useServicesCatalog({ all: true })

  const reminders = Array.isArray(rawReminders) ? rawReminders : (rawReminders?.data || [])
  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])
  const vehicles = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles?.data || [])
  const mechanics = Array.isArray(rawMechanics) ? rawMechanics : (rawMechanics?.data || [])
  const services = Array.isArray(rawServices) ? rawServices : (rawServices?.data || [])

  const createAptMutation = useCreateAppointment()
  const updateAptMutation = useUpdateAppointment()
  const cancelAptMutation = useCancelAppointment()
  const createReminderMutation = useCreateServiceReminder()
  const updateReminderMutation = useUpdateServiceReminder()
  const deleteReminderMutation = useDeleteServiceReminder()

  const [activeTab, setActiveTab] = useState('calendar') // 'calendar' | 'reminders'
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
    setIsViewOpen(false); setIsEditOpen(true)
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
    if (!selectedDate) return true
    const targetDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
    return a.date === targetDateStr
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
    <div className="space-y-4 sm:space-y-5 font-sans text-app-text">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.appointmentsSchedule')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {activeTab === 'calendar' ? totalCount : reminders.length}
          </span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>New Reminder</span>
            </button>
          ) : (
            can('appointments', 'create') && (
              <Button
                onClick={handleOpenAdd}
                size="sm"
              >
                <Plus size={14} weight="bold" />
                <span>{t('appointments.newAppointment')}</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 border-b border-app-border pb-2.5">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <CalendarBlank size={15} weight="bold" />
          <span>Appointments</span>
          <span className="text-[10px] font-mono text-app-muted">{appointments.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-app-card text-app-text border border-app-border shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Bell size={15} weight="bold" />
          <span>Reminders</span>
          <span className="text-[10px] font-mono text-app-muted">{reminders.length}</span>
        </button>
      </div>

      {activeTab === 'calendar' ? (
        /* Grid: Left Calendar + Right Main Table */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Calendar Picker */}
          <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card self-start transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11)
                    setCalYear(calYear - 1)
                  } else setCalMonth(calMonth - 1)
                }}
                className="p-1.5 rounded-sm text-app-muted hover:bg-app-hover active:scale-[0.98] hover:text-app-text transition-colors cursor-pointer"
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
                className="p-1.5 rounded-sm text-app-muted hover:bg-app-hover active:scale-[0.98] hover:text-app-text transition-colors cursor-pointer"
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
                    className={`h-8 rounded-sm flex flex-col items-center justify-center relative text-xs font-medium transition-colors cursor-pointer ${
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
          <div className="lg:col-span-3 space-y-2.5">
            {/* Integrated Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {statusFilters.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setActiveFilter(st)
                      setPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeFilter === st
                        ? 'bg-app-accent text-app-accentText font-semibold'
                        : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                    }`}
                  >
                    {st === 'All' ? t('common.all') : t(`status.${st}`, st)}
                  </button>
                ))}
              </div>

              {/* Inline Search */}
              <div className="relative w-full sm:w-60">
                <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t('common.quickSearch')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                />
              </div>
            </div>

            {isLoading && appointments.length === 0 ? (
              <TableSkeleton rows={6} columns={7} />
            ) : filtered.length === 0 ? (
              <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
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
                          setPage(1)
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('appointments.code')}</TableHead>
                    <TableHead>{t('appointments.customer')}</TableHead>
                    <TableHead>{t('appointments.vehicle')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('appointments.service')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('common.date')} / {t('common.time')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-mono font-bold text-app-accent">{apt.code}</TableCell>
                      <TableCell className="font-semibold text-app-text">{apt.customer}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-app-text">{apt.vehicle}</p>
                        <p className="text-[10px] text-app-muted font-mono">{apt.plate}</p>
                      </TableCell>
                      <TableCell className="text-app-muted hidden md:table-cell">{apt.service}</TableCell>
                      <TableCell className="text-app-muted hidden lg:table-cell">
                        <span className="font-medium text-app-text">{apt.date}</span>
                        <span className="text-[10px] text-app-muted block">{apt.time}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={apt.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenView(apt)}
                            className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                            title={t('common.view')}
                          >
                            <Eye size={14} />
                          </button>
                          {can('appointments', 'update') && (
                            <button
                              onClick={() => handleOpenEdit(apt)}
                              className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                              title={t('common.edit')}
                            >
                              <PencilSimple size={14} />
                            </button>
                          )}
                          {can('appointments', 'delete') && apt.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancelApt(apt.id)}
                              className="p-1 rounded-sm text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={t('appointments.cancelAppointment')}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooterBar
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={10}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </Table>
            )}
          </div>
        </div>
      ) : (
        /* Maintenance Reminders (Service CRM) Tab */
        <div className="bg-app-card rounded-sm border border-app-border shadow-card overflow-hidden space-y-3">
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

            {remLoading && reminders.length === 0 ? (
              <TableSkeleton rows={5} columns={6} />
            ) : reminders.length === 0 ? (
              <EmptyState
                title="No maintenance reminders scheduled"
                description="Click 'Schedule Service Reminder' to set an oil change or service recall alert for a customer."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer & Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Due Date / Mileage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((rem) => (
                    <TableRow key={rem.id}>
                      <TableCell>
                        <p className="font-semibold text-app-text">{rem.customer}</p>
                        <p className="text-[10px] text-app-muted">{rem.customerPhone || 'No phone'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-app-text">{rem.vehicle}</p>
                        <p className="text-[10px] font-mono text-app-accent font-bold">{rem.plate}</p>
                      </TableCell>
                      <TableCell className="font-medium text-app-text">{rem.serviceType}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-app-text">{rem.dueDate || 'Upon mileage'}</p>
                        {rem.dueOdometer && (
                          <p className="text-[10px] text-app-muted font-mono">Target: {rem.dueOdometer} km</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
                            rem.status === 'Booked'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : rem.status === 'Notified'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {rem.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Notification */}
                          <button
                            onClick={() => {
                              const msg = `Hello ${rem.customer}, your vehicle ${rem.vehicle} (${rem.plate}) is due for ${rem.serviceType} at CarRepair Workshop. Reply to this message or call us to reserve your service slot!`
                              navigator.clipboard?.writeText(msg)
                              updateReminderMutation.mutate({ id: rem.id, data: { status: 'Notified' } })
                              addToast('Reminder text copied & status updated to Notified!', 'success')
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                            title="Copy SMS / WhatsApp text"
                          >
                            <ChatCircleDots size={13} />
                            <span>Notify</span>
                          </button>

                          {/* 1-Click Book Appointment */}
                          <button
                            onClick={() => handleBookFromReminder(rem)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-app-accent hover:bg-app-accentHover active:scale-[0.98] text-app-accentText text-[11px] font-semibold transition-colors shadow-subtle cursor-pointer"
                            title="Book appointment from this reminder"
                          >
                            <CalendarCheck size={13} weight="bold" />
                            <span>Book</span>
                          </button>

                          <button
                            onClick={() => deleteReminderMutation.mutate(rem.id)}
                            className="p-1 rounded-sm text-app-muted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete reminder"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooterBar totalCount={reminders.length} currentCount={reminders.length} />
              </Table>
            )}
        </div>
      )}

      {/* Schedule Custom Reminder Modal */}
      <Modal isOpen={isAddReminderOpen} onClose={() => setIsAddReminderOpen(false)} title="Schedule Maintenance Reminder">
        <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Customer *</label>
              <SearchableSelect
                value={reminderForm.customerId}
                onChange={(val) => setReminderForm({ ...reminderForm, customerId: val })}
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: c.phone ? `Phone: ${c.phone}` : undefined,
                }))}
                placeholder="-- Choose Customer --"
                searchPlaceholder="Search customer by name or phone..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Vehicle *</label>
              <SearchableSelect
                value={reminderForm.vehicleId}
                onChange={(val) => setReminderForm({ ...reminderForm, vehicleId: val })}
                options={vehicles.map((v) => ({
                  value: v.id,
                  label: `${v.number} - ${v.brand} ${v.model}`,
                  sublabel: v.owner ? `Owner: ${v.owner}` : undefined,
                }))}
                placeholder="-- Choose Vehicle --"
                searchPlaceholder="Search vehicle by plate or model..."
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Maintenance Service Type *</label>
            <Input
              type="text"
              required
              value={reminderForm.serviceType}
              onChange={(e) => setReminderForm({ ...reminderForm, serviceType: e.target.value })}
              placeholder="e.g. 5,000 km Oil & Filter Service or Brake Pad Inspection"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">Due Date</label>
              <Input
                type="date"
                value={reminderForm.dueDate}
                onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">Due Mileage (km)</label>
              <Input
                type="number"
                value={reminderForm.dueOdometer}
                onChange={(e) => setReminderForm({ ...reminderForm, dueOdometer: e.target.value })}
                placeholder="e.g. 60000"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddReminderOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
              <SearchableSelect
                value={formData.customer}
                onChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, customer: val, customerId: c ? c.id : '' })
                }}
                options={customers.map((c) => ({
                  value: c.name,
                  label: c.name,
                  sublabel: c.phone ? `Phone: ${c.phone}` : undefined,
                }))}
                placeholder="Select customer..."
                searchPlaceholder="Search customer by name or phone..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</label>
              <SearchableSelect
                value={formData.plate}
                onChange={(val) => {
                  const v = vehicles.find((x) => x.number === val)
                  setFormData({
                    ...formData,
                    plate: val,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                  })
                }}
                options={vehicles.map((v) => ({
                  value: v.number,
                  label: `${v.number} - ${v.brand} ${v.model}`,
                  sublabel: v.owner ? `Owner: ${v.owner}` : undefined,
                }))}
                placeholder="Select vehicle..."
                searchPlaceholder="Search vehicle by plate or model..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('appointments.service')} *</label>
              <SearchableSelect
                value={formData.service}
                onChange={(val) => setFormData({ ...formData, service: val })}
                options={services.map((s) => ({
                  value: s.name,
                  label: s.name,
                  sublabel: s.estimatedCost ? `$${Number(s.estimatedCost).toFixed(2)}` : undefined,
                }))}
                placeholder="Select service..."
                searchPlaceholder="Search service..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <SearchableSelect
                value={formData.mechanic}
                onChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
                options={mechanics.map((m) => ({
                  value: m.name,
                  label: m.name,
                  sublabel: m.specialization ? `Specialization: ${m.specialization}` : undefined,
                }))}
                placeholder="Select technician..."
                searchPlaceholder="Search technician..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.date')} *</label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.time')} *</label>
              <Input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">{t('appointments.notes')}</label>
            <Textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Engine rattling at high speed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
              <SearchableSelect
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'Scheduled', label: t('status.Scheduled') },
                  { value: 'Confirmed', label: t('status.Confirmed') },
                  { value: 'In Progress', label: t('status.In Progress') },
                  { value: 'Completed', label: t('status.Completed') },
                  { value: 'Cancelled', label: t('status.Cancelled') },
                ]}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</label>
              <SearchableSelect
                value={formData.mechanic}
                onChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
                options={mechanics.map((m) => ({
                  value: m.name,
                  label: m.name,
                  sublabel: m.specialization ? `Specialization: ${m.specialization}` : undefined,
                }))}
                placeholder="Select technician..."
                searchPlaceholder="Search technician..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.date')}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1">{t('common.time')}</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer shadow-xs"
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
            <div className="flex items-center justify-between p-3 bg-app-hover/50 rounded-sm border border-app-border">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedApt.code}</p>
                <h3 className="text-sm font-bold text-app-text mt-0.5">{selectedApt.service}</h3>
              </div>
              <StatusBadge status={selectedApt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.customer')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.customer}</p>
              </div>
              <div className="p-3 bg-app-input rounded-sm border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">{t('appointments.vehicle')}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedApt.vehicle}</p>
                <p className="text-[10px] font-mono text-app-muted">{selectedApt.plate}</p>
              </div>
            </div>

            <div className="p-3 bg-app-input rounded-sm border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">{t('common.date')} & {t('common.time')}</p>
              <p className="font-semibold text-app-text mt-0.5">{selectedApt.date} at {selectedApt.time}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
