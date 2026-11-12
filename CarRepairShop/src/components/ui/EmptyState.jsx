import { MagnifyingGlass, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function EmptyState({
  title = 'No records found',
  description = 'No results match your current search or filter criteria.',
  icon: Icon = MagnifyingGlass,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) {
  return (
    <div
      className={cn(
        'p-10 sm:p-14 flex flex-col items-center justify-center text-center font-sans select-none',
        className
      )}
    >
      {/* Icon Capsule with ambient depth */}
      <div className="w-14 h-14 rounded-2xl bg-app-surface/80 border border-app-border flex items-center justify-center text-app-muted shadow-xs mb-4">
        <Icon size={28} weight="duotone" className="text-app-accent" />
      </div>

      <h3 className="text-base font-semibold text-app-text tracking-tight">{title}</h3>
      <p className="text-xs text-app-muted mt-1.5 max-w-sm leading-relaxed">{description}</p>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
          {actionText && onAction && (
            <Button
              type="button"
              onClick={onAction}
              size="sm"
              className="gap-1.5 font-semibold"
            >
              {actionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="gap-1.5 text-xs text-app-muted hover:text-app-text"
            >
              <ArrowCounterClockwise size={13} weight="bold" />
              <span>{secondaryActionText}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
