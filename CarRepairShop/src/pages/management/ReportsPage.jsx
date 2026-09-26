import { useState } from 'react'
import { FileText, DownloadSimple, CurrencyDollar, Wrench, Package, Users } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useReports } from '../../hooks/useReports'
import { CardSkeleton } from '../../components/ui'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState('All')

  const { data: reportsData, isLoading } = useReports()
  
  const metrics = reportsData?.metrics || {}
  const reportsList = reportsData?.reports || []
  
  const totalInvoiced = metrics.totalRevenue || 0
  const totalCollected = metrics.totalCollected || 0
  const completedRepairs = metrics.completedRepairs || 0
  const totalRepairJobs = metrics.totalRepairJobs || 0
  const totalStockUnits = metrics.totalStockUnits || 0
  const totalCustomers = metrics.totalCustomers || 0
  const totalEmployees = metrics.totalEmployees || 0

  const categories = ['All', 'Financial', 'Operations', 'Inventory', 'Customers', 'Management']

  const filtered = selectedCategory === 'All' ? reportsList : reportsList.filter((r) => r.category === selectedCategory)

  // Export specific dataset as downloadable JSON
  const handleExportData = (title, data) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data || [], null, 2))
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
        totalJobs: totalRepairJobs,
        completedJobs: completedRepairs,
        totalInventoryParts: metrics.totalSpareParts || 0,
        totalCustomers,
        totalStaff: totalEmployees,
      }
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover active:scale-[0.98] text-app-accentText font-semibold rounded-sm text-xs transition-colors shadow-subtle"
        >
          <DownloadSimple size={16} weight="bold" />
          {t('reports.exportReport')} (Full System Archive)
        </button>
      </div>

      {/* Metric Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
        ) : (
          <>
            <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('dashboard.totalRevenue')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">${totalInvoiced.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-app-accent/15 flex items-center justify-center text-app-accent">
                  <CurrencyDollar size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('repairJobs.title')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{completedRepairs} / {totalRepairJobs}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                  <Wrench size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('inventory.stockQty')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{totalStockUnits}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Package size={22} weight="bold" />
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-sm border border-app-border p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">{t('customers.title')}</p>
                  <p className="text-xl font-bold text-app-text mt-0.5 tabular-nums">{totalCustomers}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-sky-500/15 flex items-center justify-center text-sky-500">
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
            className={`px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover active:scale-[0.98] hover:text-app-text'
            }`}
          >
            {cat === 'All' ? t('common.all') : cat}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-app-card rounded-sm border border-app-border shadow-card overflow-hidden">
        <div className="divide-y divide-app-border">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-app-hover /50 active:scale-[0.98] transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-sm bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent flex-shrink-0 mt-0.5">
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
                  className="px-3 py-1.5 bg-app-hover hover:bg-app-border border border-app-border rounded-sm text-xs font-semibold text-app-text transition-colors flex items-center gap-1.5 shadow-subtle"
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
