import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import clsx from 'clsx'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
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

    // Prevent layout shift when body scrollbar disappears
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

  // Ensure portal target exists
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      id="portal-modal-root"
      className="fixed inset-0 w-screen h-screen z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5 overflow-hidden"
      role="presentation"
    >
      {/* Backdrop strictly covers entire viewport */}
      <div
        className="fixed inset-0 w-screen h-screen bg-black/65 backdrop-blur-xs z-[1] animate-modal-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card on Desktop / Native Bottom Sheet on Mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={clsx(
          'relative z-[2] w-full',
          maxWidth,
          'bg-app-card border-t sm:border border-app-border rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] animate-sheet-content sm:animate-modal-content',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull-Down Drag Handle */}
        <div className="pt-2 pb-0.5 sm:hidden flex justify-center bg-app-card">
          <div className="w-10 h-1 rounded-full bg-app-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-app-border bg-app-card flex-shrink-0">
          <div className="min-w-0 mr-3">
            <h2 className="text-base sm:text-sm font-semibold text-app-text tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-[11px] text-app-muted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all flex-shrink-0 cursor-pointer touch-manipulation"
            title="Close"
            aria-label="Close"
          >
            <X size={18} className="sm:w-4 sm:h-4" weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-app-border bg-app-card/95 backdrop-blur-xs flex-shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
