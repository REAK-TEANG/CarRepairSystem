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
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment } from '@/hooks/useAppointments'
import { useServiceReminders, useCreateServiceReminder, useUpdateServiceReminder, useDeleteServiceReminder } from '@/hooks/useServiceReminders'
import { useCustomers } from '@/hooks/useCustomers'
import { useVehicles } from '@/hooks/useVehicles'
import { useMechanics } from '@/hooks/useMechanics'
import { useServicesCatalog } from '@/hooks/useServicesCatalog'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { StatusBadge, EmptyState, TableSkeleton, LoadingButton } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    <div className="space-y-4 font-sans text-app-text animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.appointmentsSchedule')}</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-app-hover text-app-muted border border-app-border">
            {appointments.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'reminders' ? (
            <Button
              size="sm"
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
              className="inline-flex items-center gap-1.5"
            >
              <Plus size={15} weight="bold" />
              <span>New Reminder</span>
            </Button>
          ) : (
            can('appointments', 'create') && (
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5"
              >
                <Plus size={15} weight="bold" />
                {t('appointments.newAppointment')}
              </Button>
            )
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-app-border pb-3">
        <Button
          variant={activeTab === 'calendar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('calendar')}
          className="gap-2"
        >
          <CalendarBlank size={15} weight="bold" />
          <span>Appointments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{appointments.length}</span>
        </Button>

        <Button
          variant={activeTab === 'reminders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('reminders')}
          className="gap-2"
        >
          <Bell size={15} weight="bold" />
          <span>Reminders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{reminders.length}</span>
        </Button>
      </div>

      {activeTab === 'calendar' ? (
        /* Grid: Left Calendar + Right Main Table */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Calendar Picker */}
          <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card self-start transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11)
                    setCalYear(calYear - 1)
                  } else setCalMonth(calMonth - 1)
                }}
                className="h-7 w-7 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text"
              >
                <CaretLeft size={14} weight="bold" />
              </Button>
              <h3 className="text-xs font-semibold text-app-text">{monthName}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0)
                    setCalYear(calYear + 1)
                  } else setCalMonth(calMonth + 1)
                }}
                className="h-7 w-7 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text"
              >
                <CaretRight size={14} weight="bold" />
              </Button>
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
                  <Button
                    key={day}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`h-8 w-full p-0 flex flex-col items-center justify-center relative text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-app-accent text-app-accentText font-bold shadow-subtle hover:bg-app-accent/90'
                        : isToday
                        ? 'border border-app-accent text-app-accent font-bold hover:bg-app-hover'
                        : 'hover:bg-app-hover text-app-text'
                    }`}
                  >
                    <span>{day}</span>
                    {count > 0 && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
                    )}
                  </Button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="mt-3 pt-3 border-t border-app-border flex items-center justify-between text-xs">
                <span className="text-app-muted">
                  Filtered: {calYear}-{String(calMonth + 1).padStart(2, '0')}-{String(selectedDate).padStart(2, '0')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="text-app-accent hover:text-app-accentHover h-auto p-0 font-medium hover:underline hover:bg-transparent"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Right Main Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {statusFilters.map((st) => (
                <Button
                  key={st}
                  variant={activeFilter === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer h-auto ${
                    activeFilter === st
                      ? 'bg-app-accent text-app-accentText shadow-subtle hover:bg-app-accentHover'
                      : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  {st === 'All' ? t('common.all') : t(`status.${st}`, st)}
                </Button>
              ))}
            </div>

            <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-200">
              <div className="p-3.5 border-b border-app-border">
                <div className="relative max-w-sm">
                  <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={t('common.quickSearch')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
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
                  <Table className="w-full text-xs">
                    <TableHeader>
                      <TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-transparent">
                        <TableHead className="px-6 py-3 font-semibold">{t('appointments.code')}</TableHead>
                        <TableHead className="px-6 py-3 font-semibold">{t('appointments.customer')}</TableHead>
                        <TableHead className="px-6 py-3 font-semibold">{t('appointments.vehicle')}</TableHead>
                        <TableHead className="px-6 py-3 hidden md:table-cell font-semibold">{t('appointments.service')}</TableHead>
                        <TableHead className="px-6 py-3 hidden lg:table-cell font-semibold">{t('common.date')} / {t('common.time')}</TableHead>
                        <TableHead className="px-6 py-3 font-semibold">{t('common.status')}</TableHead>
                        <TableHead className="px-6 py-3 font-semibold text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-app-border">
                      {filtered.map((apt) => (
                        <TableRow key={apt.id} className="hover:bg-app-hover/60 transition-colors group">
                          <TableCell className="px-6 py-3.5 font-mono font-bold text-app-accent">{apt.code}</TableCell>
                          <TableCell className="px-6 py-3.5 font-semibold text-app-text">{apt.customer}</TableCell>
                          <TableCell className="px-6 py-3.5">
                            <p className="font-semibold text-app-text">{apt.vehicle}</p>
                            <p className="text-[10px] text-app-muted font-mono">{apt.plate}</p>
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-app-muted hidden md:table-cell">{apt.service}</TableCell>
                          <TableCell className="px-6 py-3.5 text-app-muted hidden lg:table-cell">
                            <span className="font-medium text-app-text">{apt.date}</span>
                            <span className="text-[10px] text-app-muted block">{apt.time}</span>
                          </TableCell>
                          <TableCell className="px-6 py-3.5">
                            <StatusBadge status={apt.status} />
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenView(apt)}
                                  className="h-7 w-7 p-0 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                                  title={t('common.view')}
                                >
                                  <Eye size={15} />
                                </Button>
                              {can('appointments', 'update') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(apt)}
                                    className="h-7 w-7 p-0 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                                    title={t('common.edit')}
                                  >
                                    <PencilSimple size={15} />
                                  </Button>
                              )}
                              {can('appointments', 'delete') && apt.status !== 'Cancelled' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCancelApt(apt.id)}
                                    className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title={t('appointments.cancelAppointment')}
                                  >
                                    <XCircle size={15} />
                                  </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="text-app-muted text-left border-b border-app-border bg-app-hover/50 hover:bg-transparent">
                    <TableHead className="px-6 py-3 font-semibold">Customer & Contact</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Vehicle</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Service Type</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Due Date / Mileage</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Status</TableHead>
                    <TableHead className="px-6 py-3 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-app-border">
                  {reminders.map((rem) => (
                    <TableRow key={rem.id} className="hover:bg-app-hover/60 transition-colors">
                      <TableCell className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.customer}</p>
                        <p className="text-[10px] text-app-muted">{rem.customerPhone || 'No phone'}</p>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.vehicle}</p>
                        <p className="text-[10px] font-mono text-app-accent font-bold">{rem.plate}</p>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 font-medium text-app-text">{rem.serviceType}</TableCell>
                      <TableCell className="px-6 py-3.5">
                        <p className="font-semibold text-app-text">{rem.dueDate || 'Upon mileage'}</p>
                        {rem.dueOdometer && (
                          <p className="text-[10px] text-app-muted font-mono">Target: {rem.dueOdometer} km</p>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
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
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Notification */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const msg = `Hello ${rem.customer}, your vehicle ${rem.vehicle} (${rem.plate}) is due for ${rem.serviceType} at CarRepair Workshop. Reply to this message or call us to reserve your service slot!`
                              navigator.clipboard?.writeText(msg)
                              updateReminderMutation.mutate({ id: rem.id, data: { status: 'Notified' } })
                              addToast('Reminder text copied & status updated to Notified!', 'success')
                            }}
                            className="h-7 px-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-semibold border-emerald-500/30"
                            title="Copy SMS / WhatsApp text"
                          >
                            <ChatCircleDots size={13} className="mr-1" />
                            <span>Notify</span>
                          </Button>

                          {/* 1-Click Book Appointment */}
                          <Button
                            size="sm"
                            onClick={() => handleBookFromReminder(rem)}
                            className="h-7 px-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText text-[11px] font-semibold shadow-subtle"
                            title="Book appointment from this reminder"
                          >
                            <CalendarCheck size={13} weight="bold" className="mr-1" />
                            <span>Book</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReminderMutation.mutate(rem.id)}
                            className="h-7 w-7 text-app-muted hover:text-rose-500"
                            title="Delete reminder"
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Schedule Custom Reminder Modal */}
      <Dialog open={isAddReminderOpen} onOpenChange={(open) => { if (!open) setIsAddReminderOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Schedule Maintenance Reminder</DialogTitle></DialogHeader>
        <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">Customer *</Label>
              <Select
                value={reminderForm.customerId}
                onValueChange={(val) => setReminderForm({ ...reminderForm, customerId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">Vehicle *</Label>
              <Select
                value={reminderForm.vehicleId}
                onValueChange={(val) => setReminderForm({ ...reminderForm, vehicleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.number} - {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="block text-app-muted font-medium mb-1">Maintenance Service Type *</Label>
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
              <Label className="block text-app-muted font-medium mb-1">Due Date</Label>
              <input
                type="date"
                value={reminderForm.dueDate}
                onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">Due Mileage (km)</Label>
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
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddReminderOpen(false)} className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer">Cancel</Button>
            <LoadingButton type="submit" loading={createReminderMutation.isPending}>
              Schedule Reminder
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* Create Appointment Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('appointments.createAppointment')}</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('appointments.customer')} *</Label>
              <Select
                value={formData.customer}
                onValueChange={(val) => {
                  const c = customers.find((x) => x.name === val)
                  setFormData({ ...formData, customer: val, customerId: c ? c.id : '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('appointments.vehicle')} *</Label>
              <Select
                value={formData.plate}
                onValueChange={(val) => {
                  const v = vehicles.find((x) => x.number === val)
                  setFormData({
                    ...formData,
                    plate: val,
                    vehicle: v ? `${v.brand} ${v.model}` : '',
                    vehicleId: v ? v.id : '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.number}>
                      {v.number} - {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('appointments.service')} *</Label>
              <Select
                value={formData.service}
                onValueChange={(val) => setFormData({ ...formData, service: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name} (${s.estimatedCost})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</Label>
              <Select
                value={formData.mechanic}
                onValueChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name} ({m.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.date')} *</Label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.time')} *</Label>
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
            <Label className="block text-app-muted font-medium mb-1">{t('appointments.notes')}</Label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Engine rattling at high speed"
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer">{t('common.cancel')}</Button>
            <LoadingButton type="submit" loading={createAptMutation.isPending}>
              {t('appointments.createAppointment')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{`${t('appointments.editAppointment')}: ${selectedApt?.code}`}</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">{t('status.Scheduled')}</SelectItem>
                  <SelectItem value="Confirmed">{t('status.Confirmed')}</SelectItem>
                  <SelectItem value="In Progress">{t('status.In Progress')}</SelectItem>
                  <SelectItem value="Completed">{t('status.Completed')}</SelectItem>
                  <SelectItem value="Cancelled">{t('status.Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('repairJobs.technician')}</Label>
              <Select
                value={formData.mechanic}
                onValueChange={(val) => {
                  const m = mechanics.find((x) => x.name === val)
                  setFormData({ ...formData, mechanic: val, mechanicId: m ? m.id : '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.date')}</Label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <Label className="block text-app-muted font-medium mb-1">{t('common.time')}</Label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors text-xs font-medium cursor-pointer">{t('common.cancel')}</Button>
            <LoadingButton type="submit" loading={updateAptMutation.isPending}>
              {t('common.saveChanges')}
            </LoadingButton>
          </div>
        </form>
      </DialogContent></Dialog>

      {/* View Appointment Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}><DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('common.details')}</DialogTitle></DialogHeader>
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
      </DialogContent></Dialog>
    </div>
  )
}
