import React from 'react'
import { Wrench, CheckCircle, Clock, WarningCircle } from '@phosphor-icons/react'

export default function MechanicDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-app-text animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold leading-tight">My Workspace</h1>
        <p className="text-sm text-app-muted mt-1">View your assigned jobs and tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-app-card rounded-2xl p-5 border border-app-border shadow-card transition-colors duration-250">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-app-accent/10 rounded-xl flex items-center justify-center">
              <Wrench size={24} className="text-app-accent" weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-app-muted font-medium uppercase tracking-wider mb-1">Active Jobs</p>
              <h2 className="text-2xl font-bold leading-none text-app-text">3</h2>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-app-card rounded-2xl p-5 border border-app-border shadow-card transition-colors duration-250">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-danger-500/10 rounded-xl flex items-center justify-center">
              <WarningCircle size={24} className="text-danger-500" weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-app-muted font-medium uppercase tracking-wider mb-1">Pending Parts</p>
              <h2 className="text-2xl font-bold leading-none text-app-text">1</h2>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-app-card rounded-2xl p-5 border border-app-border shadow-card transition-colors duration-250">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-success-500" weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-app-muted font-medium uppercase tracking-wider mb-1">Completed Today</p>
              <h2 className="text-2xl font-bold leading-none text-app-text">2</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card transition-colors duration-250">
        <h3 className="text-base font-semibold mb-4 text-app-text">Assigned Vehicles</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-app-bg rounded-xl border border-app-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-app-hover rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-app-accent" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-app-text">Toyota Camry (B 1234 CD)</h4>
                <p className="text-xs text-app-muted">Brake pad replacement</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-app-card hover:bg-app-hover border border-app-border text-xs font-semibold rounded-lg text-app-text transition-colors">
              Update Status
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-app-bg rounded-xl border border-app-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-app-hover rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-app-muted" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-app-text">Honda Civic (D 5678 EF)</h4>
                <p className="text-xs text-app-muted">Full Service</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-app-card hover:bg-app-hover border border-app-border text-xs font-semibold rounded-lg text-app-text transition-colors">
              Start Job
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
