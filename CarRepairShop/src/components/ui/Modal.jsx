import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import clsx from 'clsx'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
      role="presentation"
    >
      {/* Backdrop strictly covers entire viewport */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1,
        }}
        className="animate-modal-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        style={{
          position: 'relative',
          zIndex: 2,
        }}
        className={clsx(
          'w-full',
          maxWidth,
          'bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100vh-2.5rem)] animate-modal-content',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-app-border bg-app-card flex-shrink-0">
          <h2 className="text-sm font-semibold text-app-text tracking-tight truncate mr-3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  )
}

