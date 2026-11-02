import { CaretRight } from '@phosphor-icons/react'
import clsx from 'clsx'

/**
 * MobileDataCard
 *
 * Native Mobile App-Style List Item / Card designed for touch screens.
 * Replaces dense desktop table rows on mobile viewports (< 768px).
 *
 * Features:
 * - Tactile spring tap feedback (active:scale-[0.98])
 * - Clear visual hierarchy: Header, Metadata chips, Trailing disclosure
 * - Quick action slots (e.g., Call, Edit, Pay)
 * - Safe touch target ergonomics (min 44px height)
 */
export default function MobileDataCard({
  title,
  subtitle,
  badge,
  badgeColor,
  status,
  icon,
  avatar,
  metadata = [],
  chips,
  actions,
  onClick,
  className = '',
  children,
}) {
  // Normalize badge & badgeColor with status object support
  const effectiveBadge = badge || (status ? (typeof status === 'string' ? status : status.label) : null)
  let effectiveBadgeColor = badgeColor
  if (!effectiveBadgeColor && status?.color) {
    if (status.color === 'green' || status.color === 'emerald') {
      effectiveBadgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    } else if (status.color === 'amber' || status.color === 'yellow') {
      effectiveBadgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    } else if (status.color === 'rose' || status.color === 'red') {
      effectiveBadgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    } else if (status.color === 'blue' || status.color === 'sky') {
      effectiveBadgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    }
  }

  // Normalize items from metadata or chips
  const items = (metadata && metadata.length > 0) ? metadata : (chips || [])

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group relative flex flex-col p-3.5 bg-app-card border border-app-border rounded-xl shadow-xs transition-all duration-150',
        onClick && 'cursor-pointer active:scale-[0.98] active:bg-app-hover/80 touch-manipulation',
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {avatar && (
            <div className="w-8 h-8 rounded-lg bg-app-hover flex items-center justify-center text-app-text font-bold text-xs flex-shrink-0 border border-app-border/60">
              {avatar}
            </div>
          )}
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-app-accent/10 text-app-accent flex items-center justify-center text-sm flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-app-text tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] font-mono text-app-muted truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Status Badge / Price */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {effectiveBadge && (
            <span
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
                effectiveBadgeColor || 'bg-app-hover text-app-muted border-app-border'
              )}
            >
              {effectiveBadge}
            </span>
          )}
          {onClick && (
            <CaretRight
              size={14}
              className="text-app-muted group-hover:text-app-text transition-colors"
              weight="bold"
            />
          )}
        </div>
      </div>

      {/* Metadata Chips Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-xs text-app-muted border-t border-app-border/40">
          {items.map((item, idx) => {
            if (!item || (!item.label && !item.value)) return null
            return (
              <div key={idx} className="flex items-center gap-1.5 min-w-0 truncate">
                {item.icon && <span className="text-app-muted/80 flex-shrink-0">{item.icon}</span>}
                {item.label && <span className="text-app-muted/60">{item.label}:</span>}
                <span className={clsx('font-medium text-app-text truncate', item.mono && 'font-mono')}>
                  {item.value}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom Body Children */}
      {children && <div className="mt-2.5 pt-2 border-t border-app-border/40">{children}</div>}

      {/* Quick Action Footer */}
      {actions && (
        <div
          className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-app-border/40"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  )
}

