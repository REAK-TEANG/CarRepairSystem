import { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlass,
  Bell,
  List,
  SignOut,
  CaretDown,
  Moon,
  Sun,
  ArrowClockwise,
  Wrench,
  User,
  Car,
  Package,
  X,
} from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import { useRepairJobs } from '../../hooks/useRepairJobs'
import { useInventory } from '../../hooks/useInventory'
import LanguageSwitcher from '../ui/LanguageSwitcher'

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
  '/settings': 'titles.workshopSettings',
}

export default function TopBar({ onToggleSidebar }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  const { user, can, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const { data: customers = [] } = useCustomers({ enabled: Boolean(user && can('customers', 'read')) })
  const { data: vehicles = [] } = useVehicles({ enabled: Boolean(user && can('vehicles', 'read')) })
  const { data: repairJobs = [] } = useRepairJobs({}, { enabled: Boolean(user && can('repair_jobs', 'read')) })
  const { data: inventory = [] } = useInventory({ enabled: Boolean(user && can('inventory', 'read')) })

  const currentTitle = routeTitleKeys[location.pathname] ? t(routeTitleKeys[location.pathname]) : t('nav.dashboards')

  // Close search popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Keyboard shortcut for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.querySelector('input')?.focus()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const query = searchQuery.trim().toLowerCase()

  // Compute live multi-entity search results
  const matchingJobs =
    query.length >= 2
      ? repairJobs
          .filter(
            (j) =>
              (j?.orderNumber || '').toLowerCase().includes(query) ||
              (j?.customer || '').toLowerCase().includes(query) ||
              (j?.plate || '').toLowerCase().includes(query)
          )
          .slice(0, 3)
      : []

  const matchingCustomers =
    query.length >= 2
      ? customers
          .filter(
            (c) =>
              (c?.name || '').toLowerCase().includes(query) ||
              (c?.phone || '').includes(query) ||
              (c?.code || '').toLowerCase().includes(query)
          )
          .slice(0, 3)
      : []

  const matchingVehicles =
    query.length >= 2
      ? vehicles
          .filter(
            (v) =>
              (v?.number || '').toLowerCase().includes(query) ||
              (v?.brand || '').toLowerCase().includes(query) ||
              (v?.model || '').toLowerCase().includes(query)
          )
          .slice(0, 3)
      : []

  const matchingParts =
    query.length >= 2
      ? inventory
          .filter(
            (p) =>
              (p?.name || '').toLowerCase().includes(query) ||
              (p?.partCode || '').toLowerCase().includes(query) ||
              (p?.brand || '').toLowerCase().includes(query)
          )
          .slice(0, 3)
      : []

  const totalResults = matchingJobs.length + matchingCustomers.length + matchingVehicles.length + matchingParts.length

  const handleSelectResult = (path) => {
    setIsSearchOpen(false)
    setMobileSearchOpen(false)
    setSearchQuery('')
    navigate(path)
  }

  const handleSignOut = () => {
    setProfileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-primary)] z-20 font-sans transition-colors duration-200">
      {/* Left: Sidebar Toggle + Breadcrumb + Global Search */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-app-muted hover:bg-app-hover hover:text-app-text transition-colors lg:hidden flex-shrink-0"
          aria-label="Toggle navigation menu"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Page Title / Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs text-app-muted min-w-0">
          <span className="hover:text-app-text transition-colors cursor-default hidden md:inline truncate">{t('common.appName')}</span>
          <span className="hidden md:inline">/</span>
          <span className="text-app-text font-bold bg-app-hover/70 px-2.5 py-1 rounded-lg border border-app-border truncate">
            {currentTitle}
          </span>
        </div>

        {/* Desktop Global Search Bar with Live Popover */}
        <div ref={searchRef} className="relative hidden sm:block">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder={t('common.quickSearch')}
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            className="w-48 md:w-60 lg:w-80 pl-9 pr-12 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all shadow-subtle"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-app-muted hover:text-app-text p-0.5 rounded"
              >
                <X size={13} weight="bold" />
              </button>
            ) : (
              <span className="text-[10px] font-mono bg-app-hover border border-app-border px-1.5 py-0.5 rounded text-app-muted select-none hidden lg:inline">
                ⌘K
              </span>
            )}
          </div>

          {/* Quick Search Results Dropdown */}
          {isSearchOpen && query.length >= 2 && (
            <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-app-card border border-app-border rounded-2xl shadow-card py-2 z-50 animate-fade-in text-xs max-h-[75vh] overflow-y-auto max-w-[calc(100vw-2rem)]">
              <div className="px-4 py-2 border-b border-app-border flex items-center justify-between text-[10px] text-app-muted font-bold uppercase tracking-wider">
                <span>
                  {t('common.searchResults')} ({totalResults})
                </span>
                <span className="font-mono">{t('common.escToClose')}</span>
              </div>

              {totalResults === 0 ? (
                <div className="p-5 text-center text-xs text-app-muted">
                  {t('common.noResultsFound')} "{searchQuery}".
                </div>
              ) : (
                <div className="py-1 divide-y divide-app-border/40">
                  {/* Repair Orders */}
                  {matchingJobs.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                        {t('nav.repairJobs')}
                      </p>
                      {matchingJobs.map((j) => (
                        <button
                          key={j.id}
                          onClick={() => handleSelectResult('/repair-jobs')}
                          className="w-full px-4 py-2 hover:bg-app-hover flex items-center gap-2.5 text-left transition-colors"
                        >
                          <Wrench size={15} className="text-app-accent flex-shrink-0" />
                          <div className="truncate flex-1">
                            <span className="font-mono font-bold text-app-accent mr-2">{j.orderNumber}</span>
                            <span className="text-app-text font-medium">{j.customer}</span>
                            <span className="text-[10px] text-app-muted ml-1.5">({j.vehicle})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Customers */}
                  {matchingCustomers.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                        {t('nav.customers')}
                      </p>
                      {matchingCustomers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectResult('/customers')}
                          className="w-full px-4 py-2 hover:bg-app-hover flex items-center gap-2.5 text-left transition-colors"
                        >
                          <User size={15} className="text-emerald-500 flex-shrink-0" />
                          <div className="truncate flex-1">
                            <span className="font-semibold text-app-text">{c.name}</span>
                            <span className="text-[10px] text-app-muted ml-2 font-mono">{c.phone}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Vehicles */}
                  {matchingVehicles.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                        {t('nav.vehicles')}
                      </p>
                      {matchingVehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectResult('/vehicles')}
                          className="w-full px-4 py-2 hover:bg-app-hover flex items-center gap-2.5 text-left transition-colors"
                        >
                          <Car size={15} className="text-sky-500 flex-shrink-0" />
                          <div className="truncate flex-1">
                            <span className="font-mono font-bold text-app-accent mr-2">{v.number}</span>
                            <span className="text-app-text font-medium">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-[10px] text-app-muted ml-1.5">({v.owner})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inventory Parts */}
                  {matchingParts.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                        {t('nav.inventory')}
                      </p>
                      {matchingParts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectResult('/inventory')}
                          className="w-full px-4 py-2 hover:bg-app-hover flex items-center gap-2.5 text-left transition-colors"
                        >
                          <Package size={15} className="text-amber-500 flex-shrink-0" />
                          <div className="truncate flex-1">
                            <span className="font-semibold text-app-text">{p.name}</span>
                            <span className="text-[10px] text-app-muted ml-2">({p.stockQty} in stock)</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Action Icons & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="p-2 rounded-xl text-app-muted hover:bg-app-hover hover:text-app-text transition-all sm:hidden"
          title={t('common.quickSearch')}
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme and Alerts controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-app-hover/50 border border-app-border p-0.5 sm:p-1 rounded-2xl">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-app-muted hover:bg-app-card hover:text-app-text transition-all"
            title={isDark ? t('common.lightMode') : t('common.darkMode')}
          >
            {isDark ? <Sun size={17} weight="bold" className="text-amber-400" /> : <Moon size={17} weight="bold" />}
          </button>

          {/* Refresh Button (desktop only) */}
          <button
            className="p-2 rounded-xl text-app-muted hover:bg-app-card hover:text-app-text transition-all hidden sm:block"
            title={t('common.refresh')}
            onClick={() => window.location.reload()}
          >
            <ArrowClockwise size={17} weight="bold" />
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
                    className="relative p-1.5 sm:p-2 rounded-xl text-app-muted hover:bg-app-card hover:text-app-text transition-all"
                    aria-label="Notifications"
                  >
                    <Bell size={17} weight={notifOpen ? 'fill' : 'bold'} />
                    {liveAlerts.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-app-card" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-app-card border border-app-border rounded-2xl shadow-card py-2 z-50 animate-fade-in max-w-[calc(100vw-1.5rem)]">
                      <div className="px-4 py-2.5 border-b border-app-border flex items-center justify-between">
                        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{t('common.liveAlerts')}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          {liveAlerts.length} {t('common.active')}
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
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-app-border mx-0.5 sm:mx-1" />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-2xl hover:bg-app-hover transition-all border border-transparent hover:border-app-border"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-app-accent/15 border border-app-accent/30 rounded-xl flex items-center justify-center text-app-accent font-bold text-xs shadow-subtle">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : '?'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card)]" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-app-text leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-app-muted font-medium uppercase tracking-wider">
                {user ? t(`roles.${user.role}`, user.roleTitle) : ''}
              </p>
            </div>
            <CaretDown size={13} weight="bold" className="text-app-muted hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-app-card border border-app-border rounded-2xl shadow-card py-2 z-50 animate-fade-in text-xs max-w-[calc(100vw-1.5rem)]">
              <div className="px-4 py-3 border-b border-app-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-app-accent/15 border border-app-accent/30 rounded-xl flex items-center justify-center text-app-accent font-bold text-sm flex-shrink-0">
                    {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : '?'}
                  </div>
                  <div className="truncate flex-1 min-w-0">
                    <p className="font-bold text-app-text truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-app-muted truncate">{user?.email || ''}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-app-accent/10 text-app-accent font-semibold">
                      {user ? t(`roles.${user.role}`, user.roleTitle) : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium text-xs"
                >
                  <SignOut size={15} />
                  {t('common.signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Full Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden flex flex-col p-4 animate-fade-in">
          <div ref={mobileSearchRef} className="bg-app-card border border-app-border rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  autoFocus
                  placeholder={t('common.quickSearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text focus:outline-none focus:border-app-accent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-app-muted hover:text-app-text"
              >
                {t('common.cancel')}
              </button>
            </div>

            {/* Live Search Results */}
            {query.length >= 2 && (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-app-border pt-2 text-xs">
                {totalResults === 0 ? (
                  <p className="text-center py-6 text-app-muted">{t('common.noResultsFound')}</p>
                ) : (
                  <>
                    {matchingJobs.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => handleSelectResult('/repair-jobs')}
                        className="w-full py-2.5 flex items-center gap-2.5 text-left"
                      >
                        <Wrench size={16} className="text-app-accent flex-shrink-0" />
                        <div className="truncate flex-1">
                          <p className="font-semibold text-app-text">{j.orderNumber} · {j.customer}</p>
                          <p className="text-[10px] text-app-muted">{j.vehicle}</p>
                        </div>
                      </button>
                    ))}
                    {matchingCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectResult('/customers')}
                        className="w-full py-2.5 flex items-center gap-2.5 text-left"
                      >
                        <User size={16} className="text-emerald-500 flex-shrink-0" />
                        <div className="truncate flex-1">
                          <p className="font-semibold text-app-text">{c.name}</p>
                          <p className="text-[10px] text-app-muted font-mono">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                    {matchingVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelectResult('/vehicles')}
                        className="w-full py-2.5 flex items-center gap-2.5 text-left"
                      >
                        <Car size={16} className="text-sky-500 flex-shrink-0" />
                        <div className="truncate flex-1">
                          <p className="font-semibold text-app-text">{v.number} - {v.brand} {v.model}</p>
                          <p className="text-[10px] text-app-muted">{v.owner}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
