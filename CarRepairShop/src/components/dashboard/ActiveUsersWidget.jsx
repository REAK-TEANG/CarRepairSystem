import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  ArrowUpRight,
  Desktop,
  DeviceMobile,
  Compass,
  Clock,
  Circle,
} from '@phosphor-icons/react'
import { useActiveSessions } from '@/hooks/useUserSessions'
import { ROLE_METADATA } from '@/context/AuthContext'
import Avatar from '@/components/ui/Avatar'
import clsx from 'clsx'

function formatDuration(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hours}h ${remMins}m`
}

const ROUTE_LABELS = {
  '/admin/dashboard': 'Admin Dashboard',
  '/mechanic/dashboard': 'Mechanic Workspace',
  '/appointments': 'Appointments',
  '/repair-jobs': 'Repair Jobs',
  '/customers': 'Customers',
  '/vehicles': 'Vehicles',
  '/inventory': 'Inventory',
  '/suppliers': 'Suppliers',
  '/services': 'Services Catalog',
  '/mechanics': 'Mechanics',
  '/invoices': 'Invoices & Billing',
  '/employees': 'Staff & Attendance',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/audit-logs': 'Audit & Sessions',
}

export default function ActiveUsersWidget({ className }) {
  const { t } = useTranslation()
  const { data: sessions = [], isLoading } = useActiveSessions()

  const onlineSessions = sessions.filter((s) => s.status === 'active')

  return (
    <div
      className={clsx(
        'bg-app-card border border-app-border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-sm',
        className
      )}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-app-border mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users size={18} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-app-text tracking-tight">
                {t('audit.activeAccounts', 'Active Accounts')}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {onlineSessions.length} {t('audit.online', 'Online')}
              </span>
            </div>
            <p className="text-xs text-app-text-muted mt-0.5">
              {t('audit.realtimePresence', 'Real-time staff activity & location')}
            </p>
          </div>
        </div>

        <Link
          to="/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-medium text-app-accent hover:underline transition-colors"
        >
          <span>{t('audit.viewAllLogs', 'All Sessions & Audit')}</span>
          <ArrowUpRight size={14} weight="bold" />
        </Link>
      </div>

      {/* Sessions List */}
      <div className="flex-1 space-y-2.5 min-h-[140px]">
        {isLoading ? (
          <div className="space-y-2.5 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-app-border/40" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-app-border/40 rounded w-1/3" />
                  <div className="h-3 bg-app-border/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-app-text-muted">
            <Circle size={28} className="opacity-30 mb-2" />
            <p className="text-xs font-medium">{t('audit.noActiveSessions', 'No active sessions recorded')}</p>
          </div>
        ) : (
          sessions.slice(0, 5).map((session) => {
            const isOnline = session.status === 'active'
            const roleMeta = ROLE_METADATA[session.role] || ROLE_METADATA.admin
            const routeName = ROUTE_LABELS[session.currentRoute] || session.currentRoute || 'Dashboard'

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-app-surface/60 border border-app-border/60 hover:bg-app-surface transition-colors"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar src={session.avatar} name={session.name} className="w-9 h-9" />
                    <span
                      className={clsx(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-app-card',
                        isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      title={isOnline ? 'Active' : 'Away / Idle'}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-app-text truncate">
                        {session.name}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-medium px-1.5 py-0.2 rounded border uppercase tracking-wider',
                          roleMeta.badgeColor
                        )}
                      >
                        {session.roleTitle || session.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-app-text-muted">
                      <span className="flex items-center gap-1 truncate text-app-text-muted/90">
                        <Compass size={12} className="text-app-accent flex-shrink-0" />
                        <span className="truncate">{routeName}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        {session.deviceType === 'Mobile' ? (
                          <DeviceMobile size={12} />
                        ) : (
                          <Desktop size={12} />
                        )}
                        <span>{session.deviceType}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Duration & Status Pill */}
                <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                  <div className="text-right">
                    <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-app-text">
                      <Clock size={12} className="text-app-text-muted" />
                      {formatDuration(session.durationSeconds)}
                    </span>
                    <span className="text-[10px] text-app-text-muted">
                      {isOnline ? t('audit.online', 'Online') : t('audit.idle', 'Away')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Summary */}
      {sessions.length > 5 && (
        <div className="pt-2 text-center text-xs text-app-text-muted">
          + {sessions.length - 5} {t('audit.moreUsersActive', 'more active accounts')}
        </div>
      )}
    </div>
  )
}

