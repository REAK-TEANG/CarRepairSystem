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
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CardSkeleton } from '../../components/ui'
import { useInvoices } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'
import { useEmployees } from '../../hooks/useEmployees'
import { useAppointments } from '../../hooks/useAppointments'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices()
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers()
  const { data: repairJobs = [], isLoading: loadingJobs } = useRepairJobs()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: employees = [] } = useEmployees()
  const { data: appointments = [] } = useAppointments()

  const isInitialLoading = (loadingInvoices || loadingJobs || loadingCustomers || loadingInventory) && invoices.length === 0

  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const activeOrders = repairJobs.filter((j) => j.status !== 'Completed').length
  const completedOrders = repairJobs.filter((j) => j.status === 'Completed').length
  const totalParts = inventory.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const lowStockItems = inventory.filter((p) => p.stockQty <= (p.minThreshold || 5))
  const scheduledApts = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length

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
    <div className="space-y-4 sm:space-y-6 text-app-text font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.adminOverview')}</h1>
          <p className="text-xs text-app-muted mt-0.5 font-normal">{t('dashboard.adminSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-card border border-app-border text-app-muted rounded-xl text-xs font-medium shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('reports.thisMonth')} ▾
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE & DESKTOP BENTO GRID (High Information Density)      */}
      {/* ============================================================ */}
      {isInitialLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* BENTO TILE 1: Primary Revenue Hero Tile (Spans 2 on Mobile) */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-app-card via-app-card to-app-hover/50 rounded-2xl border border-app-border p-4 sm:p-5 shadow-card relative overflow-hidden flex flex-col justify-between group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-app-muted uppercase tracking-wider">
                  {t('dashboard.totalRevenue')}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-app-text mt-1 tabular-nums">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent shadow-subtle flex-shrink-0">
                <CurrencyDollar size={22} weight="bold" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-app-border/70 flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#13F287] font-semibold text-[11px]">
                <TrendUp size={14} weight="bold" />
                <span>+12.4% {t('reports.thisMonth')}</span>
              </div>
              <span className="text-[11px] text-app-muted tabular-nums">
                ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('common.paid')}
              </span>
            </div>

            {/* Subtle decorative sparkline glow */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-app-accent/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* BENTO TILE 2: Active Repair Jobs */}
          <Link
            to="/repair-jobs"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-2xl border border-app-border p-3.5 sm:p-4 shadow-card hover:border-app-accent/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Wrench size={16} weight="bold" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-app-text tabular-nums">{activeOrders}</p>
              <p className="text-[10px] sm:text-xs text-app-muted font-medium mt-0.5 truncate">{t('dashboard.activeJobs')}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/50 flex items-center justify-between text-[10px] text-app-muted">
              <span>{completedOrders} {t('status.Completed')}</span>
              <ArrowUpRight size={12} className="group-hover:text-app-accent transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 3: Spare Parts Inventory */}
          <Link
            to="/inventory"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-2xl border border-app-border p-3.5 sm:p-4 shadow-card hover:border-app-accent/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              {lowStockItems.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {lowStockItems.length} Low
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Package size={16} weight="bold" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-app-text tabular-nums">{totalParts}</p>
              <p className="text-[10px] sm:text-xs text-app-muted font-medium mt-0.5 truncate">{t('inventory.stockQty')}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/50 flex items-center justify-between text-[10px] text-app-muted">
              <span>{inventory.length} items</span>
              <ArrowUpRight size={12} className="group-hover:text-app-accent transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 4: Customers Total */}
          <Link
            to="/customers"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-2xl border border-app-border p-3.5 sm:p-4 shadow-card hover:border-app-accent/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                +12%
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Users size={16} weight="bold" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-app-text tabular-nums">{customers.length}</p>
              <p className="text-[10px] sm:text-xs text-app-muted font-medium mt-0.5 truncate">{t('customers.title')}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/50 flex items-center justify-between text-[10px] text-app-muted">
              <span>{t('common.active')}</span>
              <ArrowUpRight size={12} className="group-hover:text-app-accent transition-colors" />
            </div>
          </Link>

          {/* BENTO TILE 5: Appointments Scheduled */}
          <Link
            to="/appointments"
            className="col-span-1 md:col-span-1 lg:col-span-1 bg-app-card rounded-2xl border border-app-border p-3.5 sm:p-4 shadow-card hover:border-app-accent/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <CalendarBlank size={16} weight="bold" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-app-text tabular-nums">{scheduledApts}</p>
              <p className="text-[10px] sm:text-xs text-app-muted font-medium mt-0.5 truncate">{t('appointments.title')}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-app-border/50 flex items-center justify-between text-[10px] text-app-muted">
              <span>{appointments.length} Total</span>
              <ArrowUpRight size={12} className="group-hover:text-app-accent transition-colors" />
            </div>
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK ACTIONS BENTO ROW (Fast Navigation for Mobile Users)  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          to="/repair-jobs"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-lg bg-app-accent/15 text-app-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus size={14} weight="bold" />
          </div>
          <span className="truncate">{t('repairJobs.createJob')}</span>
        </Link>

        <Link
          to="/appointments"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CalendarBlank size={14} weight="bold" />
          </div>
          <span className="truncate">{t('appointments.newAppointment')}</span>
        </Link>

        <Link
          to="/invoices"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Receipt size={14} weight="bold" />
          </div>
          <span className="truncate">{t('invoices.createInvoice')}</span>
        </Link>

        <Link
          to="/inventory"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-app-card border border-app-border hover:border-app-accent/40 hover:bg-app-hover transition-all text-xs font-semibold text-app-text shadow-subtle group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Package size={14} weight="bold" />
          </div>
          <span className="truncate">{t('inventory.addPart')}</span>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN SECTION                                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Columns: Chart Breakdown + Customer Table */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Revenue Breakdown Bento Box */}
          <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-6 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-sm font-bold text-app-text">{t('reports.partsVsLabor')}</h2>
                <p className="text-[11px] text-app-muted">{t('dashboard.totalRevenue')} Distribution</p>
              </div>
              <span className="text-xs font-mono font-bold text-app-accent">${totalRevenue.toFixed(2)}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* SVG Donut Graphic */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="var(--bg-hover, #27272a)" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--accent-primary, #3b82f6)"
                    strokeWidth="12"
                    strokeDasharray="238"
                    strokeDashoffset="70"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="var(--accent-secondary, #13F287)"
                    strokeWidth="12"
                    strokeDasharray="238"
                    strokeDashoffset="180"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-app-text">{repairJobs.length}</span>
                  <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                    {t('status.Active')}
                  </span>
                </div>
              </div>

              {/* Breakdown Legend List */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-app-accent" />
                    <span className="text-xs font-medium text-app-text">
                      {t('common.paid')} ({totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}%)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-app-accent tabular-nums">${totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-app-text">
                      {t('invoices.balanceDue')} ({totalRevenue > 0 ? Math.round((Math.max(0, totalRevenue - totalPaid) / totalRevenue) * 100) : 0}%)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-500 tabular-nums">${Math.max(0, totalRevenue - totalPaid).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-medium text-app-text">{t('nav.inventory')} ({totalParts} {t('common.total')})</span>
                  </div>
                  <span className="text-xs font-bold text-app-text tabular-nums">
                    ${inventory.reduce((sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Directory Mini Bento Table */}
          <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-6 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-app-text">{t('customers.title')}</h2>
                <p className="text-[11px] text-app-muted">{customers.length} registered accounts</p>
              </div>
              <Link to="/customers" className="text-xs text-app-accent hover:underline font-semibold flex items-center gap-1">
                {t('common.view')} {t('common.all')} <ArrowUpRight size={13} weight="bold" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-app-muted text-left border-b border-app-border/60">
                    <th className="pb-3 font-semibold">{t('common.name')}</th>
                    <th className="pb-3 font-semibold">{t('common.phone')}</th>
                    <th className="pb-3 font-semibold text-right">{t('customers.totalSpent')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/40">
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="hover:bg-app-hover transition-colors group">
                      <td className="py-2.5 sm:py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-app-hover border border-app-border flex items-center justify-center text-app-muted flex-shrink-0 font-bold text-[11px]">
                            {customer.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-app-text group-hover:text-app-accent transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-[10px] text-app-muted">{customer.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 font-mono text-app-muted">{customer.phone}</td>
                      <td className="py-2.5 sm:py-3 font-bold text-app-text text-right tabular-nums">
                        {customer.totalSpent || '$0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column Bento Panels */}
        <div className="space-y-4 sm:space-y-6">
          {/* Live Alerts Bento Card */}
          <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-5 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('common.liveAlerts')}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {notificationsFeed.length} {t('common.active')}
              </span>
            </div>
            <div className="space-y-2.5">
              {notificationsFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-app-hover/50 border border-app-border/40">
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
          <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-5 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('dashboard.recentJobs')}</h3>
              <Link to="/repair-jobs" className="text-[11px] text-app-accent hover:underline">
                {t('common.view')} ▾
              </Link>
            </div>
            <div className="space-y-2">
              {activitiesFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-app-hover transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-app-hover text-app-muted flex items-center justify-center flex-shrink-0 mt-0.5">
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
          <div className="bg-app-card rounded-2xl border border-app-border p-4 sm:p-5 shadow-card transition-colors duration-200">
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
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-app-hover text-app-muted transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-xs font-bold text-app-accent flex-shrink-0">
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
                      className="w-7 h-7 rounded-lg bg-app-hover text-app-muted hover:text-app-text flex items-center justify-center transition-colors flex-shrink-0"
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
