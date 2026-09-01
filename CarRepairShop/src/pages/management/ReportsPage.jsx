import { useState } from 'react'
import { FileText, DownloadSimple, CurrencyDollar, Wrench, Package, Users } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '../../hooks/useInvoices'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'
import { useCustomers } from '../../hooks/useCustomers'
import { useEmployees } from '../../hooks/useEmployees'
import { CardSkeleton } from '../../components/ui'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState('All')

  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices()
  const { data: repairJobs = [] } = useRepairJobs()
  const { data: inventory = [] } = useInventory()
  const { data: customers = [] } = useCustomers()
  const { data: employees = [] } = useEmployees()

  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const completedRepairs = repairJobs.filter((j) => j.status === 'Completed').length
  const totalStockUnits = inventory.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const presentEmployees = employees.filter((e) => e.attendanceToday === 'Present').length

  const currentYear = new Date().getFullYear()
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const reportsList = [
    {
      id: 1,
      title: t('reports.monthlyRevenue'),
      category: 'Financial',
      date: currentMonthName,
      format: 'CSV / JSON',
      data: invoices,
      summary: `$${totalInvoiced.toFixed(2)} ${t('invoices.amount')} · $${totalCollected.toFixed(2)} ${t('common.paid')}`,
    },
    {
      id: 2,
      title: t('titles.repairJobsOrders'),
      category: 'Operations',
      date: currentMonthName,
      format: 'CSV / JSON',
      data: repairJobs,
      summary: `${repairJobs.length} ${t('common.total')} (${completedRepairs} ${t('status.Completed')})`,
    },
    {
      id: 3,
      title: t('titles.sparePartsInventory'),
      category: 'Inventory',
      date: `Q3 ${currentYear}`,
      format: 'CSV / JSON',
      data: inventory,
      summary: `${inventory.length} items (${totalStockUnits} ${t('inventory.stockQty')})`,
    },
    {
      id: 4,
      title: t('titles.customerDirectory'),
      category: 'Customers',
      date: `${currentYear} YTD`,
      format: 'CSV / JSON',
      data: customers,
      summary: `${customers.length} ${t('customers.vehiclesCount')}`,
    },
    {
      id: 5,
      title: t('titles.staffAttendance'),
      category: 'Management',
      date: 'Live Today',
      format: 'CSV / JSON',
      data: employees,
      summary: `${employees.length} ${t('employees.title')} (${presentEmployees} ${t('status.Present')})`,
    },
  ]

  const categories = ['All', 'Financial', 'Operations', 'Inventory', 'Customers', 'Management']

  const filtered = selectedCategory === 'All' ? reportsList : reportsList.filter((r) => r.category === selectedCategory)

  // Export specific dataset as downloadable JSON
  const handleExportData = (title, data) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Export all workshop data in a single comprehensive archive
  const handleExportAll = () => {
    const fullReport = {
      generatedAt: new Date().toISOString(),
      workshopSummary: {
        totalInvoiced,
        totalCollected,
        totalJobs: repairJobs.length,
        completedJobs: completedRepairs,
        totalInventoryParts: inventory.length,
        totalCustomers: customers.length,
        totalStaff: employees.length,
      },
      invoices,
      repairJobs,
      inventory,
      customers,
      employees,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullReport, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `garage_full_audit_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="space-y-6 text-app-text font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.analyticsReports')}</h1>
          <p className="text-xs text-app-muted mt-1">{t('reports.subtitle')}</p>
        </div>
        <button
          onClick={handleExportAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
        >
          <DownloadSimple size={16} weight="bold" />
          {t('reports.exportReport')} (Full System Archive)
        </button>
      </div>

      {/* Metric Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loadingInvoices ? (
          Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
        ) : (
          <>
            <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('dashboard.totalRevenue')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">${totalInvoiced.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent">
                  <CurrencyDollar size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('repairJobs.title')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{completedRepairs} / {repairJobs.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                  <Wrench size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('inventory.stockQty')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{totalStockUnits}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Package size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-2xl border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('customers.title')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{customers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500">
                  <Users size={22} weight="bold" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
            }`}
          >
            {cat === 'All' ? t('common.all') : cat}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden">
        <div className="divide-y divide-app-border">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-app-hover/50 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent flex-shrink-0 mt-0.5">
                  <FileText size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-app-text">{report.title}</h3>
                  <p className="text-xs text-app-muted mt-0.5">{report.summary}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-hover text-app-muted">
                      {report.category}
                    </span>
                    <span className="text-[10px] text-app-muted">· {report.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleExportData(report.title, report.data)}
                  className="px-3 py-1.5 bg-app-hover hover:bg-app-border border border-app-border rounded-xl text-xs font-semibold text-app-text transition-colors flex items-center gap-1.5 shadow-subtle"
                >
                  <DownloadSimple size={14} weight="bold" />
                  {t('common.export')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
