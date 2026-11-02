import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

/**
 * Standardized PageHeader component across all entity pages.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.title - Title text or element
 * @param {number|string} [props.count] - Total record count badge
 * @param {string} [props.searchQuery] - Current search query value
 * @param {Function} [props.onSearch] - Search change handler
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {string} [props.searchWidth] - Tailored width classes for the search input
 * @param {React.ReactNode} [props.actions] - Action buttons (e.g. Add, Filter, Export)
 * @param {React.ReactNode} [props.children] - Additional content rendered in the actions area
 * @param {string} [props.className] - Additional wrapper class names
 */
export function PageHeader({
  title,
  count,
  searchQuery,
  onSearch,
  searchPlaceholder = 'Quick search...',
  searchWidth = 'w-full sm:w-60',
  actions,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${className}`}>
      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-semibold tracking-tight text-app-text">{title}</h1>
        {count !== undefined && count !== null && (
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {count}
          </span>
        )}
      </div>

      {(onSearch || actions || children) && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {onSearch && (
            <div className={`relative ${searchWidth}`}>
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none"
              />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery ?? ''}
                onChange={onSearch}
                className="pl-9"
              />
            </div>
          )}
          {actions}
          {children}
        </div>
      )}
    </div>
  )
}

export default PageHeader
