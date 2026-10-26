import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  Car,
  User,
  Wrench,
  Clock,
  Sparkle,
  CalendarCheck,
  Package,
  Receipt,
  Moon,
  Sun,
  ArrowElbowDownLeft,
  X,
} from '@phosphor-icons/react'
import { useAppStore } from '@/store/useAppStore'
import { useTheme } from '@/context/ThemeContext'
import { useRepairJobs } from '@/hooks/useRepairJobs'
import { useCustomers } from '@/hooks/useCustomers'
import { useVehicles } from '@/hooks/useVehicles'
import { cn } from '@/lib/utils'

function CommandPaletteDialog({ onClose }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Fetch quick lookup data
  const { data: rawJobs = [] } = useRepairJobs({ all: true })
  const { data: rawCustomers = [] } = useCustomers({ all: true })
  const { data: rawVehicles = [] } = useVehicles({ all: true })

  const jobs = useMemo(() => (Array.isArray(rawJobs) ? rawJobs : rawJobs?.data || []), [rawJobs])
  const customers = useMemo(() => (Array.isArray(rawCustomers) ? rawCustomers : rawCustomers?.data || []), [rawCustomers])
  const vehicles = useMemo(() => (Array.isArray(rawVehicles) ? rawVehicles : rawVehicles?.data || []), [rawVehicles])

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [])

  // System Action Items
  const quickActions = useMemo(() => [
    {
      id: 'action-intake',
      category: 'Quick Actions',
      title: 'Fast Vehicle Intake (Check-in)',
      subtitle: 'Create a new work order in under 30 seconds',
      icon: Sparkle,
      action: () => {
        navigate('/repair-jobs')
        onClose()
      },
    },
    {
      id: 'action-appointments',
      category: 'Quick Actions',
      title: 'Schedule Appointment',
      subtitle: 'Book service for returning or new customer',
      icon: CalendarCheck,
      action: () => {
        navigate('/appointments')
        onClose()
      },
    },
    {
      id: 'action-bay',
      category: 'Quick Actions',
      title: 'Mechanic Bay Mode',
      subtitle: 'Shop floor technician task tracking',
      icon: Wrench,
      action: () => {
        navigate('/mechanic/dashboard')
        onClose()
      },
    },
    {
      id: 'action-inventory',
      category: 'Quick Actions',
      title: 'Inventory & Parts Catalog',
      subtitle: 'Lookup stock levels and parts availability',
      icon: Package,
      action: () => {
        navigate('/inventory')
        onClose()
      },
    },
    {
      id: 'action-invoices',
      category: 'Quick Actions',
      title: 'Invoices & Billing',
      subtitle: 'View payments, balance dues, and settled receipts',
      icon: Receipt,
      action: () => {
        navigate('/invoices')
        onClose()
      },
    },
    {
      id: 'action-theme',
      category: 'Quick Actions',
      title: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle Obsidian / Clean theme appearance',
      icon: isDark ? Sun : Moon,
      action: () => {
        toggleTheme()
        onClose()
      },
    },
  ], [navigate, onClose, isDark, toggleTheme])

  // Search Results
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim()
    const results = []

    // 1. Actions matching query
    const matchingActions = quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    )
    results.push(...matchingActions)

    if (q) {
      // 2. Repair Jobs
      const matchingJobs = jobs
        .filter(
          (j) =>
            j.orderNumber?.toLowerCase().includes(q) ||
            j.plate?.toLowerCase().includes(q) ||
            j.vehicle?.toLowerCase().includes(q) ||
            j.customer?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map((j) => ({
          id: `job-${j.id}`,
          category: 'Repair Orders',
          title: `${j.orderNumber} • ${j.plate || j.vehicle}`,
          subtitle: `${j.customer} | ${j.status} | ${j.estimatedCost || '$0.00'}`,
          icon: Clock,
          action: () => {
            navigate('/repair-jobs')
            onClose()
          },
        }))
      results.push(...matchingJobs)

      // 3. Vehicles
      const matchingVehicles = vehicles
        .filter(
          (v) =>
            v.number?.toLowerCase().includes(q) ||
            v.brand?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .map((v) => ({
          id: `veh-${v.id}`,
          category: 'Vehicles',
          title: `${v.brand} ${v.model} (${v.number})`,
          subtitle: `Owner: ${v.customerName || 'No owner'} | ${v.mileage || 0} km`,
          icon: Car,
          action: () => {
            navigate('/vehicles')
            onClose()
          },
        }))
      results.push(...matchingVehicles)

      // 4. Customers
      const matchingCustomers = customers
        .filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.code?.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .map((c) => ({
          id: `cust-${c.id}`,
          category: 'Customers',
          title: c.name,
          subtitle: `Phone: ${c.phone || 'N/A'} | ${c.vehiclesCount || 0} vehicles registered`,
          icon: User,
          action: () => {
            navigate('/customers')
            onClose()
          },
        }))
      results.push(...matchingCustomers)
    }

    return results
  }, [query, quickActions, jobs, vehicles, customers, navigate, onClose])

  // Keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return createPortal(
    <div
      id="portal-command-palette-root"
      className="fixed inset-0 w-screen h-screen z-[9999999] flex items-start justify-center pt-[12vh] px-4 overflow-hidden"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 w-screen h-screen bg-black/65 backdrop-blur-sm z-[1] animate-modal-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Spotlight Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Universal Command Palette"
        className="relative z-[2] w-full max-w-xl bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-modal-content text-xs font-sans"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-app-border bg-app-card/95 backdrop-blur-xs gap-3">
          <MagnifyingGlass size={18} weight="bold" className="text-app-accent flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a plate (2BD-1234), customer, order, or command..."
            className="flex-1 bg-transparent text-sm font-medium text-app-text placeholder:text-app-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-input border border-app-border text-app-muted">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[55vh] overflow-y-auto p-2 divide-y divide-app-border/30 scrollbar-thin"
        >
          {filteredResults.length === 0 ? (
            <div className="py-10 px-4 text-center text-app-muted">
              <p className="font-semibold text-app-text">No matching records or actions</p>
              <p className="text-[11px] text-app-muted mt-1">
                Try searching by license plate, customer name, order number, or service.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const Icon = item.icon
              const isSelected = selectedIndex === idx
              const isFirstInCategory =
                idx === 0 || filteredResults[idx - 1].category !== item.category

              return (
                <div key={item.id} className="pt-1">
                  {isFirstInCategory && (
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-app-muted/80">
                      {item.category}
                    </p>
                  )}
                  <div
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none gap-3',
                      isSelected
                        ? 'bg-app-accent/15 text-app-accent font-medium'
                        : 'text-app-text hover:bg-app-hover'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={cn(
                          'p-1.5 rounded-md flex-shrink-0 transition-colors',
                          isSelected
                            ? 'bg-app-accent text-app-text-inverted'
                            : 'bg-app-input text-app-muted'
                        )}
                      >
                        <Icon size={14} weight={isSelected ? 'bold' : 'regular'} />
                      </div>
                      <div className="truncate">
                        <p className={cn('truncate font-medium', isSelected && 'text-app-accent font-semibold')}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-app-muted truncate font-mono">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-app-accent/80 flex-shrink-0">
                        <span>Select</span>
                        <ArrowElbowDownLeft size={11} weight="bold" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-app-border bg-app-card/90 flex items-center justify-between text-[11px] text-app-muted flex-shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-app-input border border-app-border text-[10px]">↑↓</span> Navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-app-input border border-app-border text-[10px]">↵</span> Open
            </span>
          </div>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-app-input border border-app-border text-[10px]">ESC</span> Dismiss
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function CommandPalette() {
  const isOpen = useAppStore((state) => state.commandPaletteOpen)
  const setOpen = useAppStore((state) => state.setCommandPaletteOpen)

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  if (!isOpen) return null
  return <CommandPaletteDialog onClose={() => setOpen(false)} />
}
