import {
  CurrencyDollar,
  Wrench,
  Users,
  Phone,
  TrendUp,
  Package,
  Plus,
  CalendarBlank,
  Receipt,
  ArrowUpRight,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CardSkeleton, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui'
import { useInvoices } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'
import { useEmployees } from '../../hooks/useEmployees'
import { useAppointments } from '../../hooks/useAppointments'
import { StaggerGroup } from '../../components/animation/AnimeWrapper'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { data: rawInvoices = [], isLoading: loadingInvoices } = useInvoices({ all: true })
  const { data: rawCustomers = [], isLoading: loadingCustomers } = useCustomers({ all: true })
  const { data: rawRepairJobs = [], isLoading: loadingJobs } = useRepairJobs({ all: true })
  const { data: rawInventory = [], isLoading: loadingInventory } = useInventory({ all: true })
  const { data: rawEmployees = [] } = useEmployees({ all: true })
  const { data: rawAppointments = [] } = useAppointments({ all: true })

  const invoices = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices?.data || [])
  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])
  const repairJobs = Array.isArray(rawRepairJobs) ? rawRepairJobs : (rawRepairJobs?.data || [])
  const inventory = Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])
  const employees = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees?.data || [])
  const appointments = Array.isArray(rawAppointments) ? rawAppointments : (rawAppointments?.data || [])

  const isInitialLoading = (loadingInvoices || loadingJobs || loadingCustomers || loadingInventory) && invoices.length === 0

  const [hoveredSegment, setHoveredSegment] = useState(null)
  const [centerMode, setCenterMode] = useState('collected') // 'collected' | 'active' | 'revenue'

  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const balanceDue = Math.max(0, totalRevenue - totalPaid)
  const paidPercent = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0
  const duePercent = totalRevenue > 0 ? Math.round((balanceDue / totalRevenue) * 100) : 0
  const activeOrders = repairJobs.filter((j) => j.status !== 'Completed').length
  const completedOrders = repairJobs.filter((j) => j.status === 'Completed').length
  const totalParts = inventory.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const inventoryTotalVal = inventory.reduce((sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0), 0)
  const lowStockItems = inventory.filter((p) => p.stockQty <= (p.minThreshold || 5))
  const scheduledApts = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length

  // SVG Donut geometry & dynamic arc lengths
  const CIRCUMFERENCE = 2 * Math.PI * 38 // 238.761
  const paidRatio = totalRevenue > 0 ? Math.min(1, Math.max(0, totalPaid / totalRevenue)) : 0
  const dueRatio = totalRevenue > 0 ? Math.min(1 - paidRatio, Math.max(0, balanceDue / totalRevenue)) : 0
  const hasBothSegments = paidRatio > 0 && dueRatio > 0
  const donutGap = hasBothSegments ? Math.min(6, CIRCUMFERENCE * Math.min(paidRatio, dueRatio) * 0.4) : 0

  const paidArcLength = paidRatio > 0 ? Math.max(2, CIRCUMFERENCE * paidRatio - donutGap) : 0
  const dueArcLength = dueRatio > 0 ? Math.max(2, CIRCUMFERENCE * dueRatio - donutGap) : 0
  const paidArcOffset = hasBothSegments ? -donutGap / 2 : 0
  const dueArcOffset = hasBothSegments ? -(CIRCUMFERENCE * paidRatio + donutGap / 2) : 0

  // Dynamic activities feed from latest repair jobs
  const activitiesFeed = repairJobs.slice(0, 4).map((job) => ({
    id: job.id,
    title: `${job.orderNumber} (${job.customer}) → ${t(`status.${job.status}`, job.status)}`,
    time: job.date || 'Live',
  }))

  const notificationsFeed = [
    { id: 'n1', title: `${activeOrders} ${t('dashboard.activeJobsSubtitle')}`, time: 'Live', type: 'info' },
    ...(lowStockItems.length > 0
      ? [{ id: 'n2', title: `${lowStockItems.length} ${t('dashboard.partsUnderThreshold')}`, time: t('common.warning'), type: 'warning' }]
      : []),
    { id: 'n3', title: `${scheduledApts} ${t('dashboard.pendingAppointmentsSubtitle')}`, time: 'Calendar', type: 'success' },
  ]

  const staffList = employees.slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-5 text-app-text font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.adminOverview')}</h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-app-card border border-app-border text-app-muted rounded-md text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('reports.thisMonth')}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BENTO GRID (High Information Density)                        */}
      {/* ============================================================ */}
      {isInitialLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <StaggerGroup staggerDelay={75} duration={600} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* BENTO TILE 1: Primary Revenue Hero Tile */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2 bg-app-card rounded-lg border border-app-border p-3.5 hover:border-app-border/80 transition-colors flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-app-muted tracking-tight">
                  {t('dashboard.totalRevenue')}
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-app-text mt-0.5 tabular-nums">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-8 h-8 rounded-md bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent flex-shrink-0">
                <CurrencyDollar size={18} weight="bold" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-app-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-[#13F287] font-medium text-[11px]">
                <TrendUp size={12} weight="bold" />
                <span>+12.4%</span>
              </div>
              <span className="text-[11px] text-app-muted tabular-nums">
                ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('common.paid')}
              </span>
            </div>
          </div>

          {/* BENTO TILE 2: Active Repair Jobs */}
          <Link
            to="/repair-jobs"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-lg border border-app-border p-3.5 hover:border-app-border/80 transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-app-muted tracking-tight truncate">{t('dashboard.activeJobs')}</p>
              <Wrench size={15} weight="bold" className="text-blue-500 flex-shrink-0" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-semibold tracking-tight text-app-text tabular-nums">{activeOrders}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/60 flex items-center justify-between text-[11px] text-app-muted">
              <span>{completedOrders} {t('status.Completed')}</span>
              <ArrowUpRight size={12} className="group-hover:text-app-text transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 3: Spare Parts Inventory */}
          <Link
            to="/inventory"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-lg border border-app-border p-3.5 hover:border-app-border/80 transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-app-muted tracking-tight truncate">{t('inventory.stockQty')}</p>
              <Package size={15} weight="bold" className="text-amber-500 flex-shrink-0" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-semibold tracking-tight text-app-text tabular-nums">{totalParts}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/60 flex items-center justify-between text-[11px] text-app-muted">
              <span>{inventory.length} items</span>
              <ArrowUpRight size={12} className="group-hover:text-app-text transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 4: Customers Total */}
          <Link
            to="/customers"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-lg border border-app-border p-3.5 hover:border-app-border/80 transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-app-muted tracking-tight truncate">{t('customers.title')}</p>
              <Users size={15} weight="bold" className="text-sky-500 flex-shrink-0" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-semibold tracking-tight text-app-text tabular-nums">{customers.length}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/60 flex items-center justify-between text-[11px] text-app-muted">
              <span>{t('common.active')}</span>
              <ArrowUpRight size={12} className="group-hover:text-app-text transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 5: Appointments Scheduled */}
          <Link
            to="/appointments"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-lg border border-app-border p-3.5 hover:border-app-border/80 transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-app-muted tracking-tight truncate">{t('appointments.title')}</p>
              <CalendarBlank size={15} weight="bold" className="text-purple-500 flex-shrink-0" />
            </div>
            <div className="mt-1">
              <p className="text-2xl font-semibold tracking-tight text-app-text tabular-nums">{scheduledApts}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/60 flex items-center justify-between text-[11px] text-app-muted">
              <span>{appointments.length} Total</span>
              <ArrowUpRight size={12} className="group-hover:text-app-text transition-colors" />
            </div>
          </Link>
        </StaggerGroup>
      )}

      {/* ============================================================ */}
      {/* QUICK ACTIONS BENTO ROW (Fast Navigation for Mobile Users)  */}
      {/* ============================================================ */}
      <StaggerGroup staggerDelay={50} delay={300} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          to="/repair-jobs"
          className="flex items-center gap-2.5 p-3 rounded-sm bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-sm bg-app-accent/15 text-app-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus size={14} weight="bold" />
          </div>
          <span className="truncate">{t('repairJobs.createJob')}</span>
        </Link>

        <Link
          to="/appointments"
          className="flex items-center gap-2.5 p-3 rounded-sm bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-sm bg-purple-500/15 text-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CalendarBlank size={14} weight="bold" />
          </div>
          <span className="truncate">{t('appointments.newAppointment')}</span>
        </Link>

        <Link
          to="/invoices"
          className="flex items-center gap-2.5 p-3 rounded-sm bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-sm bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Receipt size={14} weight="bold" />
          </div>
          <span className="truncate">{t('invoices.createInvoice')}</span>
        </Link>

        <Link
          to="/inventory"
          className="flex items-center gap-2.5 p-3 rounded-sm bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-sm bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Package size={14} weight="bold" />
          </div>
          <span className="truncate">{t('inventory.addPart')}</span>
        </Link>
      </StaggerGroup>

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN SECTION                                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Columns: Chart Breakdown + Customer Table */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Revenue Breakdown Bento Box */}
          <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm font-bold text-app-text">{t('reports.partsVsLabor')}</h2>
                <p className="text-[11px] text-app-muted">{t('dashboard.totalRevenue')} Distribution</p>
              </div>
              <span className="text-xs font-mono font-bold text-app-accent">${totalRevenue.toFixed(2)}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* SVG Donut Graphic */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center flex-shrink-0 group">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--bg-hover, #27272a)"
                    strokeWidth="11"
                    fill="transparent"
                  />

                  {/* Paid Segment (Emerald / app-accent) */}
                  {paidArcLength > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="var(--accent-primary, #10b981)"
                      strokeWidth={hoveredSegment === 'paid' ? 14 : 11}
                      strokeDasharray={`${paidArcLength} ${CIRCUMFERENCE - paidArcLength}`}
                      strokeDashoffset={paidArcOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        opacity: hoveredSegment && hoveredSegment !== 'paid' ? 0.35 : 1,
                        filter: hoveredSegment === 'paid' ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredSegment('paid')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )}

                  {/* Balance Due Segment (Amber #f59e0b) */}
                  {dueArcLength > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f59e0b"
                      strokeWidth={hoveredSegment === 'due' ? 14 : 11}
                      strokeDasharray={`${dueArcLength} ${CIRCUMFERENCE - dueArcLength}`}
                      strokeDashoffset={dueArcOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        opacity: hoveredSegment && hoveredSegment !== 'due' ? 0.35 : 1,
                        filter: hoveredSegment === 'due' ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredSegment('due')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )}
                </svg>

                {/* Donut Center Display */}
                <button
                  type="button"
                  onClick={() =>
                    setCenterMode((m) =>
                      m === 'collected' ? 'active' : m === 'active' ? 'revenue' : 'collected'
                    )
                  }
                  title="Click to cycle metric readout"
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 rounded-full cursor-pointer focus:outline-none transition-transform active:scale-95 select-none"
                >
                  {hoveredSegment === 'paid' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-[#13F287] tabular-nums transition-colors">
                        ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">
                        {t('common.paid')} ({paidPercent}%)
                      </span>
                    </>
                  ) : hoveredSegment === 'due' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-amber-500 tabular-nums transition-colors">
                        ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">
                        {t('invoices.balanceDue')} ({duePercent}%)
                      </span>
                    </>
                  ) : hoveredSegment === 'inventory' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-sky-500 tabular-nums transition-colors">
                        ${inventoryTotalVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-semibold uppercase tracking-wider">
                        {totalParts} {t('common.total')}
                      </span>
                    </>
                  ) : centerMode === 'active' ? (
                    <>
                      <span className="text-xl font-bold text-app-text tabular-nums">{activeOrders}</span>
                      <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                        {t('status.Active')}
                      </span>
                      <span className="text-[9px] font-mono text-app-muted/70">
                        {paidPercent}% {t('common.paid').toLowerCase()}
                      </span>
                    </>
                  ) : centerMode === 'revenue' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-app-text tabular-nums">
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                        {t('dashboard.totalRevenue')}
                      </span>
                      <span className="text-[9px] font-mono text-app-accent">
                        {paidPercent}% {t('common.paid').toLowerCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-app-text tabular-nums">{paidPercent}%</span>
                      <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                        {t('common.paid')}
                      </span>
                      <span className="text-[9px] font-mono text-app-muted/70">
                        {activeOrders} {t('status.Active').toLowerCase()}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Breakdown Legend List */}
              <div className="flex-1 space-y-2 w-full">
                <div
                  onMouseEnter={() => setHoveredSegment('paid')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center justify-between p-2.5 rounded-sm border cursor-pointer transition-all duration-150 ${
                    hoveredSegment === 'paid'
                      ? 'bg-app-hover border-app-accent/60 shadow-sm ring-1 ring-app-accent/20'
                      : 'bg-app-hover border-app-border/40 hover:border-app-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-app-accent flex-shrink-0" />
                    <span className="text-xs font-medium text-app-text">
                      {t('common.paid')} ({paidPercent}%)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-app-accent tabular-nums">${totalPaid.toFixed(2)}</span>
                </div>

                <div
                  onMouseEnter={() => setHoveredSegment('due')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center justify-between p-2.5 rounded-sm border cursor-pointer transition-all duration-150 ${
                    hoveredSegment === 'due'
                      ? 'bg-app-hover border-amber-500/60 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-app-hover border-app-border/40 hover:border-app-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-app-text">
                      {t('invoices.balanceDue')} ({duePercent}%)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-500 tabular-nums">${balanceDue.toFixed(2)}</span>
                </div>

                <div
                  onMouseEnter={() => setHoveredSegment('inventory')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center justify-between p-2.5 rounded-sm border cursor-pointer transition-all duration-150 ${
                    hoveredSegment === 'inventory'
                      ? 'bg-app-hover border-sky-500/60 shadow-sm ring-1 ring-sky-500/20'
                      : 'bg-app-hover border-app-border/40 hover:border-app-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-app-text">
                      {t('nav.inventory')} ({totalParts} {t('common.total')})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-app-text tabular-nums">
                    ${inventoryTotalVal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Directory Mini Bento Table */}
          <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-app-text">{t('customers.title')}</h2>
                <p className="text-[11px] text-app-muted">{customers.length} registered accounts</p>
              </div>
              <Link to="/customers" className="text-xs text-app-accent hover:underline font-semibold flex items-center gap-1">
                {t('common.view')} {t('common.all')} <ArrowUpRight size={13} weight="bold" />
              </Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead className="text-right">{t('customers.totalSpent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-app-hover border border-app-border flex items-center justify-center text-app-muted flex-shrink-0 font-bold text-[10px]">
                          {customer.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-app-text group-hover:text-app-accent transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-app-muted font-mono">{customer.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-app-muted">{customer.phone}</TableCell>
                    <TableCell className="font-bold text-app-text text-right tabular-nums">
                      {customer.totalSpent || '$0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right 1 Column Bento Panels */}
        <div className="space-y-4 sm:space-y-6">
          {/* Live Alerts Bento Card */}
          <div className="bg-app-card rounded-sm border border-app-border p-3 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('common.liveAlerts')}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {notificationsFeed.length} {t('common.active')}
              </span>
            </div>
            <div className="space-y-2.5">
              {notificationsFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-sm bg-app-hover/50 border border-app-border/40">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      item.type === 'warning' ? 'bg-amber-500' : item.type === 'success' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}
                  />
                  <div className="truncate flex-1">
                    <p className="text-xs font-semibold text-app-text truncate">{item.title}</p>
                    <p className="text-[10px] text-app-muted">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Repair Orders Activity */}
          <div className="bg-app-card rounded-sm border border-app-border p-3 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('dashboard.recentJobs')}</h3>
              <Link to="/repair-jobs" className="text-[11px] text-app-accent hover:underline">
                {t('common.view')} ▾
              </Link>
            </div>
            <div className="space-y-2">
              {activitiesFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-sm hover:bg-app-hover transition-colors">
                  <div className="w-6 h-6 rounded-sm bg-app-hover text-app-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench size={13} weight="bold" />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-medium text-app-text truncate">{act.title}</p>
                    <p className="text-[10px] text-app-muted font-mono">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workshop Staff Roster */}
          <div className="bg-app-card rounded-sm border border-app-border p-3 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('employees.title')}</h3>
              <Link to="/employees" className="text-[11px] text-app-accent hover:underline">
                {staffList.length} staff
              </Link>
            </div>
            <div className="space-y-1.5">
              {staffList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-sm hover:bg-app-hover text-app-muted transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-sm bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-xs font-bold text-app-accent flex-shrink-0">
                      {m.name ? m.name[0] : 'S'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-app-text truncate">{m.name}</p>
                      <p className="text-[10px] text-app-muted truncate">{m.roleTitle || m.department}</p>
                    </div>
                  </div>

                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      title={m.phone}
                      className="w-7 h-7 rounded-sm bg-app-hover text-app-muted hover:text-app-text flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Phone size={13} weight="bold" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
