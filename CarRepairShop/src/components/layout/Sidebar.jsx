import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'
import {
  SquaresFour,
  Users,
  Car,
  Wrench,
  Package,
  FileText,
  Gear,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Toolbox,
  UserGear,
  Buildings,
  IdentificationBadge,
  ChartLine,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'

const allNavLinks = [
  {
    categoryKey: 'nav.dashboards',
    items: [
      { nameKey: 'nav.adminDashboard', href: '/admin/dashboard', icon: SquaresFour, module: 'admin_dashboard' },
      { nameKey: 'nav.mechanicWorkspace', href: '/mechanic/dashboard', icon: SquaresFour, module: 'mechanic_dashboard' },
    ],
  },
  {
    categoryKey: 'nav.operations',
    items: [
      { nameKey: 'nav.appointments', href: '/appointments', icon: CalendarBlank, module: 'appointments' },
      { nameKey: 'nav.repairJobs', href: '/repair-jobs', icon: Wrench, module: 'repair_jobs' },
      { nameKey: 'nav.customers', href: '/customers', icon: Users, module: 'customers' },
      { nameKey: 'nav.vehicles', href: '/vehicles', icon: Car, module: 'vehicles' },
    ],
  },
  {
    categoryKey: 'nav.workshopSupply',
    items: [
      { nameKey: 'nav.inventory', href: '/inventory', icon: Package, module: 'inventory' },
      { nameKey: 'nav.suppliers', href: '/suppliers', icon: Buildings, module: 'suppliers' },
      { nameKey: 'nav.services', href: '/services', icon: Toolbox, module: 'services' },
      { nameKey: 'nav.mechanics', href: '/mechanics', icon: UserGear, module: 'mechanics' },
    ],
  },
  {
    categoryKey: 'nav.management',
    items: [
      { nameKey: 'nav.invoices', href: '/invoices', icon: FileText, module: 'invoices' },
      { nameKey: 'nav.employees', href: '/employees', icon: IdentificationBadge, module: 'employees' },
      { nameKey: 'nav.reports', href: '/reports', icon: ChartLine, module: 'reports' },
      { nameKey: 'nav.settings', href: '/settings', icon: Gear, module: 'settings' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, can } = useAuth()

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  const isItemVisible = (item) => {
    if (user.role === 'admin') return true
    if (item.module === 'admin_dashboard') {
      return user.role === 'admin' || user.role === 'manager'
    }
    if (item.module === 'mechanic_dashboard') {
      return user.role === 'mechanic' || user.role === 'admin' || user.role === 'manager'
    }
    return can(item.module, 'read')
  }

  const sidebarContent = (
    <aside
      className={clsx(
        'flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-app-text transition-all duration-300 ease-in-out select-none font-sans h-full shadow-sm',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Logo size={22} className="text-white dark:text-gray-950" strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-app-text leading-tight tracking-wide uppercase">{t('common.appName')}</h1>
              <p className="text-[10px] text-app-muted font-semibold tracking-wider uppercase">{t('common.appSubtitle')}</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text lg:hidden"
          >
            <X size={18} weight="bold" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 space-y-5 px-3 overflow-y-auto">
        {allNavLinks.map((section) => {
          const visibleItems = section.items.filter(isItemVisible)
          if (visibleItems.length === 0) return null

          return (
            <div key={section.categoryKey}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                  {t(section.categoryKey)}
                </p>
              )}
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.href
                  const translatedName = t(item.nameKey)
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={handleLinkClick}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-app-accent/12 text-app-accent font-semibold ring-1 ring-app-accent/30 shadow-subtle'
                          : 'text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text'
                      )}
                      title={collapsed ? translatedName : undefined}
                    >
                      <item.icon
                        size={18}
                        weight={isActive ? 'bold' : 'regular'}
                        className={clsx(
                          'flex-shrink-0 transition-colors',
                          isActive ? 'text-app-accent' : 'text-app-muted group-hover:text-app-accent'
                        )}
                      />
                      {!collapsed && (
                        <span className="whitespace-nowrap tracking-wide truncate flex-1">{translatedName}</span>
                      )}
                      {isActive && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-app-accent" />
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      {/* Footer / Active User & Role Indicator */}
      <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent font-bold text-xs">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--sidebar-bg)]" />
            </div>
            <div className="text-xs truncate">
              <p className="font-bold text-app-text leading-tight truncate">{user.name}</p>
              <p className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                {t(`roles.${user.role}`, user.roleTitle)}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-xl text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text transition-colors flex-shrink-0 hidden lg:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer with Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          />
          {/* Drawer content */}
          <div className="relative z-10 w-72 h-full shadow-2xl animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
