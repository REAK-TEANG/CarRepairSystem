import React, { useState } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, GasPump } from '@phosphor-icons/react'

const mockVehicles = [
  { id: 1, number: 'ABC-1234', brand: 'Toyota', model: 'Camry', year: 2022, color: 'White', fuelType: 'Gasoline', mileage: 45200, owner: 'John Smith' },
  { id: 2, number: 'XYZ-5678', brand: 'Honda', model: 'Civic', year: 2021, color: 'Black', fuelType: 'Gasoline', mileage: 32100, owner: 'Sarah Davis' },
  { id: 3, number: 'DEF-9012', brand: 'Ford', model: 'F-150', year: 2023, color: 'Blue', fuelType: 'Gasoline', mileage: 18500, owner: 'Robert Lee' },
  { id: 4, number: 'GHI-3456', brand: 'BMW', model: 'X3', year: 2022, color: 'Silver', fuelType: 'Gasoline', mileage: 28900, owner: 'Emily Chen' },
  { id: 5, number: 'JKL-7890', brand: 'Hyundai', model: 'Sonata', year: 2020, color: 'Gray', fuelType: 'Hybrid', mileage: 61300, owner: 'David Park' },
]

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = mockVehicles.filter((v) =>
    v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.owner.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 text-surface-900 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Vehicle Registry</h1>
          <p className="text-xs text-surface-400 mt-1">{mockVehicles.length} registered vehicles</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B5FF57] hover:bg-[#a3f33f] text-[#101214] font-bold rounded-full text-xs transition-default shadow-neon">
          <Plus size={16} weight="bold" />
          Register Vehicle
        </button>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#323B43]">
          <div className="relative max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search plate, brand, model, owner..."
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
                <th className="px-6 py-3.5 font-semibold">Plate #</th>
                <th className="px-6 py-3.5 font-semibold">Vehicle</th>
                <th className="px-6 py-3.5 font-semibold hidden lg:table-cell">Fuel</th>
                <th className="px-6 py-3.5 font-semibold hidden md:table-cell">Mileage</th>
                <th className="px-6 py-3.5 font-semibold">Owner</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#323B43]/40">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-[#1E2328]/60 transition-default group">
                  <td className="px-6 py-4 font-mono font-bold text-[#B5FF57]">{v.number}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-surface-900 group-hover:text-[#B5FF57] transition-default">{v.brand} {v.model}</p>
                    <p className="text-[10px] text-surface-400">{v.year} · {v.color}</p>
                  </td>
                  <td className="px-6 py-4 text-surface-400 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <GasPump size={14} className="text-[#13F287]" />
                      {v.fuelType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-surface-400 tabular-nums hidden md:table-cell">
                    {v.mileage.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 font-semibold text-surface-900">{v.owner}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-full text-surface-400 hover:text-[#B5FF57] hover:bg-[#1E2328] transition-default">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 rounded-full text-surface-400 hover:text-[#B5FF57] hover:bg-[#1E2328] transition-default">
                        <PencilSimple size={16} />
                      </button>
                      <button className="p-1.5 rounded-full text-surface-400 hover:text-danger-500 hover:bg-[#1E2328] transition-default">
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
