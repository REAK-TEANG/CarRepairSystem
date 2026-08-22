import { NavLink, useLocation } from 'react-router-dom'
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
    category: 'Dashboards',
    items: [
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: SquaresFour, roles: ['admin', 'manager'] },
      { name: 'Mechanic Workspace', href: '/mechanic/dashboard', icon: SquaresFour, roles: ['mechanic'] },
    ],
  },
  {
    category: 'Operations',
    items: [
      { name: 'Appointments', href: '/appointments', icon: CalendarBlank, roles: ['admin', 'manager', 'service_advisor'] },
      { name: 'Repair Jobs', href: '/repair-jobs', icon: Wrench, roles: ['admin', 'manager', 'service_advisor', 'mechanic'] },
      { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager', 'service_advisor', 'cashier'] },
      { name: 'Vehicles', href: '/vehicles', icon: Car, roles: ['admin', 'manager', 'service_advisor', 'mechanic'] },
    ],
  },
  {
    category: 'Workshop & Supply',
    items: [
      { name: 'Inventory & Parts', href: '/inventory', icon: Package, roles: ['admin', 'manager', 'storekeeper', 'mechanic'] },
      { name: 'Suppliers', href: '/suppliers', icon: Buildings, roles: ['admin', 'manager', 'storekeeper'] },
      { name: 'Service Catalog', href: '/services', icon: Toolbox, roles: ['admin', 'manager', 'service_advisor'] },
      { name: 'Mechanics Roster', href: '/mechanics', icon: UserGear, roles: ['admin', 'manager', 'service_advisor'] },
    ],
  },
  {
    category: 'Management',
    items: [
      { name: 'Invoices & Billing', href: '/invoices', icon: FileText, roles: ['admin', 'manager', 'service_advisor', 'cashier'] },
      { name: 'Staff & Employees', href: '/employees', icon: IdentificationBadge, roles: ['admin', 'manager'] },
      { name: 'Reports & Analytics', href: '/reports', icon: ChartLine, roles: ['admin', 'manager'] },
      { name: 'System Settings', href: '/settings', icon: Gear, roles: ['admin'] },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const location = useLocation()
  const { user } = useAuth()

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  const sidebarContent = (
    <aside
      className={clsx(
        'flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-app-text transition-all duration-300 ease-in-out select-none font-sans h-full',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 bg-app-accent rounded-lg flex items-center justify-center shadow-subtle">
            <Logo size={22} className="text-app-accentText" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-semibold text-app-text leading-tight tracking-wide">AUTO REPAIR</h1>
              <p className="text-[10px] text-app-muted font-medium tracking-wider uppercase">Workshop System</p>
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
          const visibleItems = section.items.filter((item) => item.roles.includes(user.role))
          if (visibleItems.length === 0) return null

          return (
            <div key={section.category}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-app-muted uppercase tracking-widest">
                  {section.category}
                </p>
              )}
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={handleLinkClick}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                        isActive
                          ? 'bg-app-accent text-app-accentText font-semibold shadow-subtle'
                          : 'text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon
                        size={17}
                        weight={isActive ? 'bold' : 'regular'}
                        className={clsx(
                          'flex-shrink-0 transition-colors',
                          isActive ? 'text-app-accentText' : 'text-app-muted group-hover:text-app-accent'
                        )}
                      />
                      {!collapsed && <span className="whitespace-nowrap tracking-wide truncate">{item.name}</span>}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      {/* Footer / Active Role Indicator */}
      <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent font-bold text-[11px] flex-shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="text-xs truncate">
              <p className="font-semibold text-app-text leading-tight truncate">{user.name}</p>
              <p className="text-[10px] text-app-muted font-normal uppercase tracking-wider">{user.roleTitle}</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text transition-colors flex-shrink-0 hidden lg:block"
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
