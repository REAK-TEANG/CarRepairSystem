import {
  CurrencyDollar,
  Wrench,
  Users,
  DotsThreeVertical,
  Phone,
  ChatCircleText,
  TrendUp,
  CheckCircle,
  Package,
} from '@phosphor-icons/react'
import StatCard from '../../components/ui/StatCard'
import { useInvoices } from '../../hooks/useInvoices'
import { useCustomers } from '../../hooks/useCustomers'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'

const notificationsFeed = [
  { id: 1, title: 'Optimistic sync engine active.', time: 'Realtime' },
  { id: 2, title: 'New repair order dispatched to bay.', time: '59 Minutes ago' },
  { id: 3, title: 'Inventory replenishment arrived.', time: '12 Hours ago' },
  { id: 4, title: 'Customer payment settled.', time: 'Today' },
]

const activitiesFeed = [
  { id: 1, title: 'Work order diagnostic notes updated.', time: 'Just now' },
  { id: 2, title: 'Spare parts stock adjusted.', time: '47 Minutes ago' },
  { id: 3, title: 'Daily workshop attendance recorded.', time: '1 Day ago' },
]

const managersList = [
  { id: 1, name: 'Daniel Craig', active: false },
  { id: 2, name: 'Kate Morrison', active: false },
  { id: 3, name: 'Nataniel Donovan', active: true, phone: '+1 555-0192' },
  { id: 4, name: 'Elisabeth Wayne', active: false },
  { id: 5, name: 'Felicia Raspet', active: false },
]

