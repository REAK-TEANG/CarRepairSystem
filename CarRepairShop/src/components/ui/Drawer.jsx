import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import clsx from 'clsx'

/**
 * Slide-over Drawer Component (Right Sheet)
 * Used for deep item inspections, multi-tab job cards, and side panels without losing table context.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = 'max-w-2xl',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow || ''
      document.body.style.paddingRight = originalPaddingRight || ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      id="portal-drawer-root"
      className="fixed inset-0 w-screen h-screen z-[999999] flex justify-end overflow-hidden"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-xs z-[1] animate-modal-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Drawer'}
        className={clsx(
          'relative z-[2] w-full h-full flex flex-col',
          'bg-app-card border-l border-app-border shadow-2xl overflow-hidden animate-drawer-in',
          width,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 pt-[calc(0.75rem+var(--safe-area-top))] sm:pt-4 border-b border-app-border bg-app-card/95 backdrop-blur-xs flex-shrink-0">
          <div className="min-w-0 flex items-center gap-3">
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-app-text tracking-tight truncate">
                  {title}
                </h2>
                {badge && <span className="flex-shrink-0">{badge}</span>}
              </div>
              {subtitle && (
                <p className="text-xs text-app-muted truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all flex-shrink-0 cursor-pointer touch-manipulation"
            title="Close Drawer"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-5 sm:space-y-6 overscroll-contain">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 pb-[calc(0.75rem+var(--safe-area-bottom))] sm:pb-3.5 border-t border-app-border bg-app-card/95 backdrop-blur-xs flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
