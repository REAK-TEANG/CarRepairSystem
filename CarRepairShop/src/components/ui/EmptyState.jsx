import { MagnifyingGlass, FunnelX } from '@phosphor-icons/react'

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
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-hover hover:bg-app-border border border-app-border text-app-text text-xs font-medium rounded-lg transition-colors shadow-subtle"
        >
          <FunnelX size={14} />
          {actionText}
        </button>
      )}
    </div>
  )
}
