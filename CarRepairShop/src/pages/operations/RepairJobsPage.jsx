import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Eye,
  Trash,
  Package,
  Receipt,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useRepairJobs, useDeleteRepairJob } from '../../hooks/useRepairJobs'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useMechanics } from '../../hooks/useMechanics'
import { useServicesCatalog } from '../../hooks/useServicesCatalog'
import { useInventory } from '../../hooks/useInventory'
import { useCreateInvoice } from '../../hooks/useInvoices'
import { useDebounce } from '../../hooks/useDebounce'
import { usePaginationData } from '../../hooks/usePaginationData'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  StatusBadge,
  EmptyState,
  ConfirmDialog,
  TableSkeleton,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooterBar,
  Input,
} from '../../components/ui'
import FastIntakeModal from '../../components/workshop/FastIntakeModal'
import JobCardDrawer from '../../components/workshop/JobCardDrawer'

const statusFilters = ['All', 'Pending', 'In Progress', 'Completed']

export default function RepairJobsPage() {
  const { t } = useTranslation()
  const { can, user } = useAuth()
  const { addToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [page, setPage] = useState(1)

  const queryParams = {
    page,
    limit: 10,
    search: debouncedSearch,
    status: activeFilter,
    ...(user?.role === 'mechanic' ? { mechanicId: user?.id } : {}),
  }
  const { data: response, isLoading } = useRepairJobs(queryParams)
  const { items: jobs, totalCount, totalPages } = usePaginationData(response, { page, limit: 10 })

  const { data: rawCustomers = [] } = useCustomers({ all: true })
  const { data: rawVehicles = [] } = useVehicles({ all: true })
  const { data: rawMechanics = [] } = useMechanics({ all: true })
  const { data: rawServices = [] } = useServicesCatalog({ all: true })
  const { data: rawInventory = [] } = useInventory({ all: true })

  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])
  const vehicles = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles?.data || [])
  const mechanics = Array.isArray(rawMechanics) ? rawMechanics : (rawMechanics?.data || [])
  const services = Array.isArray(rawServices) ? rawServices : (rawServices?.data || [])
  const inventory = Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])

  const deleteJobMutation = useDeleteRepairJob()
  const createInvoiceMutation = useCreateInvoice()

  // Modals & Drawer State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  const handleOpenDrawer = (job) => {
    setSelectedJob(job)
    setIsDrawerOpen(true)
  }

  const handleIntakeSuccess = (createdJob) => {
    addToast(`Repair Order ${createdJob.orderNumber || ''} created!`, 'success')
    setSelectedJob(createdJob)
    setIsDrawerOpen(true)
  }

  const handleOpenDelete = (job) => {
    setSelectedJob(job)
    setIsDrawerOpen(false)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedJob) return
    deleteJobMutation.mutate(selectedJob.id)
    setIsDeleteOpen(false)
    setSelectedJob(null)
  }

  const handle1ClickInvoice = async (job) => {
    const costNum = parseFloat(String(job.actualCost || job.estimatedCost || '250').replace(/[^0-9.]/g, '')) || 250
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const dueDateStr = nextWeek.toISOString().split('T')[0]
    try {
      await createInvoiceMutation.mutateAsync({
        customerId: job.customerId,
        customer: job.customer,
        orderNumber: job.orderNumber,
        amount: costNum,
        dueDate: dueDateStr,
      })
      addToast(`Invoice created for ${job.orderNumber} ($${costNum.toFixed(2)})`, 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to create invoice', 'warning')
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 font-sans text-app-text">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.repairJobsOrders')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {totalCount}
          </span>
        </div>
        {can('repair_jobs', 'create') && (
          <Button
            onClick={() => setIsIntakeOpen(true)}
            size="sm"
            className="bg-app-accent text-app-text-inverted hover:bg-app-accent-hover font-semibold shadow-xs"
          >
            <Plus size={14} weight="bold" />
            <span>Fast Vehicle Intake</span>
          </Button>
        )}
      </div>

      {/* Integrated Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {statusFilters.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveFilter(tab)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-app-accent text-app-text-inverted font-semibold'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover'
              }`}
            >
              {tab === 'All' ? t('common.all') : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search order, plate, customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-8 pr-3 py-1 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
      </div>

      {/* Main Table Container */}
      {isLoading && jobs.length === 0 ? (
        <TableSkeleton rows={6} columns={7} />
      ) : jobs.length === 0 ? (
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
              <TableHead>{t('repairJobs.orderId')}</TableHead>
              <TableHead>{t('appointments.vehicle')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('appointments.customer')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('repairJobs.technician')}</TableHead>
              <TableHead className="hidden sm:table-cell">Parts Used</TableHead>
              <TableHead className="hidden md:table-cell">{t('repairJobs.totalCost')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                onClick={() => handleOpenDrawer(job)}
                className="cursor-pointer hover:bg-app-hover/50 transition-colors"
              >
                <TableCell className="font-mono font-bold text-app-accent">{job.orderNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-app-text">{job.vehicle}</p>
                  <p className="text-[11px] text-app-muted font-mono">{job.plate}</p>
                </TableCell>
                <TableCell className="text-app-muted hidden md:table-cell">{job.customer}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-app-muted">
                    {job.mechanic || 'Unassigned'}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {job.partsUsed && job.partsUsed.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {job.partsUsed.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                          title={`${p.name} - Qty: ${p.quantity}`}
                        >
                          <Package size={11} />
                          <span>
                            {p.quantity}x {p.partCode || p.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-app-muted italic">No parts</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-app-text tabular-nums hidden md:table-cell font-mono">
                  {job.actualCost || job.estimatedCost || '$0.00'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {/* 1-Click Fast Invoice on Completed Orders */}
                    {job.status === 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handle1ClickInvoice(job)}
                        className="p-1.5 rounded-md text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Generate Invoice"
                      >
                        <Receipt size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDrawer(job)}
                      className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                      title="Open Job Card Drawer"
                    >
                      <Eye size={14} />
                    </button>
                    {can('repair_jobs', 'update') && (
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(job)}
                        className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                        title="Edit Job Card"
                      >
                        <PencilSimple size={14} />
                      </button>
                    )}
                    {can('repair_jobs', 'delete') && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(job)}
                        className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash size={14} />
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

      {/* Fast Vehicle Intake Modal (Under 30s Check-in) */}
      <FastIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSuccess={handleIntakeSuccess}
        vehicles={vehicles}
        customers={customers}
        mechanics={mechanics}
        services={services}
      />

      {/* Unified Job Card Drawer (Slide-Over Sheet) */}
      <JobCardDrawer
        key={selectedJob?.id || 'none'}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        job={selectedJob}
        mechanics={mechanics}
        services={services}
        inventory={inventory}
        onDelete={handleOpenDelete}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('repairJobs.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  )
}
