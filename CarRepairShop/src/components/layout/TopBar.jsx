import { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlass,
  Bell,
  List,
  SignOut,
  CaretDown,
  Moon,
  Sun,
  Globe,
} from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'
import { useAppStore } from '../../store/useAppStore'

const routeTitleKeys = {
  '/admin/dashboard': 'titles.adminOverview',
  '/mechanic/dashboard': 'titles.mechanicWorkspace',
  '/appointments': 'titles.appointmentsSchedule',
  '/repair-jobs': 'titles.repairJobsOrders',
  '/customers': 'titles.customerDirectory',
  '/vehicles': 'titles.vehicleRegistry',
  '/inventory': 'titles.sparePartsInventory',
  '/suppliers': 'titles.suppliersProcurement',
  '/services': 'titles.serviceCatalog',
  '/mechanics': 'titles.mechanicsStaffRoster',
  '/invoices': 'titles.invoicesBilling',
  '/employees': 'titles.staffAttendance',
  '/reports': 'titles.analyticsReports',
  '/audit-logs': 'titles.auditLogs',
  '/settings': 'titles.workshopSettings',
}

export default function TopBar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen)

  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const { user, can, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const { data: rawRepairJobs } = useRepairJobs({ all: true }, { enabled: Boolean(user && can('repair_jobs', 'read')) })
  const repairJobs = Array.isArray(rawRepairJobs) ? rawRepairJobs : (rawRepairJobs?.data || [])

  const { data: rawInventory } = useInventory({ all: true }, { enabled: Boolean(user && can('inventory', 'read')) })
  const inventory = Array.isArray(rawInventory) ? rawInventory : (rawInventory?.data || [])

  const currentTitle = routeTitleKeys[location.pathname] ? t(routeTitleKeys[location.pathname]) : t('nav.dashboards')

  // Close profile and notification popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSignOut = () => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 flex items-center justify-between h-14 px-3 sm:px-4 lg:px-6 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-primary)] z-20 font-sans transition-colors duration-200">
      {/* Left: Sidebar Toggle + Breadcrumb + Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="size-9 flex items-center justify-center rounded-lg text-app-muted hover:bg-app-hover active:scale-95 hover:text-app-text transition-all lg:hidden flex-shrink-0 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <List size={20} weight="bold" />
        </button>

        {/* Page Title / Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-app-muted hover:text-app-text transition-colors cursor-default hidden md:inline truncate">{t('common.appName')}</span>
          <span className="hidden md:inline text-app-muted/60">/</span>
          <span className="text-app-text font-semibold truncate">
            {currentTitle}
          </span>
        </div>

        {/* Desktop Global Search Bar - Triggers Universal Spotlight Command Palette */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="relative hidden sm:flex items-center gap-2.5 w-44 md:w-56 lg:w-72 px-3 py-1.5 rounded-lg border border-app-border bg-app-input text-app-muted hover:border-app-accent/50 hover:text-app-text transition-all text-xs cursor-pointer shadow-xs text-left"
          title="Open Command Palette (Ctrl+K or ⌘K)"
        >
          <MagnifyingGlass size={14} className="text-app-muted flex-shrink-0" />
          <span className="flex-1 truncate">{t('common.quickSearch')}</span>
          <span className="text-[10px] font-mono bg-app-hover border border-app-border px-1.5 py-0.5 rounded text-app-muted select-none hidden lg:inline">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right Action Icons & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="size-9 flex items-center justify-center rounded-lg text-app-muted hover:bg-app-hover active:scale-95 hover:text-app-text transition-all sm:hidden cursor-pointer"
          title="Search (⌘K)"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>

        {/* Bell Notifications */}
        <div className="relative">
          {(() => {
            const activeRepairAlerts = repairJobs
              .filter((j) => j.status === 'Diagnosing' || j.status === 'Repairing' || j.status === 'Waiting for Parts')
              .slice(0, 3)
              .map((j) => ({
                id: `job-${j.id}`,
                title: `${j.orderNumber} ${j.status.toLowerCase()}`,
                desc: `${j.customer || 'Customer'} · ${j.vehicle || 'Vehicle'} (${j.mechanic || 'Assigned'})`,
                color: j.status === 'Waiting for Parts' ? 'bg-amber-500' : 'bg-blue-500',
                path: '/repair-jobs',
              }))

            const lowStockAlerts = inventory
              .filter((p) => (Number(p.stockQty) || 0) <= (Number(p.minThreshold) || 5))
              .slice(0, 3)
              .map((p) => ({
                id: `part-${p.id}`,
                title: `${p.name} low stock`,
                desc: `${p.stockQty} units remaining (min: ${p.minThreshold || 5})`,
                color: 'bg-amber-500',
                path: '/inventory',
              }))

            const liveAlerts = [...activeRepairAlerts, ...lowStockAlerts]

            return (
              <>
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen)
                    setProfileOpen(false)
                  }}
                  className="relative size-9 sm:size-8 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell size={18} weight={notifOpen ? 'fill' : 'bold'} />
                  {liveAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-app-card" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] sm:w-80 bg-app-card border border-app-border rounded-xl shadow-xl py-2 z-50 max-w-xs sm:max-w-none">
                    <div className="px-4 py-2.5 border-b border-app-border flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-app-text">{t('common.alerts', 'Alerts')}</h3>
                      <span className="text-xs font-mono text-app-muted">
                        {liveAlerts.length}
                      </span>
                    </div>
                    <div className="divide-y divide-app-border text-xs max-h-72 overflow-y-auto">
                      {liveAlerts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-app-muted">
                          {t('common.noRecords')}
                        </div>
                      ) : (
                        liveAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            onClick={() => {
                              setNotifOpen(false)
                              navigate(alert.path)
                            }}
                            className="p-3.5 hover:bg-app-hover transition-colors flex items-start gap-2.5 cursor-pointer"
                          >
                            <div className={`w-2 h-2 rounded-full ${alert.color} mt-1.5 flex-shrink-0`} />
                            <div className="truncate flex-1">
                              <p className="font-semibold text-app-text truncate">{alert.title}</p>
                              <p className="text-[10px] text-app-muted mt-0.5 truncate">{alert.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-app-border mx-0.5" />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen)
              setNotifOpen(false)
            }}
            className="flex items-center justify-center sm:justify-start gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-lg hover:bg-app-hover transition-all border border-transparent hover:border-app-border cursor-pointer"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-app-accent/15 border border-app-accent/30 rounded-sm flex items-center justify-center text-app-accent font-bold text-xs shadow-subtle">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : '?'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card)]" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-app-text leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-app-muted font-medium">
                {user ? t(`roles.${user.role}`, user.roleTitle) : ''}
              </p>
            </div>
            <CaretDown size={13} weight="bold" className="text-app-muted hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] sm:w-72 max-w-xs bg-app-card border border-app-border rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-app-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-app-accent/15 border border-app-accent/30 rounded-xl flex items-center justify-center text-app-accent font-bold text-sm flex-shrink-0">
                    {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : '?'}
                  </div>
                  <div className="truncate flex-1 min-w-0">
                    <p className="font-bold text-app-text truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-app-muted truncate">{user?.email || ''}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-app-accent/10 text-app-accent font-semibold border border-app-accent/20">
                      {user ? t(`roles.${user.role}`, user.roleTitle) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences: Theme & Language */}
              <div className="p-2 space-y-1 border-b border-app-border">
                {/* Theme Switcher */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-app-hover rounded-lg transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 text-app-text font-medium">
                    {isDark ? (
                      <Sun size={16} weight="bold" className="text-amber-400" />
                    ) : (
                      <Moon size={16} weight="bold" className="text-slate-600 dark:text-slate-300" />
                    )}
                    <span>{t('settings.appearance', 'Theme')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-app-input border border-app-border text-[11px] font-semibold text-app-text shadow-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-400' : 'bg-slate-400'}`} />
                    <span>{isDark ? 'Obsidian' : 'Light'}</span>
                  </div>
                </button>

                {/* Language Switcher */}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-app-text font-medium">
                    <Globe size={16} weight="bold" className="text-app-muted" />
                    <span>{t('settings.language', 'Language')}</span>
                  </div>
                  <div className="flex items-center bg-app-input border border-app-border rounded-lg p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => i18n.changeLanguage('km')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        i18n.language === 'km'
                          ? 'bg-app-accent text-app-accentText shadow-xs'
                          : 'text-app-muted hover:text-app-text'
                      }`}
                    >
                      🇰🇭 ខ្មែរ
                    </button>
                    <button
                      type="button"
                      onClick={() => i18n.changeLanguage('en')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        i18n.language === 'en'
                          ? 'bg-app-accent text-app-accentText shadow-xs'
                          : 'text-app-muted hover:text-app-text'
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-semibold text-xs cursor-pointer"
                >
                  <SignOut size={16} weight="bold" />
                  <span>{t('common.signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
