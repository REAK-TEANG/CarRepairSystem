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
  CaretDown,
} from '@phosphor-icons/react'
import { useState, useMemo, useRef, useEffect } from 'react'
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

function parseItemDate(item) {
  const raw = item?.issueDate || item?.issued_date || item?.date || item?.createdAt || item?.created_at
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { data: rawInvoices = [], isLoading: loadingInvoices } = useInvoices({ all: true })
  const { data: rawCustomers = [], isLoading: loadingCustomers } = useCustomers({ all: true })
  const { data: rawRepairJobs = [], isLoading: loadingJobs } = useRepairJobs({ all: true })
  const { data: rawInventory = [], isLoading: loadingInventory } = useInventory({ all: true })
  const { data: rawEmployees = [] } = useEmployees({ all: true })
  const { data: rawAppointments = [] } = useAppointments({ all: true })

  const invoices = useMemo(() => (Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices?.data || [])), [rawInvoices])
  const customers = useMemo(() => (Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || [])), [rawCustomers])
  const repairJobs = useMemo(() => (Array.isArray(rawRepairJobs) ? rawRepairJobs : (rawRepairJobs?.data || [])), [rawRepairJobs])
  const inventory = useMemo(() => (Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])), [rawInventory])
  const employees = useMemo(() => (Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees?.data || [])), [rawEmployees])
  const appointments = useMemo(() => (Array.isArray(rawAppointments) ? rawAppointments : (rawAppointments?.data || [])), [rawAppointments])

  const isInitialLoading = (loadingInvoices || loadingJobs || loadingCustomers || loadingInventory) && invoices.length === 0

  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'this_week' | 'this_month' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const filterDropdownRef = useRef(null)

  useEffect(() => {
    if (!isFilterDropdownOpen) return
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFilterDropdownOpen])

  const activeRange = useMemo(() => {
    if (dateFilter === 'all') {
      return null // Unrestricted: includes all records
    }
    const now = new Date()
    if (dateFilter === 'this_week') {
      const day = now.getDay()
      const distanceToMonday = (day + 6) % 7
      const start = new Date(now)
      start.setDate(now.getDate() - distanceToMonday)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (dateFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
    if (dateFilter === 'custom' && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00`)
      const end = new Date(`${customEnd}T23:59:59.999`)
      return { start, end }
    }
    return null
  }, [dateFilter, customStart, customEnd])

  const filteredInvoices = useMemo(() => {
    if (!activeRange) return invoices
    return invoices.filter((i) => {
      const d = parseItemDate(i)
      return d ? d >= activeRange.start && d <= activeRange.end : true
    })
  }, [invoices, activeRange])

  const filteredRepairJobs = useMemo(() => {
    if (!activeRange) return repairJobs
    return repairJobs.filter((j) => {
      const d = parseItemDate(j)
      return d ? d >= activeRange.start && d <= activeRange.end : true
    })
  }, [repairJobs, activeRange])

  const filteredAppointments = useMemo(() => {
    if (!activeRange) return appointments
    return appointments.filter((a) => {
      const d = parseItemDate(a)
      return d ? d >= activeRange.start && d <= activeRange.end : true
    })
  }, [appointments, activeRange])

  const [hoveredSegment, setHoveredSegment] = useState(null)
  const [centerMode, setCenterMode] = useState('collected') // 'collected' | 'active' | 'revenue'

  const totalRevenue = filteredInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalPaid = filteredInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const balanceDue = Math.max(0, totalRevenue - totalPaid)
  const totalParts = inventory.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const inventoryTotalVal = inventory.reduce((sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0), 0)

  // 3-Part Financial & Asset Distribution
  const combinedTotal = totalPaid + balanceDue + inventoryTotalVal
  const paidPercent = combinedTotal > 0 ? Math.round((totalPaid / combinedTotal) * 100) : 0
  const duePercent = combinedTotal > 0 ? Math.round((balanceDue / combinedTotal) * 100) : 0
  const inventoryPercent = Math.max(0, 100 - paidPercent - duePercent)

  const activeOrders = filteredRepairJobs.filter((j) => j.status !== 'Completed').length
  const completedOrders = filteredRepairJobs.filter((j) => j.status === 'Completed').length
  const lowStockItems = inventory.filter((p) => p.stockQty <= (p.minThreshold || 5))
  const scheduledApts = filteredAppointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length

  // SVG Donut geometry & dynamic arc lengths (3 parts: Paid, Balance Due, Inventory Assets)
  const CIRCUMFERENCE = 2 * Math.PI * 38 // 238.761
  const paidRatio = combinedTotal > 0 ? totalPaid / combinedTotal : 0
  const dueRatio = combinedTotal > 0 ? balanceDue / combinedTotal : 0
  const inventoryRatio = combinedTotal > 0 ? Math.max(0, 1 - paidRatio - dueRatio) : 0

  const activeSegmentsCount = [paidRatio, dueRatio, inventoryRatio].filter((r) => r > 0.01).length
  const donutGap = activeSegmentsCount > 1 ? 3.5 : 0

  const paidArcLength = paidRatio > 0 ? Math.max(2, CIRCUMFERENCE * paidRatio - donutGap) : 0
  const dueArcLength = dueRatio > 0 ? Math.max(2, CIRCUMFERENCE * dueRatio - donutGap) : 0
  const inventoryArcLength = inventoryRatio > 0 ? Math.max(2, CIRCUMFERENCE * inventoryRatio - donutGap) : 0

  const paidArcOffset = -donutGap / 2
  const dueArcOffset = -(CIRCUMFERENCE * paidRatio + donutGap / 2)
  const inventoryArcOffset = -(CIRCUMFERENCE * (paidRatio + dueRatio) + donutGap / 2)

  // Dynamic activities feed from latest repair jobs
  const activitiesFeed = filteredRepairJobs.slice(0, 4).map((job) => ({
    id: job.id,
    title: `${job.orderNumber} (${job.customer}) → ${t(`status.${job.status}`, job.status)}`,
    time: job.date || '',
  }))

  const notificationsFeed = [
    { id: 'n1', title: `${activeOrders} ${t('dashboard.activeJobsSubtitle')}`, time: '', type: 'info' },
    ...(lowStockItems.length > 0
      ? [{ id: 'n2', title: `${lowStockItems.length} ${t('dashboard.partsUnderThreshold')}`, time: t('common.warning'), type: 'warning' }]
      : []),
    { id: 'n3', title: `${scheduledApts} ${t('dashboard.pendingAppointmentsSubtitle')}`, time: '', type: 'success' },
  ]

  const staffList = employees.slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-5 text-app-text font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-app-text">{t('titles.adminOverview')}</h1>
        <div ref={filterDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-app-card border border-app-border hover:border-app-accent/50 text-app-text rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer select-none"
          >
            <CalendarBlank size={14} className="text-app-muted" weight="bold" />
            <span>
              {dateFilter === 'all'
                ? t('common.all', 'All')
                : dateFilter === 'this_week'
                ? t('reports.thisWeek')
                : dateFilter === 'this_month'
                ? t('reports.thisMonth')
                : `${customStart} → ${customEnd}`}
            </span>
            <CaretDown size={12} className={`text-app-muted transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-app-card border border-app-border rounded-lg shadow-xl p-3 z-50 animate-modal-content space-y-3">
              <div className="grid grid-cols-4 gap-1 p-1 bg-app-hover/60 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('all')
                    setIsFilterDropdownOpen(false)
                  }}
                  className={`py-1 px-1.5 text-xs font-semibold rounded transition-colors text-center cursor-pointer ${
                    dateFilter === 'all'
                      ? 'bg-app-accent text-app-accentText shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  {t('common.all', 'All')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('this_week')
                    setIsFilterDropdownOpen(false)
                  }}
                  className={`py-1 px-1.5 text-xs font-semibold rounded transition-colors text-center cursor-pointer ${
                    dateFilter === 'this_week'
                      ? 'bg-app-accent text-app-accentText shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  {t('reports.thisWeek')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('this_month')
                    setIsFilterDropdownOpen(false)
                  }}
                  className={`py-1 px-1.5 text-xs font-semibold rounded transition-colors text-center cursor-pointer ${
                    dateFilter === 'this_month'
                      ? 'bg-app-accent text-app-accentText shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  {t('reports.thisMonth')}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('custom')}
                  className={`py-1 px-1.5 text-xs font-semibold rounded transition-colors text-center cursor-pointer ${
                    dateFilter === 'custom'
                      ? 'bg-app-accent text-app-accentText shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  {t('reports.customDate', 'Custom')}
                </button>
              </div>

              {dateFilter === 'custom' && (
                <div className="space-y-2 pt-1 border-t border-app-border">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-app-muted font-medium mb-1">
                        {t('reports.startDate', 'Start Date')}
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-2 py-1 bg-app-input border border-app-border rounded text-xs text-app-text focus:outline-none focus:border-app-accent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-app-muted font-medium mb-1">
                        {t('reports.endDate', 'End Date')}
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-2 py-1 bg-app-input border border-app-border rounded text-xs text-app-text focus:outline-none focus:border-app-accent font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(false)}
                    className="w-full py-1.5 px-3 bg-app-accent text-app-accentText font-semibold rounded-md text-xs hover:bg-app-accentHover transition-colors cursor-pointer text-center"
                  >
                    {t('reports.apply', 'Apply Filter')}
                  </button>
                </div>
              )}
            </div>
          )}
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
                <h2 className="text-sm font-semibold text-app-text">{t('reports.partsVsLabor')}</h2>
                <p className="text-[11px] text-app-muted">Total Revenue & Inventory Distribution</p>
              </div>
              <span className="text-xs font-mono font-bold text-app-accent">${totalRevenue.toFixed(2)}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* SVG Donut Graphic (3 Parts: Paid, Balance Due, Inventory & Parts) */}
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

                  {/* Part 1: Paid Segment (Emerald / app-accent) */}
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

                  {/* Part 2: Balance Due Segment (Amber #f59e0b) */}
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

                  {/* Part 3: Inventory & Parts Segment (Sky Blue #0ea5e9) */}
                  {inventoryArcLength > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0ea5e9"
                      strokeWidth={hoveredSegment === 'inventory' ? 14 : 11}
                      strokeDasharray={`${inventoryArcLength} ${CIRCUMFERENCE - inventoryArcLength}`}
                      strokeDashoffset={inventoryArcOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        opacity: hoveredSegment && hoveredSegment !== 'inventory' ? 0.35 : 1,
                        filter: hoveredSegment === 'inventory' ? 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.45))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredSegment('inventory')}
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
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('common.paid')} ({paidPercent}%)
                      </span>
                    </>
                  ) : hoveredSegment === 'due' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-amber-500 tabular-nums transition-colors">
                        ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('invoices.balanceDue')} ({duePercent}%)
                      </span>
                    </>
                  ) : hoveredSegment === 'inventory' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-sky-500 tabular-nums transition-colors">
                        ${inventoryTotalVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('nav.inventory')} ({inventoryPercent}%)
                      </span>
                    </>
                  ) : centerMode === 'active' ? (
                    <>
                      <span className="text-xl font-bold text-app-text tabular-nums">{activeOrders}</span>
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('status.Active')}
                      </span>
                      <span className="text-[9px] font-mono text-app-muted/70">
                        {paidPercent}% {t('common.paid').toLowerCase()}
                      </span>
                    </>
                  ) : centerMode === 'revenue' ? (
                    <>
                      <span className="text-sm sm:text-base font-bold text-app-text tabular-nums">
                        ${combinedTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('common.total')} Assets
                      </span>
                      <span className="text-[9px] font-mono text-app-muted/70">
                        {totalParts} {t('common.total').toLowerCase()} parts
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-app-text tabular-nums">{paidPercent}%</span>
                      <span className="text-[10px] text-app-muted font-medium">
                        {t('common.paid')}
                      </span>
                      <span className="text-[9px] font-mono text-app-muted/70">
                        {activeOrders} {t('status.Active').toLowerCase()}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Breakdown Legend List (3 Parts) */}
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
                      {t('nav.inventory')} & Parts ({inventoryPercent}%)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-sky-500 tabular-nums">
                    ${inventoryTotalVal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Directory Mini Bento Table */}
          <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-app-text">{t('customers.title')}</h2>
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
              <h3 className="text-xs font-semibold text-app-text">{t('common.liveAlerts')}</h3>
              <span className="text-xs font-mono text-app-muted">
                {notificationsFeed.length}
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
              <h3 className="text-xs font-semibold text-app-text">{t('dashboard.recentJobs')}</h3>
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
              <h3 className="text-xs font-semibold text-app-text">{t('employees.title')}</h3>
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
