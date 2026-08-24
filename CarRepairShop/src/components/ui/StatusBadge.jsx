import clsx from 'clsx'

const variants = {
  success:  'bg-emerald-500/10 text-emerald-700 dark:text-[#13F287] border border-emerald-500/20',
  warning:  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  danger:   'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  info:     'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
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
  'Active':            'success',
  'Present':           'success',
  'On Leave':          'warning',
  'Terminated':        'danger',
}

export default function StatusBadge({ status, variant, className }) {
  const resolvedVariant = variant || statusMap[status] || 'neutral'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-normal whitespace-nowrap font-sans',
        variants[resolvedVariant],
        className
      )}
    >
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        resolvedVariant === 'success' ? 'bg-emerald-500 dark:bg-[#13F287]' :
        resolvedVariant === 'warning' ? 'bg-amber-500' :
        resolvedVariant === 'danger' ? 'bg-red-500' :
        resolvedVariant === 'info' ? 'bg-sky-500' : 'bg-app-muted'
      )} />
      {status}
    </span>
  )
}
