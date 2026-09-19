import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, goal }) {
  return (
    <Card className="hover:border-app-border/80 transition-colors group font-sans border-0 sm:border h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-app-muted uppercase tracking-wider">{title}</p>
            <h3 className="text-xl font-bold tracking-tight text-app-text tabular-nums">{value}</h3>
          </div>
          {Icon && (
            <div className="p-2 rounded-lg bg-app-hover border border-app-border text-app-muted group-hover:text-app-accent transition-colors">
              <Icon size={18} weight="regular" />
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-app-border flex items-center justify-between text-xs">
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  trend >= 0 ? 'text-emerald-600 dark:text-[#13F287]' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend >= 0 ? <TrendUp size={13} weight="bold" /> : <TrendDown size={13} weight="bold" />}
                {trend >= 0 ? `+${trend}%` : `${trend}%`}
              </span>
              <span className="text-app-muted font-normal">{trendLabel}</span>
            </div>
          )}
          {goal && (
            <div className="flex items-center gap-1.5 text-app-muted font-normal">
              <span>Goal:</span>
              <span className="font-semibold text-app-text">{goal}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
