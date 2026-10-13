"use client"

import { cn } from "@/lib/utils"

function Table({
  className,
  containerClassName,
  ...props
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "w-full overflow-hidden rounded-lg border border-app-border bg-app-card shadow-xs",
        containerClassName
      )}
    >
      <div className="relative w-full overflow-x-auto">
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-xs border-collapse", className)}
          {...props}
        />
      </div>
    </div>
  )
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-app-hover/50 border-b border-app-border sticky top-0 z-10", className)}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0 divide-y divide-app-border/70", className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-app-border bg-app-card font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-app-border/70 transition-colors hover:bg-app-hover/60 data-[state=selected]:bg-app-hover/80 text-app-text",
        className
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-8 px-3 text-left align-middle text-[11px] font-semibold text-app-muted uppercase tracking-wider whitespace-nowrap select-none [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 text-xs align-middle text-app-text whitespace-nowrap tabular-nums [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableFooterBar({
  totalCount,
  currentCount,
  page,
  totalPages,
  pageSize = 10,
  onPrev,
  onNext,
  pagination,
  onPageChange,
  className,
  children,
}) {
  const effectivePage = page ?? pagination?.page
  const effectiveTotalPages = totalPages ?? pagination?.totalPages
  const effectiveTotalCount = totalCount ?? pagination?.total
  const effectivePageSize = pageSize ?? pagination?.limit ?? 10

  const hasPagination = effectiveTotalPages !== undefined && effectiveTotalPages > 1
  const start = effectiveTotalCount && effectivePage ? Math.min((effectivePage - 1) * effectivePageSize + 1, effectiveTotalCount) : 1
  const end = effectiveTotalCount && effectivePage ? Math.min(effectivePage * effectivePageSize, effectiveTotalCount) : (currentCount ?? effectiveTotalCount ?? 0)

  const handlePrev = onPrev ?? (onPageChange ? () => onPageChange(Math.max(1, (effectivePage || 1) - 1)) : undefined)
  const handleNext = onNext ?? (onPageChange ? () => onPageChange(Math.min(effectiveTotalPages || 1, (effectivePage || 1) + 1)) : undefined)

  return (
    <tfoot data-slot="table-footer-bar" className="border-t border-app-border bg-app-card">
      <tr>
        <td colSpan={100} className="p-0">
          <div
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 bg-app-card text-xs text-app-muted select-none",
              className
            )}
          >
            <div className="flex items-center gap-1.5">
              {children || (
                <span>
                  {effectivePage && effectiveTotalCount !== undefined ? (
                    effectiveTotalCount === 0 ? (
                      <>No records found</>
                    ) : (
                      <>
                        Showing <strong className="text-app-text font-semibold">{start}–{end}</strong> of{" "}
                        <strong className="text-app-text font-semibold">{effectiveTotalCount}</strong> records
                      </>
                    )
                  ) : (
                    <>
                      Showing <strong className="text-app-text font-semibold">{currentCount ?? effectiveTotalCount ?? 0}</strong>
                      {effectiveTotalCount !== undefined && currentCount !== undefined && effectiveTotalCount !== currentCount ? (
                        <> of <strong className="text-app-text font-semibold">{effectiveTotalCount}</strong></>
                      ) : null}{" "}
                      records
                    </>
                  )}
                </span>
              )}
            </div>

            {hasPagination ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={effectivePage <= 1}
                  onClick={handlePrev}
                  className="px-2.5 py-1 rounded-md border border-app-border bg-app-card hover:bg-app-hover disabled:opacity-30 disabled:pointer-events-none transition-all text-app-text font-medium text-xs cursor-pointer active:scale-95 shadow-2xs"
                >
                  Prev
                </button>
                <span className="text-[11px] text-app-muted font-mono px-1">
                  <strong className="text-app-text font-semibold">{effectivePage}</strong> / {effectiveTotalPages}
                </span>
                <button
                  type="button"
                  disabled={effectivePage >= effectiveTotalPages}
                  onClick={handleNext}
                  className="px-2.5 py-1 rounded-md border border-app-border bg-app-card hover:bg-app-hover disabled:opacity-30 disabled:pointer-events-none transition-all text-app-text font-medium text-xs cursor-pointer active:scale-95 shadow-2xs"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </td>
      </tr>
    </tfoot>
  )
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-xs text-app-muted", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableFooterBar,
  TableCaption,
}
