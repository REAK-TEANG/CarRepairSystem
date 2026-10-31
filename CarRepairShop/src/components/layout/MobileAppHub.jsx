import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  X,
  CaretRight,
  SignOut,
  Sun,
  Moon,
  SquaresFour,
  Wrench,
  CalendarBlank,
  Users,
  Car,
  Package,
  Buildings,
  Toolbox,
  UserGear,
  FileText,
  IdentificationBadge,
  ChartLine,
  Gear,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

const navSections = [
  {
    categoryKey: 'nav.dashboards',
    items: [
      { nameKey: 'nav.adminDashboard', href: '/admin/dashboard', icon: SquaresFour, module: 'admin_dashboard', color: 'emerald' },
      { nameKey: 'nav.mechanicWorkspace', href: '/mechanic/dashboard', icon: Wrench, module: 'mechanic_dashboard', color: 'blue' },
    ],
  },
  {
    categoryKey: 'nav.operations',
    items: [
      { nameKey: 'nav.appointments', href: '/appointments', icon: CalendarBlank, module: 'appointments', color: 'cyan' },
      { nameKey: 'nav.repairJobs', href: '/repair-jobs', icon: Wrench, module: 'repair_jobs', color: 'amber' },
      { nameKey: 'nav.customers', href: '/customers', icon: Users, module: 'customers', color: 'indigo' },
      { nameKey: 'nav.vehicles', href: '/vehicles', icon: Car, module: 'vehicles', color: 'purple' },
    ],
  },
  {
    categoryKey: 'nav.workshopSupply',
    items: [
      { nameKey: 'nav.inventory', href: '/inventory', icon: Package, module: 'inventory', color: 'violet' },
      { nameKey: 'nav.suppliers', href: '/suppliers', icon: Buildings, module: 'suppliers', color: 'teal' },
      { nameKey: 'nav.services', href: '/services', icon: Toolbox, module: 'services', color: 'sky' },
      { nameKey: 'nav.mechanics', href: '/mechanics', icon: UserGear, module: 'mechanics', color: 'orange' },
    ],
  },
  {
    categoryKey: 'nav.management',
    items: [
      { nameKey: 'nav.invoices', href: '/invoices', icon: FileText, module: 'invoices', color: 'emerald' },
      { nameKey: 'nav.employees', href: '/employees', icon: IdentificationBadge, module: 'employees', color: 'blue' },
      { nameKey: 'nav.reports', href: '/reports', icon: ChartLine, module: 'reports', color: 'fuchsia' },
      { nameKey: 'nav.settings', href: '/settings', icon: Gear, module: 'settings', color: 'slate' },
    ],
  },
]

const colorBadgeStyles = {
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
  indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25',
  sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25',
  orange: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  fuchsia: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/25',
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25',
}

/**
 * Option 1: Native Mobile Action Sheet / App Hub
 *
 * Full-width, slide-up iOS Settings-style bottom sheet designed specifically for mobile:
 * - Prominent User Profile card at top
 * - Quick Theme / Language / Logout controls
 * - Grouped Surface Cards with squircle colorful icon badges
 * - Generous 48px touch rows with trailing chevrons
 * - Safe-area inset handling
 */
export default function MobileAppHub({ isOpen, onClose }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, can, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  // Prevent background scrolling when sheet is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const isItemVisible = (item) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (item.module === 'admin_dashboard') {
      return user.role === 'admin' || user.role === 'manager'
    }
    if (item.module === 'mechanic_dashboard') {
      return user.role === 'mechanic' || user.role === 'admin' || user.role === 'manager'
    }
    return can(item.module, 'read')
  }

  const handleNavigate = (href) => {
    onClose?.()
    navigate(href)
  }

  const handleSignOut = () => {
    onClose?.()
    logout()
    navigate('/login', { replace: true })
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="App Navigation Hub"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-modal-backdrop cursor-pointer"
        aria-hidden="true"
      />

      {/* Slide-Up Bottom Sheet Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-h-[92vh] flex flex-col',
          'bg-app-card border-t border-app-border rounded-t-3xl shadow-2xl',
          'overflow-hidden animate-sheet-slide-up',
          'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-app-border/80 mx-auto mt-2.5 mb-1.5 shrink-0" />

        {/* Top Profile Card Header */}
        <div className="px-5 py-3 border-b border-app-border bg-app-card/95 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent font-bold text-sm shadow-xs shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-app-text truncate leading-tight">
                {user?.name || 'User'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-app-accent/10 text-app-accent border border-app-accent/20">
                  <ShieldCheck size={11} weight="bold" />
                  <span>{user ? t(`roles.${user.role}`, user.roleTitle || user.role) : 'Staff'}</span>
                </span>
                <span className="text-[11px] text-app-muted truncate hidden sm:inline">
                  {user?.email || user?.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label="Close Hub"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Quick App Preferences Strip */}
        <div className="px-5 py-2.5 border-b border-app-border/70 bg-app-input/20 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border bg-app-card hover:bg-app-hover active:scale-95 transition-all text-xs font-semibold text-app-text touch-manipulation cursor-pointer shadow-xs"
            >
              {isDark ? (
                <>
                  <Sun size={14} weight="bold" className="text-amber-400" />
                  <span>{t('common.lightMode')}</span>
                </>
              ) : (
                <>
                  <Moon size={14} weight="bold" />
                  <span>{t('common.darkMode')}</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" />
          </div>

          {/* Quick Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all text-xs font-semibold text-rose-500 touch-manipulation cursor-pointer"
            title="Sign Out"
          >
            <SignOut size={14} weight="bold" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Scrollable Grouped Navigation Cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(isItemVisible)
            if (visibleItems.length === 0) return null

            return (
              <div key={section.categoryKey}>
                <p className="px-1.5 mb-1.5 text-[11px] font-bold text-app-muted uppercase tracking-wider">
                  {t(section.categoryKey)}
                </p>

                {/* iOS Settings-style Grouped Surface Card */}
                <div className="bg-app-input/35 border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border/50 shadow-xs">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href)
                    const translatedName = t(item.nameKey)
                    const Icon = item.icon
                    const badgeClass = colorBadgeStyles[item.color] || colorBadgeStyles.slate

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 text-left transition-all',
                          'active:scale-[0.99] active:bg-app-hover touch-manipulation cursor-pointer',
                          isActive && 'bg-app-accent/5'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Vibrant Squircle Badge */}
                          <div
                            className={cn(
                              'w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border transition-transform',
                              badgeClass,
                              isActive && 'scale-105 shadow-xs'
                            )}
                          >
                            <Icon size={17} weight={isActive ? 'bold' : 'regular'} />
                          </div>

                          {/* Navigation Title */}
                          <span
                            className={cn(
                              'text-sm truncate transition-colors',
                              isActive
                                ? 'font-bold text-app-accent'
                                : 'font-medium text-app-text'
                            )}
                          >
                            {translatedName}
                          </span>
                        </div>

                        {/* Right Trailing Action / Active Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-app-accent text-app-accentText shadow-xs">
                              Active
                            </span>
                          )}
                          <CaretRight
                            size={14}
                            weight="bold"
                            className={cn(
                              'transition-colors',
                              isActive ? 'text-app-accent' : 'text-app-muted/60'
                            )}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

