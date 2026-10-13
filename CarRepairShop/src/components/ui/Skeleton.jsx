import clsx from 'clsx'
import { Pulse } from '../animation/AnimeWrapper'

/**
 * Primitive skeleton shimmer block
 */
export function Skeleton({ className, ...props }) {
  return (
    <Pulse duration={1200}>
      <div
        className={clsx(
          'relative overflow-hidden rounded-md bg-app-hover/80 dark:bg-app-hover/50 ',
          className
        )}
        {...props}
      />
    </Pulse>
  )
}

/**
 * Realistic Table Skeleton Loader (21st.dev high-density matching)
 */
export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-app-border bg-app-card shadow-xs">
      <div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-xs border-collapse">
          <thead className="bg-app-hover/50 border-b border-app-border">
            <tr>
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="h-8 px-3 text-left align-middle text-[11px] font-semibold text-app-muted whitespace-nowrap">
                  <div
                    className={clsx(
                      'h-2.5 rounded bg-app-border/80 animate-pulse',
                      idx === 0 ? 'w-16' : idx === 1 ? 'w-28' : idx === columns - 1 ? 'w-14 ml-auto' : 'w-20'
                    )}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-app-border/70">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-3 py-2 text-xs align-middle whitespace-nowrap">
                    <div
                      className={clsx(
                        'h-3 rounded bg-app-hover animate-pulse',
                        colIdx === 0
                          ? 'w-16 font-mono'
                          : colIdx === 1
                          ? 'w-32'
                          : colIdx === columns - 1
                          ? 'w-12 ml-auto'
                          : 'w-24'
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-app-border bg-app-card">
        <div className="h-2.5 w-28 rounded bg-app-border/60 animate-pulse" />
        <div className="h-2.5 w-16 rounded bg-app-border/60 animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Metric Stat Card Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-app-card rounded-sm border border-app-border p-3.5 shadow-card space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
        </div>
        <Skeleton className="w-9 h-9 rounded-sm" />
      </div>
      <div className="pt-2 border-t border-app-border/60 flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  )
}

/**
 * List Item Skeleton
 */
export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-4 bg-app-card rounded-sm border border-app-border shadow-subtle gap-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-sm flex-shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded opacity-70" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton
