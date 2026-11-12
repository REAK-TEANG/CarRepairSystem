import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  ShieldCheck,
  Clock,
  Compass,
  Desktop,
  DeviceMobile,
  Prohibit,
  DownloadSimple,
  MagnifyingGlass,
  ArrowClockwise,
  CaretDown,
  CaretRight,
  FileText,
  Pulse,
  Eye,
  Funnel,
} from '@phosphor-icons/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Input,
  ConfirmDialog,
  DatePicker,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { useActiveSessions, useSessionHistory, useRevokeSession } from '@/hooks/useUserSessions'
import { useAuditLogs, useAuditStats } from '@/hooks/useAuditLogs'
import { auditLogService } from '@/services/auditLogService'
import { ROLE_METADATA } from '@/context/AuthContext'
import clsx from 'clsx'

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hours}h ${remMins}m`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const ACTION_COLORS = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  STATUS_CHANGE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  LOGOUT: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  SESSION_CLOSE: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  REVOKE_SESSION: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  EXPORT: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
}

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'auth', label: 'Authentication & Security' },
  { value: 'repair_jobs', label: 'Repair Jobs' },
  { value: 'invoices', label: 'Invoices & Payments' },
  { value: 'inventory', label: 'Spare Parts Inventory' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'customers', label: 'Customers' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'settings', label: 'System Settings' },
  { value: 'employees', label: 'Employees & Staff' },
]

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'LOGIN', label: 'Sign In (Login)' },
  { value: 'LOGOUT', label: 'Sign Out (Logout)' },
  { value: 'SESSION_CLOSE', label: 'Window/Tab Close' },
  { value: 'CREATE', label: 'Create Record' },
  { value: 'UPDATE', label: 'Update Record' },
  { value: 'STATUS_CHANGE', label: 'Status / Stock Change' },
  { value: 'DELETE', label: 'Delete Record' },
  { value: 'REVOKE_SESSION', label: 'Revoke Session' },
]

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('sessions') // 'sessions' | 'audit'

  // Sessions Tab State
  const { data: activeSessions = [], isLoading: loadingActive, refetch: refetchActive } = useActiveSessions()
  const [historyPage, setHistoryPage] = useState(1)
  const { data: historyData = {}, isLoading: loadingHistory, refetch: refetchHistory } = useSessionHistory({
    page: historyPage,
    limit: 15,
  })
  const revokeMutation = useRevokeSession()
  const [sessionToRevoke, setSessionToRevoke] = useState(null)

  // Audit Logs Tab State
  const [search, setSearch] = useState('')
  const [selectedModule, setSelectedModule] = useState('all')
  const [selectedAction, setSelectedAction] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [expandedLogId, setExpandedLogId] = useState(null)

  const auditFilters = useMemo(
    () => ({
      search: search.trim(),
      module: selectedModule,
      action: selectedAction,
      startDate,
      endDate,
      page: auditPage,
      limit: 20,
    }),
    [search, selectedModule, selectedAction, startDate, endDate, auditPage]
  )

  const { data: auditResponse = {}, isLoading: loadingAudit, refetch: refetchAudit } = useAuditLogs(auditFilters)
  const { data: auditStats = {} } = useAuditStats()

  const auditLogs = auditResponse.logs || []
  const auditPagination = auditResponse.pagination || { page: 1, totalPages: 1, total: 0 }
  const sessionHistory = historyData.sessions || []
  const historyPagination = historyData.pagination || { page: 1, totalPages: 1, total: 0 }

  const handleRevokeConfirm = () => {
    if (sessionToRevoke) {
      revokeMutation.mutate(sessionToRevoke.id, {
        onSettled: () => setSessionToRevoke(null),
      })
    }
  }

  const handleExport = (format) => {
    auditLogService.exportLogs(format, {
      search,
      module: selectedModule,
      action: selectedAction,
      startDate,
      endDate,
    })
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedModule('all')
    setSelectedAction('all')
    setStartDate('')
    setEndDate('')
    setAuditPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-app-accent/10 text-app-accent flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} weight="bold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-app-text tracking-tight">
                {t('audit.pageTitle', 'User Activity & Audit Logs')}
              </h1>
              <p className="text-xs text-app-text-muted">
                {t('audit.pageSubtitle', 'Real-time online sessions, browser close telemetry, and administrative audit trails')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'audit' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-1.5 text-xs"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>{t('common.exportCsv', 'Export CSV')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                className="gap-1.5 text-xs hidden sm:inline-flex"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>Export JSON</span>
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'sessions') {
                refetchActive()
                refetchHistory()
              } else {
                refetchAudit()
              }
            }}
            className="gap-1.5 text-xs"
          >
            <ArrowClockwise size={14} weight="bold" />
            <span>{t('common.refresh', 'Refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-app-border space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('sessions')}
          className={clsx(
            'flex items-center gap-2 py-3 px-1 border-b-2 font-medium transition-colors select-none',
            activeTab === 'sessions'
              ? 'border-app-accent text-app-accent font-semibold'
              : 'border-transparent text-app-text-muted hover:text-app-text'
          )}
        >
          <Users size={18} weight={activeTab === 'sessions' ? 'bold' : 'regular'} />
          <span>{t('audit.tabLiveSessions', 'Live Sessions & History')}</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {activeSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={clsx(
            'flex items-center gap-2 py-3 px-1 border-b-2 font-medium transition-colors select-none',
            activeTab === 'audit'
              ? 'border-app-accent text-app-accent font-semibold'
              : 'border-transparent text-app-text-muted hover:text-app-text'
          )}
        >
          <FileText size={18} weight={activeTab === 'audit' ? 'bold' : 'regular'} />
          <span>{t('audit.tabAuditTrail', 'System Audit Trail')}</span>
          {auditStats.todayActions > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-app-accent/10 text-app-accent">
              {auditStats.todayActions} today
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SESSIONS & TELEMETRY */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-app-text-muted">Currently Online</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-2xl font-bold text-app-text mt-2">
                {activeSessions.filter((s) => s.status === 'active').length}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <Pulse size={13} weight="bold" />
                Active heartbeats within 3m
              </p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-app-text-muted">Away / Idle</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              </div>
              <div className="text-2xl font-bold text-app-text mt-2">
                {activeSessions.filter((s) => s.status === 'idle').length}
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                No telemetry ping for &gt; 3m
              </p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-app-text-muted">Staff Active Today</span>
                <Users size={16} className="text-app-accent" />
              </div>
              <div className="text-2xl font-bold text-app-text mt-2">
                {auditStats.activeUsersToday || activeSessions.length || 1}
              </div>
              <p className="text-[11px] text-app-text-muted mt-1">Unique staff accounts today</p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-app-text-muted">Total Sessions Recorded</span>
                <Clock size={16} className="text-app-text-muted" />
              </div>
              <div className="text-2xl font-bold text-app-text mt-2">
                {historyPagination.total || activeSessions.length}
              </div>
              <p className="text-[11px] text-app-text-muted mt-1">Lifetime login/close events</p>
            </div>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-app-card border border-app-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-app-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-app-accent" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">
                  {t('audit.activeSessionsHeading', 'Currently Active Staff Accounts')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {activeSessions.length} online
                </span>
              </div>
              <p className="text-xs text-app-text-muted hidden sm:block">
                Auto-refreshes every 15s • Heartbeat sync active
              </p>
            </div>

            {loadingActive ? (
              <div className="p-8 text-center text-sm text-app-text-muted animate-pulse">
                Loading active sessions...
              </div>
            ) : activeSessions.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active sessions found"
                description="No users are currently logged in or sending telemetry heartbeats."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User / Account</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Screen</TableHead>
                      <TableHead>Device & IP</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Session Length</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((s) => {
                      const isOnline = s.status === 'active'
                      const roleMeta = ROLE_METADATA[s.role] || ROLE_METADATA.admin

                      return (
                        <TableRow key={s.id} className="hover:bg-app-surface/50">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar src={s.avatar} name={s.name} className="w-8 h-8" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-app-text truncate">{s.name}</div>
                                <div className="text-[11px] text-app-text-muted">@{s.username}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={clsx(
                                'text-[11px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider',
                                roleMeta.badgeColor
                              )}
                            >
                              {s.roleTitle || s.role}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                                isOnline
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              )}
                            >
                              <span
                                className={clsx(
                                  'w-2 h-2 rounded-full',
                                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                )}
                              />
                              {isOnline ? 'Online' : 'Away'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-xs text-app-text font-mono bg-app-surface px-2 py-1 rounded border border-app-border">
                              <Compass size={13} className="text-app-accent flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{s.currentRoute || '/'}</span>
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs text-app-text flex items-center gap-1.5">
                              {s.deviceType === 'Mobile' ? (
                                <DeviceMobile size={14} className="text-app-text-muted" />
                              ) : (
                                <Desktop size={14} className="text-app-text-muted" />
                              )}
                              <span>{s.deviceType}</span>
                              <span className="text-[11px] text-app-text-muted font-mono">({s.ipAddress})</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-app-text-muted whitespace-nowrap">
                            {formatDate(s.loginAt)}
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-app-text flex items-center gap-1">
                              <Clock size={13} className="text-app-text-muted" />
                              {formatDuration(s.durationSeconds)}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => setSessionToRevoke(s)}
                              className="gap-1 text-xs"
                              title="Force logout user and revoke session token"
                            >
                              <Prohibit size={13} weight="bold" />
                              <span>Terminate</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Historical Sessions Card */}
          <div className="bg-app-card border border-app-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-app-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-app-text-muted" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">
                  {t('audit.sessionHistoryHeading', 'Past Session Logouts & Closures')}
                </h2>
              </div>
              <span className="text-xs text-app-text-muted">
                Tracks window closes, manual sign-outs, and timeouts
              </span>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-sm text-app-text-muted animate-pulse">
                Loading session history...
              </div>
            ) : sessionHistory.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No previous session history"
                description="Completed and closed user sessions will appear here once recorded."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User / Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Close Reason</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Close Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Device & IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionHistory.map((s) => {
                      let reasonBadgeClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      let reasonLabel = s.closeReason || 'Closed'
                      if (s.closeReason === 'manual_logout') {
                        reasonLabel = 'Manual Logout'
                        reasonBadgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      } else if (s.closeReason === 'window_close') {
                        reasonLabel = 'Window / Tab Closed'
                        reasonBadgeClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      } else if (s.closeReason === 'admin_revoked') {
                        reasonLabel = 'Admin Terminated'
                        reasonBadgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      } else if (s.closeReason === 'session_timeout') {
                        reasonLabel = 'Inactivity Timeout'
                        reasonBadgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }

                      return (
                        <TableRow key={s.id} className="hover:bg-app-surface/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-app-text">{s.name}</span>
                              <span className="text-[11px] text-app-text-muted">@{s.username}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-mono uppercase text-app-text-muted">
                              {s.status}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded border', reasonBadgeClass)}>
                              {reasonLabel}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-app-text-muted whitespace-nowrap">
                            {formatDate(s.loginAt)}
                          </TableCell>

                          <TableCell className="text-xs text-app-text-muted whitespace-nowrap">
                            {formatDate(s.logoutAt || s.lastActivityAt)}
                          </TableCell>

                          <TableCell className="text-xs font-medium text-app-text whitespace-nowrap">
                            {formatDuration(s.durationSeconds)}
                          </TableCell>

                          <TableCell className="text-xs text-app-text-muted font-mono">
                            {s.deviceType} • {s.ipAddress}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {historyPagination.totalPages > 1 && (
              <div className="p-3 border-t border-app-border flex items-center justify-between text-xs">
                <span className="text-app-text-muted">
                  Page {historyPagination.page} of {historyPagination.totalPages} ({historyPagination.total} sessions)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={historyPage >= historyPagination.totalPages}
                    onClick={() => setHistoryPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <span className="text-xs font-medium text-app-text-muted">Actions Logged Today</span>
              <div className="text-2xl font-bold text-app-text mt-2">
                {auditStats.todayActions || 0}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                Live operational audit events
              </p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <span className="text-xs font-medium text-app-text-muted">Actions Past 7 Days</span>
              <div className="text-2xl font-bold text-app-text mt-2">
                {auditStats.weekActions || 0}
              </div>
              <p className="text-[11px] text-app-text-muted mt-1">Weekly workshop volume</p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <span className="text-xs font-medium text-app-text-muted">Active Staff Today</span>
              <div className="text-2xl font-bold text-app-text mt-2">
                {auditStats.activeUsersToday || 1}
              </div>
              <p className="text-[11px] text-app-text-muted mt-1">Unique performing accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-app-card border border-app-border shadow-xs">
              <span className="text-xs font-medium text-app-text-muted">Total Filtered Logs</span>
              <div className="text-2xl font-bold text-app-text mt-2">
                {auditPagination.total || 0}
              </div>
              <p className="text-[11px] text-app-text-muted mt-1">Matching current search criteria</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <div className="flex items-center gap-2 text-xs font-bold text-app-text uppercase tracking-wider">
                <Funnel size={14} className="text-app-accent" />
                <span>Filter Audit Trail</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs text-app-text-muted hover:text-app-text transition-colors"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-app-text-muted" />
                <Input
                  type="text"
                  placeholder="Search description, entity ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setAuditPage(1)
                  }}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Module Filter */}
              <div>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value)
                    setAuditPage(1)
                  }}
                  aria-label="Filter by module"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-app-surface border border-app-border text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent"
                >
                  {MODULE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div>
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value)
                    setAuditPage(1)
                  }}
                  aria-label="Filter by action"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-app-surface border border-app-border text-app-text focus:outline-none focus:ring-1 focus:ring-app-accent"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <DatePicker
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val)
                    setAuditPage(1)
                  }}
                  placeholder="Start Date"
                  aria-label="Filter by start date"
                  className="w-full text-xs"
                />
              </div>

              {/* End Date */}
              <div>
                <DatePicker
                  value={endDate}
                  onChange={(val) => {
                    setEndDate(val)
                    setAuditPage(1)
                  }}
                  placeholder="End Date"
                  aria-label="Filter by end date"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-app-card border border-app-border rounded-xl shadow-xs overflow-hidden">
            {loadingAudit ? (
              <div className="p-10 text-center text-sm text-app-text-muted animate-pulse">
                Loading audit trail records...
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No audit logs matching criteria"
                description="Try modifying your filter parameters, date range, or search keyword."
                actionText={search || selectedModule !== 'all' || selectedAction !== 'all' || startDate || endDate ? "Clear Filters" : undefined}
                onAction={handleResetFilters}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User Account</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Entity / Target</TableHead>
                      <TableHead className="min-w-[280px]">Action Description</TableHead>
                      <TableHead>Client IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id
                      const hasChanges = Boolean(log.changes && Object.keys(log.changes).length > 0)
                      const actionBadgeClass = ACTION_COLORS[log.action] || 'bg-slate-500/10 text-slate-600'

                      return (
                        <>
                          <TableRow
                            key={log.id}
                            className={clsx(
                              'cursor-pointer hover:bg-app-surface/50 transition-colors',
                              isExpanded && 'bg-app-surface/60 font-medium'
                            )}
                            onClick={() => hasChanges && setExpandedLogId(isExpanded ? null : log.id)}
                          >
                            <TableCell className="w-10 text-center">
                              {hasChanges ? (
                                isExpanded ? (
                                  <CaretDown size={14} className="text-app-accent inline" weight="bold" />
                                ) : (
                                  <CaretRight size={14} className="text-app-text-muted inline" weight="bold" />
                                )
                              ) : null}
                            </TableCell>

                            <TableCell className="text-xs text-app-text-muted whitespace-nowrap font-mono">
                              {formatDate(log.createdAt)}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar src={log.avatar} name={log.userName} className="w-6 h-6 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-app-text block truncate">
                                    {log.userName}
                                  </span>
                                  <span className="text-[10px] text-app-text-muted">
                                    @{log.username} • {log.userRole}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded border uppercase', actionBadgeClass)}>
                                {log.action}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span className="text-xs font-medium text-app-text capitalize">
                                {log.module.replace('_', ' ')}
                              </span>
                            </TableCell>

                            <TableCell>
                              {log.entityId ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-app-surface border border-app-border text-app-text">
                                  #{log.entityId}
                                </span>
                              ) : (
                                <span className="text-xs text-app-text-muted">—</span>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="text-xs text-app-text leading-relaxed">
                                {log.description}
                                {hasChanges && (
                                  <span className="ml-2 text-[10px] font-semibold text-app-accent inline-flex items-center gap-0.5">
                                    <Eye size={11} />
                                    {isExpanded ? 'Hide changes' : 'Inspect payload'}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs font-mono text-app-text-muted whitespace-nowrap">
                              {log.ipAddress || '—'}
                            </TableCell>
                          </TableRow>

                          {/* Expandable Changes Diff View */}
                          {isExpanded && hasChanges && (
                            <TableRow key={`diff-${log.id}`} className="bg-app-surface/90 border-t border-b border-app-border">
                              <TableCell colSpan={8} className="p-4 pl-12">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold text-app-text uppercase tracking-wider">
                                    <span>Captured Mutation Payload / Attribute Diff</span>
                                    <span className="text-[11px] text-app-text-muted font-normal">
                                      Client Agent: {log.userAgent}
                                    </span>
                                  </div>
                                  <pre className="p-3 rounded-lg bg-black/80 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 leading-normal border border-app-border">
                                    {JSON.stringify(log.changes, null, 2)}
                                  </pre>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {auditPagination.totalPages > 1 && (
              <div className="p-3 border-t border-app-border flex items-center justify-between text-xs">
                <span className="text-app-text-muted">
                  Page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.total} logs)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={auditPage >= auditPagination.totalPages}
                    onClick={() => setAuditPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kill Switch Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleRevokeConfirm}
        title="Terminate Active Session"
        description={`Are you sure you want to forcibly terminate the active session for ${sessionToRevoke?.name} (@${sessionToRevoke?.username})? Their authentication token will be instantly revoked and they will be disconnected immediately.`}
        confirmText="Terminate Session"
        cancelText="Cancel"
        variant="destructive"
        loading={revokeMutation.isPending}
      />
    </div>
  )
}

