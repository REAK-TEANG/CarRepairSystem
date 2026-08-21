import React from 'react'
import { TrendUp, TrendDown } from '@phosphor-icons/react'

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, goal }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 shadow-card hover:border-[var(--accent-primary)]/50 transition-all duration-200 group font-sans">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-normal text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/50 group-hover:text-[var(--accent-primary)] text-[var(--text-secondary)] transition-all duration-200">
            <Icon size={20} weight="regular" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border-color)]/50 flex items-center justify-between text-xs">
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                trend >= 0 ? 'text-[var(--accent-primary)]' : 'text-danger-500'
              }`}
            >
              {trend >= 0 ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}
              {trend >= 0 ? `+${trend}%` : `${trend}%`}
            </span>
            <span className="text-[var(--text-secondary)] font-normal">{trendLabel}</span>
          </div>
        )}
        {goal && (
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-normal">
            <span>Quarterly Goal:</span>
            <span className="font-semibold text-[var(--text-primary)]">{goal}</span>
          </div>
        )}
      </div>
    </div>
  )
}
