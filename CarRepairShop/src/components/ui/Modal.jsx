import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidth} bg-app-card border border-app-border rounded-xl shadow-card overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-card">
          <h2 className="text-sm font-bold text-app-text tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
            title="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
