import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Universal Toolbar & PageHeader component across all management & entity pages.
 */
export function PageHeader({
  title,
  count,
  searchQuery,
  onSearch,
  onClearSearch,
  searchPlaceholder = 'Quick search...',
  searchWidth = 'w-full sm:w-64',
  filterTabs,
  activeFilter,
  onFilterChange,
  actions,
  children,
  className = '',
}) {
  return (
    <div className={cn('space-y-3 font-sans', className)}>
      {/* Top Bar: Title + Total Badge + Primary Action Cluster */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-bold tracking-tight text-app-text">{title}</h1>
          {count !== undefined && count !== null && (
            <span className="text-xs font-mono font-semibold text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md shadow-2xs">
              {count}
            </span>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>

      {/* Secondary Bar: Segmented Status Pills + Search Toolbar */}
      {(filterTabs || onSearch || children) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
          {/* Segmented Filter Pills */}
          {filterTabs && filterTabs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {filterTabs.map((tab) => {
                const tabKey = typeof tab === 'string' ? tab : tab.key
                const tabLabel = typeof tab === 'string' ? tab : tab.label
                const tabCount = typeof tab === 'object' ? tab.count : undefined
                const isActive = activeFilter === tabKey

                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => onFilterChange?.(tabKey)}
                    className={cn(
                      'h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer touch-manipulation active-press inline-flex items-center gap-1.5',
                      isActive
                        ? 'bg-app-accent text-app-accentText shadow-xs'
                        : 'bg-app-card border border-app-border text-app-muted hover:text-app-text hover:bg-app-hover'
                    )}
                  >
                    <span>{tabLabel}</span>
                    {tabCount !== undefined && tabCount !== null && (
                      <span
                        className={cn(
                          'text-[11px] px-1.5 py-0.2 rounded-full font-mono',
                          isActive
                            ? 'bg-black/15 text-app-accentText'
                            : 'bg-app-surface text-app-muted'
                        )}
                      >
                        {tabCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Right Controls: Search + Slot Children */}
          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
            {onSearch && (
              <div className={cn('relative', searchWidth)}>
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery ?? ''}
                  onChange={onSearch}
                  className="pl-9 pr-8 text-xs h-8 bg-app-card border-app-border focus:border-app-accent"
                />
                {searchQuery && onClearSearch && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text p-0.5 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} weight="bold" />
                  </button>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export default PageHeader
