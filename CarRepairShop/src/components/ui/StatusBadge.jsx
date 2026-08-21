import React from 'react'
import clsx from 'clsx'

const variants = {
  success:  'bg-success-500/15 text-success-600 border border-success-500/30',
  warning:  'bg-warning-500/15 text-warning-600 border border-warning-500/30',
  danger:   'bg-danger-500/15 text-danger-600 border border-danger-500/30',
  info:     'bg-info-500/15 text-info-600 border border-info-500/30',
  neutral:  'bg-app-hover text-app-muted border border-app-border',
}

const statusMap = {
  'Completed':         'success',
  'Ready for Pickup':  'success',
  'Repairing':         'info',
  'Diagnosing':        'warning',
  'Pending':           'warning',
  'Waiting for Parts': 'warning',
  'Scheduled':         'info',
  'Confirmed':         'success',
  'In Progress':       'info',
  'Cancelled':         'danger',
  'Paid':              'success',
  'Issued':            'info',
  'Overdue':           'danger',
  'Draft':             'neutral',
}

export default function StatusBadge({ status, variant, className }) {
  const resolvedVariant = variant || statusMap[status] || 'neutral'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap font-sans',
        variants[resolvedVariant],
        className
      )}
    >
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        resolvedVariant === 'success' ? 'bg-success-500 shadow-emerald' :
        resolvedVariant === 'warning' ? 'bg-warning-500' :
        resolvedVariant === 'danger' ? 'bg-danger-500' :
        resolvedVariant === 'info' ? 'bg-info-500' : 'bg-app-muted'
      )} />
      {status}
    </span>
  )
}
