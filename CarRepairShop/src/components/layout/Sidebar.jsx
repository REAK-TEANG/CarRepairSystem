import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
} from '@phosphor-icons/react'
import clsx from 'clsx'

const dashboardNav = [
  { name: 'Admin Dashboard', href: '/admin/dashboard', icon: SquaresFour, roles: ['admin'] },
  { name: 'Mechanic Dashboard', href: '/mechanic/dashboard', icon: SquaresFour, roles: ['mechanic'] },
  { name: 'Appointments', href: '/appointments', icon: CalendarBlank, roles: ['admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin'] },
  { name: 'Vehicles', href: '/vehicles', icon: Car, roles: ['admin'] },
  { name: 'Repair Jobs', href: '/repair-jobs', icon: Wrench, roles: ['admin', 'mechanic'] },
  { name: 'Services', href: '/services', icon: Toolbox, roles: ['admin'] },
  { name: 'Mechanics', href: '/mechanics', icon: UserGear, roles: ['admin'] },
]

const settingsNav = [
  { name: 'Inventory', href: '/inventory', icon: Package, disabled: true },
  { name: 'Invoices', href: '/invoices', icon: FileText, disabled: true },
  { name: 'Settings', href: '/settings', icon: Gear, disabled: true },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { user } = useAuth()

  const filteredNav = dashboardNav.filter(item => item.roles.includes(user.role))

  return (
    <aside
      className={clsx(
        'flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-app-text transition-all duration-300 ease-in-out select-none z-20 font-sans',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center h-20 px-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 bg-app-accent rounded-xl flex items-center justify-center shadow-neon-sm">
            <Wrench size={20} className="text-app-accentText" weight="bold" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-semibold text-app-text leading-tight tracking-wide">AUTO REPAIR</h1>
              <p className="text-[10px] text-app-accent font-medium tracking-wider uppercase">Pro Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-6 space-y-6 px-3 overflow-y-auto">
        {/* DASHBOARDS SECTION */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-app-muted uppercase tracking-widest">
              Dashboards
            </p>
          )}
          <nav className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-3.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-app-accent text-app-accentText font-semibold shadow-neon'
                      : 'text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-text'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon
                    size={18}
                    weight={isActive ? 'bold' : 'regular'}
                    className={clsx(
                      'flex-shrink-0 transition-default',
                      isActive ? 'text-app-accentText' : 'text-app-muted group-hover:text-app-accent'
                    )}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap tracking-wide">{item.name}</span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* MODULES SECTION */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-app-muted uppercase tracking-widest">
              Modules
            </p>
          )}
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3.5 px-4 py-2.5 rounded-full text-xs font-normal text-app-muted opacity-50 cursor-not-allowed group"
                title={collapsed ? `${item.name} (Coming Soon)` : undefined}
              >
                <item.icon size={18} className="flex-shrink-0 text-app-muted" />
                {!collapsed && (
                  <span className="whitespace-nowrap tracking-wide flex-1">{item.name}</span>
                )}
                {!collapsed && (
                  <span className="text-[9px] bg-app-hover text-app-muted px-1.5 py-0.5 rounded-md uppercase font-medium">Soon</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-app-accent/20 border border-app-accent/40 flex items-center justify-center text-app-accent font-semibold text-[11px]">
              DW
            </div>
            <div className="text-xs">
              <p className="font-medium text-app-text leading-tight">DWISON</p>
              <p className="text-[10px] text-app-muted font-normal">Workshop v1.0</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-full text-app-muted hover:bg-[var(--sidebar-hover)] hover:text-app-accent transition-default"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </button>
      </div>
    </aside>
  )
}