export default function AdminDashboard() {
  const { data: invoices = [] } = useInvoices()
  const { data: customers = [] } = useCustomers()
  const { data: repairJobs = [] } = useRepairJobs()
  const { data: inventory = [] } = useInventory()

  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const activeOrders = repairJobs.filter(j => j.status !== 'Completed').length
  const totalParts = inventory.reduce((sum, p) => sum + p.stockQty, 0)

  const topStats = [
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CurrencyDollar, trend: 12.4, trendLabel: 'vs last month' },
    { title: 'Cash Collected', value: `$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendUp, trend: 8.5, trendLabel: 'settled' },
    { title: 'Active Repair Orders', value: String(activeOrders), icon: Wrench, goal: `${repairJobs.length} total` },
    { title: 'Stock Units', value: `${totalParts.toLocaleString()}`, icon: Package, trend: 4.2, trendLabel: `${inventory.length} items` },
  ]

  return (
    <div className="space-y-6 text-app-text font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-app-text">Workshop Overview</h1>
          <p className="text-xs text-app-muted mt-0.5 font-normal">Real-time telemetry and optimistic state management</p>
        </div>
        <button className="px-3.5 py-1.5 bg-app-card border border-app-border text-app-muted hover:text-app-text rounded-full text-xs font-medium transition-colors shadow-subtle">
          Today ▾
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left 3 Columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Middle Row: Donut Chart Widget + 2 Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Service Breakdown Card */}
            <div className="lg:col-span-2 bg-app-card rounded-2xl border border-app-border p-6 shadow-card transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-app-text">Sales & Service Overview</h2>
                <button className="text-app-muted hover:text-app-text transition-colors">
                  <DotsThreeVertical size={18} weight="bold" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* SVG Donut Graphic */}
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
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
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray="238"
                      strokeDashoffset="180"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-app-text">{repairJobs.length}</span>
                    <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">Total Orders</span>
                  </div>
                </div>

                {/* Breakdown Legend List */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-app-accent" />
                      <span className="text-xs font-normal text-app-text">Mechanical & Engine</span>
                    </div>
                    <span className="text-xs font-medium text-app-accent">${(totalRevenue * 0.6).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-normal text-app-text">Brakes & Suspension</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-500">${(totalRevenue * 0.3).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-app-hover rounded-xl border border-app-border/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-xs font-normal text-app-text">Fluids & Inspection</span>
                    </div>
                    <span className="text-xs font-medium text-app-text">${(totalRevenue * 0.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mini Cards */}
            <div className="space-y-6 flex flex-col justify-between">
              {/* New Customers Widget */}
              <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-app-muted font-normal">Active Customers</p>
                    <p className="text-lg font-semibold text-app-text mt-0.5">{customers.length} <span className="text-xs text-emerald-500 font-normal">+12%</span></p>
                    <p className="text-[10px] text-app-muted mt-0.5 font-normal">Registered accounts</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent">
                    <Users size={18} weight="regular" />
                  </div>
                </div>
              </div>

              {/* Total Profit Sparkline Card */}
              <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card flex-1 flex flex-col justify-between transition-colors duration-200">
                <div>
                  <p className="text-xs text-app-muted font-normal">Gross Revenue</p>
                  <p className="text-lg font-bold text-app-accent mt-0.5">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="h-14 w-full mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <path
                      d="M0,50 Q40,20 80,40 T160,10 T200,30 L200,60 L0,60 Z"
                      fill="rgba(37, 99, 235, 0.12)"
                    />
                    <path
                      d="M0,50 Q40,20 80,40 T160,10 T200,30"
                      fill="none"
                      stroke="var(--accent-primary, #3b82f6)"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Customer List Table */}
          <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-app-text">Key Customer Accounts</h2>
              <button className="text-app-muted hover:text-app-text transition-colors">
                <DotsThreeVertical size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-app-muted text-left border-b border-app-border/60">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/40">
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="hover:bg-app-hover transition-colors group">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-app-border"
                          />
                          <div>
                            <p className="font-medium text-app-text group-hover:text-app-accent transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-app-muted font-normal">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-normal text-app-muted">{customer.phone}</td>
                      <td className="py-3 font-medium text-app-text text-right tabular-nums">{customer.totalSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Notifications Panel */}
          <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-200">
            <h3 className="text-xs font-semibold text-app-text uppercase tracking-wider mb-4">System Alerts</h3>
            <div className="space-y-3.5">
              {notificationsFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-app-accent/15 text-app-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={14} weight="regular" />
                  </div>
                  <div>
                    <p className="text-xs font-normal text-app-text">{item.title}</p>
                    <p className="text-[10px] text-app-muted font-normal">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Feed */}
          <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-200">
            <h3 className="text-xs font-semibold text-app-text uppercase tracking-wider mb-4">Recent Actions</h3>
            <div className="space-y-3.5">
              {activitiesFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-app-hover text-app-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench size={12} weight="regular" />
                  </div>
                  <div>
                    <p className="text-xs font-normal text-app-text">{act.title}</p>
                    <p className="text-[10px] text-app-muted font-normal">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Contacts */}
          <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card transition-colors duration-200">
            <h3 className="text-xs font-semibold text-app-text uppercase tracking-wider mb-4">Workshop Supervisors</h3>
            <div className="space-y-1.5">
              {managersList.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all duration-150 ${
                    m.active
                      ? 'bg-app-accent text-app-accentText font-medium shadow-subtle'
                      : 'hover:bg-app-hover text-app-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      m.active ? 'bg-black/20 text-app-accentText' : 'bg-app-hover text-app-muted'
                    }`}>
                      {m.name[0]}
                    </div>
                    <span className="text-xs font-normal">{m.name}</span>
                  </div>

                  {m.active ? (
                    <div className="flex items-center gap-1 pr-1">
                      <button className="w-6 h-6 rounded-full bg-black/20 text-app-accentText flex items-center justify-center hover:scale-105 transition-transform">
                        <ChatCircleText size={12} weight="fill" />
                      </button>
                      <button className="w-6 h-6 rounded-full bg-black/20 text-app-accentText flex items-center justify-center hover:scale-105 transition-transform">
                        <Phone size={12} weight="fill" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-app-muted text-xs px-2">...</span>
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
