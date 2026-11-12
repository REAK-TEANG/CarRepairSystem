import { NavLink, useLocation } from 'react-router-dom'
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch'
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
  const prefetchHandlers = useRoutePrefetch()
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
        'bg-app-card/95 backdrop-blur-xl border-t border-app-border select-none',
        'shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.35)]',
        'pb-[max(0.35rem,env(safe-area-inset-bottom))]'
      )}
    >
      <div className="grid grid-flow-col auto-cols-fr items-stretch h-[52px] max-w-lg mx-auto">
        {activeTabs.map((tab) => {
          const Icon = tab.icon

          // Center Action (Intake)
          if (tab.isCenterAction) {
            return (
              <button
                key="center-action"
                type="button"
                onClick={tab.action}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center h-full w-full py-1 text-app-accent hover:text-app-accent/80 active:scale-90 transition-transform duration-100 cursor-pointer outline-none touch-manipulation"
              >
                <div className="w-7 h-7 rounded-full bg-app-accent/15 flex items-center justify-center text-app-accent">
                  <Icon size={18} weight="bold" />
                </div>
                <span className="text-[10px] font-semibold mt-0.5 tracking-tight leading-none text-app-accent">
                  {tab.label}
                </span>
              </button>
            )
          }

          // Action-only tab (e.g. "More" menu)
          if (tab.action) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={tab.action}
                className="flex flex-col items-center justify-center h-full w-full py-1 text-app-muted hover:text-app-text active:scale-95 transition-transform duration-100 cursor-pointer outline-none relative touch-manipulation"
              >
                <Icon size={22} weight="regular" />
                <span className="text-[10px] font-medium mt-0.5 tracking-tight leading-none text-app-muted">
                  {tab.label}
                </span>
              </button>
            )
          }

          // Standard Navigation Link
          const isActive = location.pathname === tab.href || location.pathname.startsWith(tab.href + '/')

          return (
            <NavLink
              key={tab.href}
              to={tab.href}
              {...prefetchHandlers(tab.href)}
              className={cn(
                'flex flex-col items-center justify-center h-full w-full py-1 transition-all duration-100 relative outline-none touch-manipulation active:scale-95',
                isActive ? 'text-app-accent' : 'text-app-muted hover:text-app-text'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-[2px] rounded-b-full bg-app-accent" />
              )}
              <Icon
                size={22}
                weight={isActive ? 'fill' : 'regular'}
                className="transition-transform duration-100"
              />
              <span
                className={cn(
                  'text-[10px] mt-0.5 tracking-tight leading-none transition-colors',
                  isActive ? 'font-bold text-app-accent' : 'font-medium text-app-muted'
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
