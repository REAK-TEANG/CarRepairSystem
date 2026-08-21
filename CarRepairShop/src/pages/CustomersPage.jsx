import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, Phone, EnvelopeSimple } from '@phosphor-icons/react'

const mockCustomers = [
  { id: 1, code: 'CUS-001', name: 'John Smith', phone: '(555) 123-4567', email: 'john@email.com', vehicles: 2, totalSpent: '$4,250', registrationDate: '2024-03-15', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 2, code: 'CUS-002', name: 'Sarah Davis', phone: '(555) 234-5678', email: 'sarah@email.com', vehicles: 1, totalSpent: '$1,800', registrationDate: '2024-05-20', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
  { id: 3, code: 'CUS-003', name: 'Robert Lee', phone: '(555) 345-6789', email: 'robert@email.com', vehicles: 3, totalSpent: '$7,500', registrationDate: '2024-01-10', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 4, code: 'CUS-004', name: 'Emily Chen', phone: '(555) 456-7890', email: 'emily@email.com', vehicles: 1, totalSpent: '$950', registrationDate: '2024-07-08', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 5, code: 'CUS-005', name: 'David Park', phone: '(555) 567-8901', email: 'david@email.com', vehicles: 2, totalSpent: '$3,100', registrationDate: '2024-02-28', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = mockCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-250">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-app-text">Customer List</h1>
          <p className="text-xs text-app-muted mt-1">{mockCustomers.length} registered customers</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:opacity-90 text-app-accentText font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Add Customer
        </button>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden transition-colors duration-250">
        <div className="p-4 border-b border-app-border">
          <div className="relative max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, code..."
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
                <th className="px-6 py-3.5 font-semibold">Customer Name</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Phone</th>
                <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Email</th>
                <th className="px-6 py-3.5 font-semibold text-center">Vehicles</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Total Spent</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-app-hover/60 transition-default group">
                  <td className="px-6 py-4 font-mono font-bold text-app-accent">{c.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-app-border" />
                      <span className="font-bold text-app-text group-hover:text-app-accent transition-default">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-app-muted hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={14} className="text-app-muted" />
                      {c.phone}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-app-muted hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <EnvelopeSimple size={14} className="text-app-muted" />
                      {c.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-success-500/15 text-success-500 border border-success-500/30 rounded-full text-[11px] font-bold">
                      {c.vehicles}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-app-text tabular-nums hidden md:table-cell">{c.totalSpent}</td>
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
