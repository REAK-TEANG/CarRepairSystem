import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, CurrencyDollar, Clock, ToggleLeft, ToggleRight } from '@phosphor-icons/react'

const mockServices = [
  { id: 1, name: 'Oil Change', description: 'Engine oil and filter replacement', estimatedCost: 50.00, estimatedHours: 1.0, isActive: true },
  { id: 2, name: 'Engine Repair', description: 'Engine diagnosis and repair', estimatedCost: 500.00, estimatedHours: 8.0, isActive: true },
  { id: 3, name: 'Brake Service', description: 'Brake pad and disc inspection/replacement', estimatedCost: 200.00, estimatedHours: 2.5, isActive: true },
  { id: 4, name: 'Tire Replacement', description: 'Tire removal and installation', estimatedCost: 80.00, estimatedHours: 1.5, isActive: true },
  { id: 5, name: 'Battery Replacement', description: 'Battery testing and replacement', estimatedCost: 150.00, estimatedHours: 0.5, isActive: true },
  { id: 6, name: 'Air Conditioning Repair', description: 'AC system diagnosis and repair', estimatedCost: 300.00, estimatedHours: 4.0, isActive: true },
  { id: 7, name: 'Wheel Alignment', description: 'Four-wheel alignment adjustment', estimatedCost: 75.00, estimatedHours: 1.0, isActive: true },
  { id: 8, name: 'Car Wash', description: 'Full exterior and interior cleaning', estimatedCost: 30.00, estimatedHours: 1.5, isActive: false },
  { id: 9, name: 'General Inspection', description: 'Multi-point vehicle inspection', estimatedCost: 60.00, estimatedHours: 1.0, isActive: true },
]

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = mockServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesActive = showInactive ? true : s.isActive
    return matchesSearch && matchesActive
  })

  const totalActive = mockServices.filter(s => s.isActive).length

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-250">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-app-text">Service Catalog</h1>
          <p className="text-xs text-app-muted mt-1">{totalActive} active services offered</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:opacity-90 text-app-accentText font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Add Service
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Total Services</p>
          <p className="text-2xl font-bold tabular-nums text-app-text">{mockServices.length}</p>
        </div>
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Avg. Estimated Cost</p>
          <p className="text-2xl font-bold tabular-nums text-app-accent">
            ${(mockServices.reduce((sum, s) => sum + s.estimatedCost, 0) / mockServices.length).toFixed(0)}
          </p>
        </div>
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-250">
          <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider mb-1">Most Expensive</p>
          <p className="text-2xl font-bold tabular-nums text-success-500">
            ${Math.max(...mockServices.map(s => s.estimatedCost)).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-250">
        <div className="p-4 border-b border-app-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search service name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-app-input border border-app-border rounded-full text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-default"
            />
          </div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium text-app-muted hover:text-app-text transition-default"
          >
            {showInactive ? <ToggleRight size={20} className="text-app-accent" weight="fill" /> : <ToggleLeft size={20} weight="bold" />}
            Show Inactive
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-app-muted text-left border-b border-app-border/60 bg-app-bg">
                <th className="px-6 py-3.5 font-semibold">Service Name</th>
                <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Description</th>
                <th className="px-6 py-3.5 font-semibold">Est. Cost</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Est. Hours</th>
                <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-app-hover/60 transition-default group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-app-text group-hover:text-app-accent transition-default">{s.name}</span>
                  </td>
                  <td className="px-6 py-4 text-app-muted hidden lg:table-cell max-w-[280px] truncate">
                    {s.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-app-text tabular-nums">
                      <CurrencyDollar size={13} className="text-app-accent" />
                      {s.estimatedCost.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-app-muted">
                      <Clock size={13} />
                      {s.estimatedHours}h
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-success-500/15 text-success-500 border border-success-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-app-hover text-app-muted border border-app-border">
                        Inactive
                      </span>
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
                      <button className="p-1.5 rounded-full text-app-muted hover:text-danger-500 hover:bg-app-hover transition-default">
                        <Trash size={16} />
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
