import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Eye, Clock, User } from '@phosphor-icons/react'
import StatusBadge from '../components/ui/StatusBadge'

const mockRepairJobs = [
  { id: 1, orderNumber: 'RO-2026-0042', customer: 'John Smith', vehicle: 'Toyota Camry 2022', plate: 'ABC-1234', mechanic: 'Mike Johnson', problem: 'Engine overheating', estimatedCost: '$850', status: 'Repairing', createdAt: '2026-08-16' },
  { id: 2, orderNumber: 'RO-2026-0041', customer: 'Sarah Davis', vehicle: 'Honda Civic 2021', plate: 'XYZ-5678', mechanic: 'Tom Wilson', problem: 'Brake noise', estimatedCost: '$320', status: 'Diagnosing', createdAt: '2026-08-16' },
  { id: 3, orderNumber: 'RO-2026-0040', customer: 'Robert Lee', vehicle: 'Ford F-150 2023', plate: 'DEF-9012', mechanic: 'Mike Johnson', problem: 'Transmission issue', estimatedCost: '$1,200', status: 'Waiting for Parts', createdAt: '2026-08-15' },
  { id: 4, orderNumber: 'RO-2026-0039', customer: 'Emily Chen', vehicle: 'BMW X3 2022', plate: 'GHI-3456', mechanic: 'James Brown', problem: 'AC not cooling', estimatedCost: '$450', status: 'Ready for Pickup', createdAt: '2026-08-14' },
  { id: 5, orderNumber: 'RO-2026-0038', customer: 'David Park', vehicle: 'Hyundai Sonata 2020', plate: 'JKL-7890', mechanic: 'Tom Wilson', problem: 'Oil change + inspection', estimatedCost: '$110', status: 'Completed', createdAt: '2026-08-14' },
]

const statusFilters = ['All', 'Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed']

export default function RepairJobsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = mockRepairJobs.filter((job) => {
    const matchesSearch =
      job.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.plate.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || job.status === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 text-surface-900 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Repair Jobs</h1>
          <p className="text-xs text-surface-400 mt-1">{mockRepairJobs.filter(j => j.status !== 'Completed').length} active repair orders</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B5FF57] hover:bg-[#a3f33f] text-[#101214] font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Create Repair Order
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((filter) => {
          const count = filter === 'All'
            ? mockRepairJobs.length
            : mockRepairJobs.filter(j => j.status === filter).length
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${isActive
                  ? 'bg-[#B5FF57] text-[#101214] shadow-neon'
                  : 'bg-app-card text-surface-400 border border-app-border hover:bg-[#1E2328] hover:text-surface-900'
                }`}
            >
              {filter}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-[#101214] text-[#B5FF57] font-bold' : 'bg-[#1E2328] text-surface-400'
                }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search order #, customer, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1E2328] border border-[#323B43] rounded-full text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:border-[#B5FF57] transition-default"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-surface-400 text-left border-b border-[#323B43]/60 bg-[#101214]/40">
                <th className="px-6 py-3.5 font-semibold">Order #</th>
                <th className="px-6 py-3.5 font-semibold">Customer & Vehicle</th>
                <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Problem</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Mechanic</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Est. Cost</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#323B43]/40">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-[#1E2328]/60 transition-default group">
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-[#B5FF57]">{job.orderNumber}</p>
                    <p className="text-[10px] text-surface-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {job.createdAt}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-surface-900 group-hover:text-[#B5FF57] transition-default">{job.customer}</p>
                    <p className="text-[10px] text-surface-400">{job.vehicle} · {job.plate}</p>
                  </td>
                  <td className="px-6 py-4 text-surface-400 hidden lg:table-cell max-w-[200px] truncate">
                    {job.problem}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-surface-400">
                      <User size={13} className="text-[#13F287]" />
                      {job.mechanic}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-surface-900 tabular-nums hidden md:table-cell">
                    {job.estimatedCost}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-full text-surface-400 hover:text-[#B5FF57] hover:bg-[#1E2328] transition-default">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 rounded-full text-surface-400 hover:text-[#B5FF57] hover:bg-[#1E2328] transition-default">
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
