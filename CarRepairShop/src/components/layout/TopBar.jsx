import React, { useState } from 'react'
import { MagnifyingGlass, Bell, List, SignOut, User, CaretDown, Moon, Sun, Globe, ArrowClockwise, Swap } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const routeTitles = {
  '/admin/dashboard': 'Overview',
  '/dashboard': 'Overview',
  '/customers': 'Customer List',
  '/vehicles': 'Vehicle Registry',
  '/repair-jobs': 'Repair Jobs',
  '/appointments': 'Appointments',
  '/services': 'Service Catalog',
  '/mechanics': 'Mechanic Management',
  '/mechanic/dashboard': 'My Workspace',
}

export default function TopBar({ onToggleSidebar }) {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { user, toggleRole } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const currentTitle = routeTitles[location.pathname] || 'Dashboard'

  return (
    <header className="flex items-center justify-between h-20 px-8 bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-primary)] z-10 font-sans transition-colors duration-250">
      {/* Left: Sidebar Toggle + Breadcrumb + Search */}
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-default lg:hidden"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Breadcrumb Path */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <span>Dashboards</span>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-bold">{currentTitle}</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 pl-10 pr-10 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-default"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded font-mono">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Right Action Icons & User Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent-primary)] transition-default"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={18} weight="bold" className="text-[var(--accent-primary)]" /> : <Moon size={18} weight="bold" />}
          </button>

          <button className="p-2.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-default" title="Refresh Data">
            <ArrowClockwise size={18} weight="bold" />
          </button>

          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="relative p-2.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-default"
            >
              <Bell size={18} weight={notifOpen ? 'fill' : 'bold'} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent-primary)] rounded-full shadow-neon-sm animate-pulse" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-card py-3 z-50 animate-scale-in">
                <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Notifications</h3>
                  <span className="text-[10px] text-[var(--accent-primary)] font-bold">4 New</span>
                </div>
                <div className="divide-y divide-[var(--border-color)]/60 text-xs">
                  <div className="p-3.5 hover:bg-[var(--bg-hover)] transition-default">
                    <p className="font-semibold text-[var(--text-primary)]">56 New users registered</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Just now</p>
                  </div>
                  <div className="p-3.5 hover:bg-[var(--bg-hover)] transition-default">
                    <p className="font-semibold text-[var(--text-primary)]">132 Orders placed</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">59 Minutes ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="p-2.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-default" title="Language">
            <Globe size={18} weight="bold" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-default"
          >
            <div className="w-9 h-9 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-[var(--accent-text)] font-bold text-xs ring-2 ring-[var(--accent-primary)]/30">
              GH
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-tight">{user.role}</p>
            </div>
            <CaretDown size={14} weight="bold" className="text-[var(--text-secondary)] hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-card py-2 z-50 animate-scale-in text-xs">
              <button 
                onClick={() => { toggleRole(); setProfileOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[var(--accent-primary)] hover:bg-[var(--bg-hover)] transition-default font-semibold"
              >
                <Swap size={16} />
                Switch to {user.role === 'admin' ? 'Mechanic' : 'Admin'}
              </button>
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-default">
                <User size={16} />
                Profile Settings
              </button>
              <hr className="my-1 border-[var(--border-color)]" />
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-danger-500 hover:bg-danger-500/10 transition-default font-semibold">
                <SignOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
