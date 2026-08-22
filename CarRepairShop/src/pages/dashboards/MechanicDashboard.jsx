import { useState } from 'react'
import { Wrench, CheckCircle, WarningCircle, Car, Eye } from '@phosphor-icons/react'
import { useRepairJobs, useUpdateRepairJob } from '../../hooks/useRepairJobs'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'

export default function MechanicDashboard() {
  const { user } = useAuth()
  const params = user.role === 'mechanic' ? { mechanicId: user.id } : {}
  const { data: jobs = [] } = useRepairJobs(params)
  const updateJobMutation = useUpdateRepairJob()

  const [selectedJob, setSelectedJob] = useState(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [statusVal, setStatusVal] = useState('Repairing')
  const [diagNotes, setDiagNotes] = useState('')

  const handleOpenUpdate = (job) => {
    setSelectedJob(job)
    setStatusVal(job.status)
    setDiagNotes(job.diagnosis || '')
    setIsUpdateOpen(true)
  }

  const handleOpenView = (job) => {
    setSelectedJob(job)
    setIsViewOpen(true)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJob) return
    updateJobMutation.mutate({
      id: selectedJob.id,
      data: {
        status: statusVal,
        diagnosis: diagNotes,
      },
    })
    setIsUpdateOpen(false)
  }

  const activeJobs = jobs.filter(j => j.status === 'Diagnosing' || j.status === 'Repairing')
  const waitingParts = jobs.filter(j => j.status === 'Waiting for Parts')
  const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Ready for Pickup')

  return (
    <div className="space-y-6 font-sans text-app-text animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Technician Workspace</h1>
        <p className="text-xs text-app-muted mt-1">Logged in as {user.name} ({user.roleTitle}) · Track your active repair bay queue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-app-card rounded-xl p-4 border border-app-border shadow-card transition-colors duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-app-accent/10 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-app-accent" weight="bold" />
            </div>
            <div>
              <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">Active In-Bay Jobs</p>
              <h2 className="text-2xl font-bold text-app-text mt-0.5 tabular-nums">{activeJobs.length}</h2>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-app-card rounded-xl p-4 border border-app-border shadow-card transition-colors duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <WarningCircle size={20} className="text-amber-500" weight="bold" />
            </div>
            <div>
              <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">Waiting for Parts</p>
              <h2 className="text-2xl font-bold text-app-text mt-0.5 tabular-nums">{waitingParts.length}</h2>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-app-card rounded-xl p-4 border border-app-border shadow-card transition-colors duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-500" weight="bold" />
            </div>
            <div>
              <p className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">Completed / Ready</p>
              <h2 className="text-2xl font-bold text-app-text mt-0.5 tabular-nums">{completedJobs.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Active Work Queue */}
      <div className="bg-app-card rounded-xl border border-app-border p-5 shadow-card transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-app-text">Assigned Repair Orders Queue</h3>
          <span className="text-xs text-app-muted">{jobs.length} total orders</span>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-app-hover/40 rounded-xl border border-app-border gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-app-accent/15 flex items-center justify-center text-app-accent flex-shrink-0 mt-0.5">
                  <Car size={18} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-app-accent text-xs">{job.orderNumber}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-app-text mt-1">{job.vehicle} · <span className="font-mono text-app-muted">{job.plate}</span></h4>
                  <p className="text-[11px] text-app-muted mt-0.5">Customer: {job.customer} · Issue: <span className="text-app-text">{job.problem}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenView(job)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border transition-colors flex items-center gap-1.5"
                >
                  <Eye size={14} /> View
                </button>
                <button
                  onClick={() => handleOpenUpdate(job)}
                  className="px-3.5 py-1.5 bg-app-accent hover:bg-app-accentHover text-app-accentText text-xs font-semibold rounded-lg transition-colors shadow-subtle flex items-center gap-1.5"
                >
                  <Wrench size={14} weight="bold" /> Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Job Status Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} title={`Update Job: ${selectedJob?.orderNumber}`}>
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border space-y-1">
            <p className="text-app-muted">Vehicle: <span className="font-semibold text-app-text">{selectedJob?.vehicle} ({selectedJob?.plate})</span></p>
            <p className="text-app-muted">Reported Issue: <span className="text-app-text font-medium">{selectedJob?.problem}</span></p>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Current Job Status</label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent font-semibold"
            >
              <option value="Diagnosing">Diagnosing</option>
              <option value="Repairing">Repairing</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-app-muted font-medium mb-1">Technician Findings & Parts Used</label>
            <textarea
              rows={3}
              value={diagNotes}
              onChange={(e) => setDiagNotes(e.target.value)}
              placeholder="Record diagnostic details, part numbers installed, or inspection results..."
              className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
            <button
              type="button"
              onClick={() => setIsUpdateOpen(false)}
              className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg transition-colors shadow-subtle"
            >
              Save Job Progress
            </button>
          </div>
        </form>
      </Modal>

      {/* View Job Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Job Order Overview">
        {selectedJob && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border flex items-center justify-between">
              <div>
                <p className="font-mono text-app-accent font-semibold">{selectedJob.orderNumber}</p>
                <p className="font-semibold text-app-text mt-0.5">{selectedJob.vehicle} ({selectedJob.plate})</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="p-3 bg-app-input rounded-lg border border-app-border">
              <p className="text-[10px] text-app-muted uppercase font-semibold">Reported Issue</p>
              <p className="text-app-text mt-1">{selectedJob.problem}</p>
            </div>

            {selectedJob.diagnosis && (
              <div className="p-3 bg-app-input rounded-lg border border-app-border">
                <p className="text-[10px] text-app-muted uppercase font-semibold">Diagnosis & Notes</p>
                <p className="text-app-text mt-1">{selectedJob.diagnosis}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
