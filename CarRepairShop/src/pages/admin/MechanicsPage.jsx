import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, Wrench, Star, Clock, Phone, EnvelopeSimple } from '@phosphor-icons/react'

const mockMechanics = [
  { id: 1, code: 'MEC-001', name: 'Mike Johnson', phone: '(555) 111-2233', email: 'mike@workshop.com', specialization: 'Engine & Transmission', experience: 12, activeJobs: 3, completedJobs: 187, rating: 4.8, status: 'Active' },
  { id: 2, code: 'MEC-002', name: 'Tom Wilson', phone: '(555) 222-3344', email: 'tom@workshop.com', specialization: 'Brakes & Suspension', experience: 8, activeJobs: 2, completedJobs: 134, rating: 4.6, status: 'Active' },
  { id: 3, code: 'MEC-003', name: 'James Brown', phone: '(555) 333-4455', email: 'james@workshop.com', specialization: 'Electrical & AC', experience: 6, activeJobs: 1, completedJobs: 89, rating: 4.5, status: 'Active' },
  { id: 4, code: 'MEC-004', name: 'Carlos Rivera', phone: '(555) 444-5566', email: 'carlos@workshop.com', specialization: 'Body & Paint', experience: 10, activeJobs: 0, completedJobs: 156, rating: 4.7, status: 'On Leave' },
  { id: 5, code: 'MEC-005', name: 'Kevin Lee', phone: '(555) 555-6677', email: 'kevin@workshop.com', specialization: 'General Maintenance', experience: 3, activeJobs: 2, completedJobs: 42, rating: 4.3, status: 'Active' },
]

const statusFilters = ['All', 'Active', 'On Leave', 'Terminated']

export default function MechanicsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = mockMechanics.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || m.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const totalActive = mockMechanics.filter(m => m.status === 'Active').length
  const totalActiveJobs = mockMechanics.reduce((sum, m) => sum + m.activeJobs, 0)
  const avgRating = (mockMechanics.reduce((sum, m) => sum + m.rating, 0) / mockMechanics.length).toFixed(1)

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-250">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-app-text">Mechanic Management</h1>
          <p className="text-xs text-app-muted mt-1">{totalActive} active mechanics on staff</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:opacity-90 text-app-accentText font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Add Mechanic
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Mechanics</p>
          <p className="text-2xl font-bold tabular-nums text-app-text">{mockMechanics.length}</p>
        </div>
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Active Today</p>
          <p className="text-2xl font-bold tabular-nums text-success-500">{totalActive}</p>
        </div>
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">In-Progress Jobs</p>
          <p className="text-2xl font-bold tabular-nums text-app-accent">{totalActiveJobs}</p>
        </div>
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Avg. Rating</p>
          <p className="text-2xl font-bold tabular-nums text-app-text flex items-center gap-1">
            <Star size={18} className="text-amber-500" weight="fill" />
            {avgRating}
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((filter) => {
          const count = filter === 'All'
            ? mockMechanics.length
            : mockMechanics.filter(m => m.status === filter).length
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
              placeholder="Search by name, code, specialization..."
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
                <th className="px-6 py-3.5 font-semibold">Mechanic</th>
                <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Specialization</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Contact</th>
                <th className="px-6 py-3.5 font-semibold text-center">Exp.</th>
                <th className="px-6 py-3.5 font-semibold text-center">Active Jobs</th>
                <th className="px-6 py-3.5 font-semibold text-center hidden md:table-cell">Completed</th>
                <th className="px-6 py-3.5 font-semibold text-center">Rating</th>
                <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-app-hover/60 transition-default group">
                  <td className="px-6 py-4 font-mono font-bold text-app-accent">{m.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-app-accent/15 border border-app-accent/30 rounded-full flex items-center justify-center text-app-accent font-bold text-[10px]">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-app-text group-hover:text-app-accent transition-default">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-app-muted">
                      <Wrench size={13} className="text-app-accent" />
                      {m.specialization}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <p className="text-app-muted flex items-center gap-1"><Phone size={11} />{m.phone}</p>
                      <p className="text-app-muted flex items-center gap-1"><EnvelopeSimple size={11} />{m.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-app-muted">
                      <Clock size={13} />
                      {m.experience}y
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
                      m.activeJobs > 0 
                        ? 'bg-app-accent/15 text-app-accent border border-app-accent/30' 
                        : 'bg-app-hover text-app-muted border border-app-border'
                    }`}>
                      {m.activeJobs}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold tabular-nums text-app-text hidden md:table-cell">{m.completedJobs}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                      <Star size={12} weight="fill" />
                      {m.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {m.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-success-500/15 text-success-500 border border-success-500/30">Active</span>
                    ) : m.status === 'On Leave' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">On Leave</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-danger-500/15 text-danger-500 border border-danger-500/30">Terminated</span>
                    )}
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
  )
}
