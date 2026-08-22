import { useState } from 'react'
import { MagnifyingGlass, Bell, List, SignOut, CaretDown, Moon, Sun, ArrowClockwise, Check } from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const routeTitles = {
  '/admin/dashboard': 'Admin Overview',
  '/mechanic/dashboard': 'Mechanic Workspace',
  '/appointments': 'Appointments Schedule',
  '/repair-jobs': 'Repair Jobs & Work Orders',
  '/customers': 'Customer Directory',
  '/vehicles': 'Vehicle Registry',
  '/inventory': 'Spare Parts Inventory',
  '/suppliers': 'Suppliers & Procurement',
  '/services': 'Service Catalog',
  '/mechanics': 'Mechanics & Staff Roster',
  '/invoices': 'Invoices & Billing',
  '/employees': 'Staff & Attendance',
  '/reports': 'Analytics & Reports',
  '/settings': 'Workshop Settings',
}

export default function TopBar({ onToggleSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { user, switchRole, allRoles } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const currentTitle = routeTitles[location.pathname] || 'Dashboard'

  const handleRoleChange = (newRole) => {
    switchRole(newRole)
    setProfileOpen(false)
    const targetProfile = allRoles.find((r) => r.role === newRole)
    if (targetProfile?.defaultRoute) {
      navigate(targetProfile.defaultRoute)
    }
  }

  return (
    <header className="flex items-center justify-between h-20 px-6 lg:px-8 bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-primary)] z-10 font-sans transition-colors duration-200">
      {/* Left: Sidebar Toggle + Breadcrumb + Search */}
      <div className="flex items-center gap-4 lg:gap-6">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors lg:hidden"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Breadcrumb Path */}
        <div className="hidden md:flex items-center gap-2 text-xs text-app-muted">
          <span>Workshop</span>
          <span>/</span>
          <span className="text-app-text font-semibold">{currentTitle}</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder="Search orders, parts, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 lg:w-72 pl-9 pr-8 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
          />
        </div>
      </div>

      {/* Right Action Icons & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} weight="bold" className="text-amber-400" /> : <Moon size={17} weight="bold" />}
          </button>

          <button
            className="p-2 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
            title="Refresh"
            onClick={() => window.location.reload()}
          >
            <ArrowClockwise size={17} weight="bold" />
          </button>

          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="relative p-2 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
            >
              <Bell size={17} weight={notifOpen ? 'fill' : 'bold'} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-app-accent rounded-full" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-app-card border border-app-border rounded-xl shadow-card py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-app-border flex items-center justify-between">
                  <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">Notifications</h3>
                  <span className="text-[10px] text-app-accent font-semibold">Live Feed</span>
                </div>
                <div className="divide-y divide-app-border text-xs">
                  <div className="p-3 hover:bg-app-hover transition-colors">
                    <p className="font-semibold text-app-text">RO-2026-0042 in progress</p>
                    <p className="text-[10px] text-app-muted mt-0.5">Assigned to Mike Johnson</p>
                  </div>
                  <div className="p-3 hover:bg-app-hover transition-colors">
                    <p className="font-semibold text-app-text">Ceramic Brake Pads low stock</p>
                    <p className="text-[10px] text-app-muted mt-0.5">24 units remaining</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-app-border mx-1" />

        {/* Profile & 6-Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-app-hover transition-colors"
          >
            <div className="w-8 h-8 bg-app-accent rounded-lg flex items-center justify-center text-app-accentText font-bold text-xs shadow-subtle">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-app-text leading-tight">{user.name}</p>
              <p className="text-[10px] text-app-muted leading-tight">{user.roleTitle}</p>
            </div>
            <CaretDown size={13} weight="bold" className="text-app-muted hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-app-card border border-app-border rounded-xl shadow-card py-2 z-50 animate-fade-in text-xs">
              <div className="px-3.5 py-2 border-b border-app-border">
                <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider">Switch Active Role (RBAC Demo)</p>
              </div>

              <div className="py-1 max-h-60 overflow-y-auto">
                {allRoles.map((r) => {
                  const isCurrent = r.role === user.role
                  return (
                    <button
                      key={r.role}
                      onClick={() => handleRoleChange(r.role)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-app-hover transition-colors text-left ${
                        isCurrent ? 'bg-app-hover font-semibold text-app-accent' : 'text-app-text'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate text-xs">{r.name}</p>
                        <p className="text-[10px] text-app-muted truncate">{r.roleTitle}</p>
                      </div>
                      {isCurrent && <Check size={14} weight="bold" className="text-app-accent flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-app-border pt-1">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-app-hover transition-colors font-medium text-xs"
                >
                  <SignOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
