import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, CalendarBlank, Clock, User, CaretLeft, CaretRight } from '@phosphor-icons/react'
import StatusBadge from '../../components/ui/StatusBadge'

const mockAppointments = [
  { id: 1, code: 'APT-001', customer: 'John Smith', vehicle: 'Toyota Camry 2022', plate: 'ABC-1234', mechanic: 'Mike Johnson', service: 'Engine Repair', date: '2026-08-20', time: '09:00', status: 'Scheduled' },
  { id: 2, code: 'APT-002', customer: 'Sarah Davis', vehicle: 'Honda Civic 2021', plate: 'XYZ-5678', mechanic: 'Tom Wilson', service: 'Brake Service', date: '2026-08-20', time: '10:30', status: 'Confirmed' },
  { id: 3, code: 'APT-003', customer: 'Robert Lee', vehicle: 'Ford F-150 2023', plate: 'DEF-9012', mechanic: 'Mike Johnson', service: 'Oil Change', date: '2026-08-19', time: '14:00', status: 'In Progress' },
  { id: 4, code: 'APT-004', customer: 'Emily Chen', vehicle: 'BMW X3 2022', plate: 'GHI-3456', mechanic: 'James Brown', service: 'AC Repair', date: '2026-08-18', time: '11:00', status: 'Completed' },
  { id: 5, code: 'APT-005', customer: 'David Park', vehicle: 'Hyundai Sonata 2020', plate: 'JKL-7890', mechanic: 'Tom Wilson', service: 'Tire Replacement', date: '2026-08-21', time: '08:30', status: 'Scheduled' },
  { id: 6, code: 'APT-006', customer: 'Maria Garcia', vehicle: 'Nissan Altima 2021', plate: 'MNO-1234', mechanic: 'Mike Johnson', service: 'General Inspection', date: '2026-08-18', time: '16:00', status: 'Cancelled' },
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const calDays = getMiniCalendarDays(calYear, calMonth)
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  const appointmentsByDay = {}
  mockAppointments.forEach((a) => {
    const day = parseInt(a.date.split('-')[2], 10)
    const m = parseInt(a.date.split('-')[1], 10) - 1
    const y = parseInt(a.date.split('-')[0], 10)
    if (m === calMonth && y === calYear) {
      appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1
    }
  })

  const filtered = mockAppointments.filter((a) => {
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
    <div className="space-y-6 text-app-text font-sans transition-colors duration-250">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-app-text">Appointments</h1>
          <p className="text-xs text-app-muted mt-1">{mockAppointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length} upcoming appointments</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:opacity-90 text-app-accentText font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Book Appointment
        </button>
      </div>

      {/* Calendar + Table Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">

        {/* Mini Calendar */}
        <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card transition-colors duration-250">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }} className="p-1.5 rounded-full text-app-muted hover:bg-app-hover hover:text-app-accent transition-default">
              <CaretLeft size={14} weight="bold" />
            </button>
            <h3 className="text-xs font-semibold text-app-text">{monthName}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }} className="p-1.5 rounded-full text-app-muted hover:bg-app-hover hover:text-app-accent transition-default">
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
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium transition-all duration-150
                    ${isSelected ? 'bg-app-accent text-app-accentText font-bold shadow-neon-sm' : isToday ? 'bg-app-accent/15 text-app-accent font-bold ring-1 ring-app-accent/40' : 'text-app-muted hover:bg-app-hover hover:text-app-text'}`}
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
              className="mt-3 w-full text-[10px] text-app-muted hover:text-app-accent transition-default"
            >
              Clear date filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => {
              const count = filter === 'All'
                ? mockAppointments.length
                : mockAppointments.filter(a => a.status === filter).length
              const isActive = activeFilter === filter
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-app-accent text-app-accentText shadow-neon'
                      : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  {filter}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-app-accentText text-app-accent font-bold' : 'bg-app-hover text-app-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-250">
            <div className="p-4 border-b border-app-border">
              <div className="relative max-w-md">
                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  placeholder="Search code, customer, plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-app-input border border-app-border rounded-full text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-default"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-app-muted text-left border-b border-app-border/60 bg-app-bg">
                    <th className="px-6 py-3.5 font-semibold">Code</th>
                    <th className="px-6 py-3.5 font-semibold">Customer & Vehicle</th>
                    <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Service</th>
                    <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Mechanic</th>
                    <th className="px-6 py-3.5 font-semibold">Date & Time</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/40">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-app-hover/60 transition-default group">
                      <td className="px-6 py-4 font-mono font-bold text-app-accent">{a.code}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-app-text group-hover:text-app-accent transition-default">{a.customer}</p>
                        <p className="text-[10px] text-app-muted">{a.vehicle} · {a.plate}</p>
                      </td>
                      <td className="px-6 py-4 text-app-muted hidden lg:table-cell">{a.service}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-app-muted">
                          <User size={13} className="text-success-500" />
                          {a.mechanic}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-app-text flex items-center gap-1.5">
                          <CalendarBlank size={13} className="text-app-accent" />
                          {a.date}
                        </p>
                        <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {a.time}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-full text-app-muted hover:text-app-accent hover:bg-app-hover transition-default">
                            <Eye size={16} />
                          </button>
                          <button className="p-1.5 rounded-full text-app-muted hover:text-app-accent hover:bg-app-hover transition-default">
                            <PencilSimple size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
