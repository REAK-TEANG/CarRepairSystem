import React from 'react'
import {
  CurrencyDollar,
  Wrench,
  Users,
  DotsThreeVertical,
  Phone,
  ChatCircleText,
  TrendUp,
  ShieldCheck,
  CheckCircle,
} from '@phosphor-icons/react'
import StatCard from '../../components/ui/StatCard'

// Overview top stats
const topStats = [
  { title: 'Net Revenue', value: '$3,131,021', icon: CurrencyDollar, trend: 0.4, trendLabel: 'vs last month' },
  { title: 'Monthly ARR', value: '$1,511,121', icon: TrendUp, trend: 32, trendLabel: 'vs last quarter' },
  { title: 'Quarterly Goal', value: '71%', icon: ShieldCheck, goal: '$1.1M' },
  { title: 'New Orders', value: '18,221', icon: Wrench, trend: 11, trendLabel: 'vs last quarter' },
]

// Customer list with avatars
const customerList = [
  { id: 1, name: 'Danny Liu', email: 'danny@gmail.com', deals: 1023, totalValue: '$37,431', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 2, name: 'Bella Deviant', email: 'bella@gmail.com', deals: 963, totalValue: '$30,423', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
  { id: 3, name: 'Darrell Steward', email: 'darrel@gmail.com', deals: 843, totalValue: '$28,549', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 4, name: 'Elisabeth Wayne', email: 'elisabeth@gmail.com', deals: 720, totalValue: '$22,110', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
]

// Notifications & Activities feeds
const notificationsFeed = [
  { id: 1, title: '56 New users registered.', time: 'Just now' },
  { id: 2, title: '132 Orders placed.', time: '59 Minutes ago' },
  { id: 3, title: 'Funds have been withdrawn.', time: '12 Hours ago' },
  { id: 4, title: '5 Unread messages.', time: 'Today, 11:59 PM' },
]

const activitiesFeed = [
  { id: 1, title: 'Changed the repair status.', time: 'Just now' },
  { id: 2, title: '177 Spare parts added.', time: '47 Minutes ago' },
  { id: 3, title: '11 Work orders archived.', time: '1 Day ago' },
]

// Mechanics / Managers contact list
const managersList = [
  { id: 1, name: 'Daniel Craig', active: false },
  { id: 2, name: 'Kate Morrison', active: false },
  { id: 3, name: 'Nataniel Donovan', active: true, phone: '+1 555-0192' },
  { id: 4, name: 'Elisabeth Wayne', active: false },
  { id: 5, name: 'Felicia Raspet', active: false },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 text-[var(--text-primary)] font-sans transition-colors duration-250">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Overview</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-normal">Live metrics and activity feeds</p>
        </div>
        <button className="px-3.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full text-xs font-medium transition-default shadow-card">
          Today ▾
        </button>
      </div>

      {/* Main Grid: 2 Columns */}
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
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-card transition-colors duration-250">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Sales & Service Overview</h2>
                <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-default">
                  <DotsThreeVertical size={18} weight="bold" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* SVG Donut Graphic */}
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="var(--bg-hover)" strokeWidth="12" fill="transparent" />
                    {/* Segment 1: Primary Accent */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="var(--accent-primary)"
                      strokeWidth="12"
                      strokeDasharray="238"
                      strokeDashoffset="70"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Segment 2: Secondary Accent */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="var(--accent-secondary)"
                      strokeWidth="12"
                      strokeDasharray="238"
                      strokeDashoffset="180"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-[var(--text-primary)]">102k</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">Weekly Visits</span>
                  </div>
                </div>

                {/* Breakdown Legend List */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex items-center justify-between p-2.5 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
                      <span className="text-xs font-normal text-[var(--text-primary)]">Engine & Mechanical</span>
                    </div>
                    <span className="text-xs font-medium text-[var(--accent-primary)]">$55,640</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-xs font-normal text-[var(--text-primary)]">Brakes & Suspension</span>
                    </div>
                    <span className="text-xs font-medium text-[#10B981]">$11,420</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-xs font-normal text-[var(--text-primary)]">Tires & Alignment</span>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">$1,840</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mini Cards */}
            <div className="space-y-6 flex flex-col justify-between">
              
              {/* New Customers Widget */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card transition-colors duration-250">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] font-normal">New Customers</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">862 <span className="text-xs text-danger-500 font-normal">-8%</span></p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-normal">Last Week</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                    <Users size={18} weight="regular" />
                  </div>
                </div>
              </div>

              {/* Total Profit Curve Card */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card flex-1 flex flex-col justify-between transition-colors duration-250">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] font-normal">Total Profit</p>
                  <p className="text-lg font-bold text-[var(--accent-primary)] mt-0.5">$136,755.77</p>
                </div>
                {/* SVG Area Sparkline Chart */}
                <div className="h-14 w-full mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <path
                      d="M0,50 Q40,20 80,40 T160,10 T200,30 L200,60 L0,60 Z"
                      fill="rgba(5, 150, 105, 0.15)"
                    />
                    <path
                      d="M0,50 Q40,20 80,40 T160,10 T200,30"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>

            </div>
          </div>

          {/* Customer List Table */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-card transition-colors duration-250">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Customer List</h2>
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-default">
                <DotsThreeVertical size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[var(--text-secondary)] text-left border-b border-[var(--border-color)]/60">
                    <th className="pb-3 font-medium">Name ↕</th>
                    <th className="pb-3 font-medium">Deals ↕</th>
                    <th className="pb-3 font-medium text-right">Total Deal Value ↕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/40">
                  {customerList.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[var(--bg-hover)] transition-default group">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border-color)]"
                          />
                          <div>
                            <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-default">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] font-normal">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-normal text-[var(--text-secondary)]">{customer.deals.toLocaleString()}</td>
                      <td className="py-3 font-medium text-[var(--text-primary)] text-right tabular-nums">{customer.totalValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Activity & Contacts Panel */}
        <div className="space-y-6">

          {/* Notifications Panel */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card transition-colors duration-250">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Notifications</h3>
            <div className="space-y-3.5">
              {notificationsFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={14} weight="regular" />
                  </div>
                  <div>
                    <p className="text-xs font-normal text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-normal">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Feed */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card transition-colors duration-250">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Activities</h3>
            <div className="space-y-3.5">
              {activitiesFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench size={12} weight="regular" />
                  </div>
                  <div>
                    <p className="text-xs font-normal text-[var(--text-primary)]">{act.title}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-normal">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Contacts Widget */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card transition-colors duration-250">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">Contacts of your managers</h3>
            <div className="space-y-1.5">
              {managersList.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-2 rounded-full transition-all duration-200 ${
                    m.active
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] font-medium shadow-neon-sm'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      m.active ? 'bg-[var(--accent-text)] text-[var(--accent-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      {m.name[0]}
                    </div>
                    <span className="text-xs font-normal">{m.name}</span>
                  </div>

                  {m.active ? (
                    <div className="flex items-center gap-1 pr-1">
                      <button className="w-6 h-6 rounded-full bg-[var(--accent-text)] text-[var(--accent-primary)] flex items-center justify-center hover:scale-105 transition-default">
                        <ChatCircleText size={12} weight="fill" />
                      </button>
                      <button className="w-6 h-6 rounded-full bg-[var(--accent-text)] text-[var(--accent-primary)] flex items-center justify-center hover:scale-105 transition-default">
                        <Phone size={12} weight="fill" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[var(--text-secondary)] text-xs px-2">...</span>
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
