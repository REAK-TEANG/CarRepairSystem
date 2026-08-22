import { useState } from 'react'
import { FileText, DownloadSimple } from '@phosphor-icons/react'

const reportsList = [
  { id: 1, title: 'Monthly Revenue & Profit Breakdown', category: 'Financial', date: 'August 2026', format: 'PDF / Excel' },
  { id: 2, title: 'Mechanic Workload & Efficiency Report', category: 'Operations', date: 'August 2026', format: 'PDF' },
  { id: 3, title: 'Spare Parts Inventory Valuation & Stock Turnover', category: 'Inventory', date: 'Q3 2026', format: 'Excel' },
  { id: 4, title: 'Customer Retention & Lifetime Value Analysis', category: 'Marketing', date: '2026 YTD', format: 'PDF' },
  { id: 5, title: 'Vehicle Service History & Warranty Summary', category: 'Service', date: 'Past 12 Months', format: 'PDF / Excel' },
]

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Financial', 'Operations', 'Inventory', 'Marketing', 'Service']

  const filtered = selectedCategory === 'All'
    ? reportsList
    : reportsList.filter((r) => r.category === selectedCategory)

  return (
    <div className="space-y-6 text-app-text font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-xs text-app-muted mt-1">Export financial summaries, technician metrics, and audit logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-app-card hover:bg-app-hover border border-app-border rounded-lg text-xs font-medium text-app-text transition-colors shadow-subtle">
            <DownloadSimple size={15} /> Export All
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'bg-app-card text-app-muted border border-app-border hover:bg-app-hover hover:text-app-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((report) => (
          <div key={report.id} className="bg-app-card rounded-xl border border-app-border p-5 shadow-card flex flex-col justify-between hover:border-app-border/80 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-app-hover text-app-muted font-semibold uppercase tracking-wider">
                  {report.category}
                </span>
                <span className="text-xs text-app-muted">{report.date}</span>
              </div>
              <h3 className="text-sm font-semibold text-app-text mb-2 leading-snug">{report.title}</h3>
              <p className="text-xs text-app-muted">Format: {report.format}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-app-border flex items-center justify-between">
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-app-accent hover:underline">
                <FileText size={15} /> View Online
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-hover hover:bg-app-border rounded-lg text-xs font-medium text-app-text transition-colors">
                <DownloadSimple size={13} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
