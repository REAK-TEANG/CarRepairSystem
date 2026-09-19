import { MagnifyingGlass, FunnelX } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export default function EmptyState({
  title = 'No records found',
  description = 'No results match your current search or filter criteria.',
  icon: Icon = MagnifyingGlass,
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`p-10 flex flex-col items-center justify-center text-center font-sans ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-app-hover border border-app-border flex items-center justify-center text-app-muted mb-3">
        <Icon size={22} weight="regular" />
      </div>
      <h3 className="text-sm font-semibold text-app-text">{title}</h3>
      <p className="text-xs text-app-muted mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onAction}
          className="mt-4 gap-1.5 h-8 px-3 rounded-xl shadow-subtle text-xs"
        >
          <FunnelX size={14} />
          {actionText}
        </Button>
      )}
    </div>
  )
}
