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
 * Realistic Table Skeleton Loader
 */
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="w-full font-sans overflow-hidden">
      {/* Skeleton Table Header */}
      <div className="flex items-center gap-4 px-4 py-3.5 border-b border-app-border bg-app-hover/40">
        {Array.from({ length: columns }).map((_, idx) => (
          <div
            key={idx}
            className={clsx(
              'h-3.5 rounded bg-app-border/80 ',
              idx === 0 ? 'w-24' : idx === 1 ? 'w-40' : idx === columns - 1 ? 'w-16 ml-auto' : 'w-28'
            )}
          />
        ))}
      </div>

      {/* Skeleton Table Rows */}
      <div className="divide-y divide-app-border/60">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 px-4 py-4 hover:bg-app-hover active:scale-[0.98]/30 transition-colors"
          >
            {/* Column 1: ID / Code Badge */}
            <div className="w-20">
              <Skeleton className="h-4 w-16 rounded font-mono" />
            </div>

            {/* Column 2: Primary Name & Subtitle */}
            <div className="w-48 space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded opacity-70" />
            </div>

            {/* Column 3: Secondary Text */}
            <div className="w-32 hidden md:block">
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>

            {/* Column 4: Numeric / Metric Amount */}
            <div className="w-28 hidden lg:block">
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Column 5: Status Badge */}
            <div className="w-24">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Column 6: Action Buttons */}
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-sm" />
              <Skeleton className="h-7 w-7 rounded-sm" />
            </div>
          </div>
        ))}
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
