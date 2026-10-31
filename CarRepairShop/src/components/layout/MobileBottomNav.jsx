import { NavLink, useLocation } from 'react-router-dom'
import {
  SquaresFour,
  Wrench,
  Kanban,
  Package,
  Plus,
  FileText,
  CalendarBlank,
  Users,
  List,
  Receipt,
  Buildings,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '@/lib/utils'

/**
 * 21st.dev Premium Mobile Bottom Navigation Bar
 *
 * Features:
 * - Dynamic Role-Based layout (Tailored specifically for Mechanics & Managers)
 * - Safe area inset handling for modern notched devices
 * - Elevated floating center intake button
 * - Tactile micro-interactions (haptic active scale, glowing pill active state)
 * - Seamless integration with Mobile Drawer Menu and Fast Intake Modal
 */
export default function MobileBottomNav({ onOpenMore }) {
  const { user } = useAuth()
  const location = useLocation()
  const setFastIntakeModalOpen = useAppStore((state) => state.setFastIntakeModalOpen)

  const role = user?.role || 'mechanic'

  // 1. Mechanic Navigation Items
  const mechanicTabs = [
    {
      label: 'Bay View',
      href: '/mechanic/dashboard',
      icon: Wrench,
    },
    {
      label: 'Pipeline',
      href: '/repair-jobs',
      icon: Kanban,
    },
    {
      label: 'Parts',
      href: '/inventory',
      icon: Package,
    },
    {
      label: 'More',
      action: onOpenMore,
      icon: List,
    },
  ]

  // 2. Manager / Admin Navigation Items
  const managerTabs = [
    {
      label: 'Overview',
      href: '/admin/dashboard',
      icon: SquaresFour,
    },
    {
      label: 'Pipeline',
      href: '/repair-jobs',
      icon: Wrench,
    },
    {
      label: 'Intake',
      isCenterAction: true,
      action: () => setFastIntakeModalOpen(true),
      icon: Plus,
    },
    {
      label: 'Invoices',
      href: '/invoices',
      icon: FileText,
    },
    {
      label: 'More',
      action: onOpenMore,
      icon: List,
    },
  ]

  // 3. Service Advisor Navigation Items
  const advisorTabs = [
    {
      label: 'Appts',
      href: '/appointments',
      icon: CalendarBlank,
    },
    {
      label: 'Pipeline',
      href: '/repair-jobs',
      icon: Wrench,
    },
    {
      label: 'Intake',
      isCenterAction: true,
      action: () => setFastIntakeModalOpen(true),
      icon: Plus,
    },
    {
      label: 'Customers',
      href: '/customers',
      icon: Users,
    },
    {
      label: 'More',
      action: onOpenMore,
      icon: List,
    },
  ]

  // 4. Default / Other Roles (Cashier, Storekeeper)
  const defaultTabs = [
    {
      label: 'Invoices',
      href: '/invoices',
      icon: Receipt,
    },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: Package,
    },
    {
      label: 'Suppliers',
      href: '/suppliers',
      icon: Buildings,
    },
    {
      label: 'More',
      action: onOpenMore,
      icon: List,
    },
  ]

  let activeTabs = defaultTabs
  if (role === 'mechanic') {
    activeTabs = mechanicTabs
  } else if (role === 'admin' || role === 'manager') {
    activeTabs = managerTabs
  } else if (role === 'service_advisor') {
    activeTabs = advisorTabs
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-app-card/90 backdrop-blur-xl border-t border-app-border',
        'flex items-center justify-around px-2 py-1 select-none',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]',
        'pb-[max(0.45rem,env(safe-area-inset-bottom))]'
      )}
    >
      {activeTabs.map((tab, idx) => {
        const Icon = tab.icon

        // Center Floating Action Button (e.g. + Intake)
        if (tab.isCenterAction) {
          return (
            <div key="center-action" className="relative flex items-center justify-center -mt-5">
              <button
                type="button"
                onClick={tab.action}
                aria-label="Create Fast Intake"
                className={cn(
                  'w-12 h-12 rounded-full bg-app-accent text-app-accentText',
                  'flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-150',
                  'border-4 border-[var(--bg-canvas)] outline-none focus:outline-none cursor-pointer'
                )}
              >
                <Plus size={22} weight="bold" />
              </button>
            </div>
          )
        }

        // Action-only tab (e.g. "More" menu)
        if (tab.action) {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={tab.action}
              className="flex flex-col items-center justify-center py-1 px-3 text-app-muted hover:text-app-text active:scale-95 transition-all outline-none focus:outline-none cursor-pointer"
            >
              <Icon size={20} weight="regular" />
              <span className="text-[10px] font-semibold mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          )
        }

        // Standard Navigation Link
        const isActive = location.pathname.startsWith(tab.href)

        return (
          <NavLink
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 transition-all active:scale-95 outline-none',
              isActive
                ? 'text-app-accent'
                : 'text-app-muted hover:text-app-text'
            )}
          >
            <Icon
              size={20}
              weight={isActive ? 'fill' : 'regular'}
              className={cn('transition-transform duration-150', isActive && 'scale-110')}
            />
            <span
              className={cn(
                'text-[10px] mt-1 tracking-tight transition-colors',
                isActive ? 'font-bold text-app-accent' : 'font-medium'
              )}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-app-accent mt-0.5 animate-pulse" />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
