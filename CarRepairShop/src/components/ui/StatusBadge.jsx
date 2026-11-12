import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

const variants = {
  success:  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
  warning:  'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25',
  danger:   'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25',
  info:     'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25',
  purple:   'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25',
  neutral:  'bg-app-hover text-app-text/80 dark:text-app-text/75 border border-app-border',
}

const statusMap = {
  'Completed':         'success',
  'Ready for Pickup':  'success',
  'Repairing':         'info',
  'Diagnosing':        'purple',
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
  'Low Stock':         'warning',
  'Out of Stock':      'danger',
  'In Stock':          'success',
}

export default function StatusBadge({ status, variant, className, pulse = false }) {
  const { t } = useTranslation()
  const resolvedVariant = variant || statusMap[status] || 'neutral'
  const translatedStatus = t(`status.${status}`, status)
  const isPulsing = pulse || status === 'Repairing' || status === 'Diagnosing' || status === 'Low Stock'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-normal whitespace-nowrap font-sans transition-colors',
        variants[resolvedVariant],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {isPulsing && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              resolvedVariant === 'success' ? 'bg-emerald-400' :
              resolvedVariant === 'warning' ? 'bg-amber-400' :
              resolvedVariant === 'danger' ? 'bg-rose-400' :
              resolvedVariant === 'purple' ? 'bg-purple-400' :
              resolvedVariant === 'info' ? 'bg-sky-400' : 'bg-app-muted'
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-1.5 w-1.5',
            resolvedVariant === 'success' ? 'bg-emerald-500' :
            resolvedVariant === 'warning' ? 'bg-amber-500' :
            resolvedVariant === 'danger' ? 'bg-rose-500' :
            resolvedVariant === 'purple' ? 'bg-purple-500' :
            resolvedVariant === 'info' ? 'bg-sky-500' : 'bg-app-muted'
          )}
        />
      </span>
      {translatedStatus}
    </span>
  )
}
