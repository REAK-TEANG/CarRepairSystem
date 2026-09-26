import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { FadeIn, ScaleIn } from '../animation/AnimeWrapper'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
      {/* Backdrop */}
      {/* Backdrop */}
      <FadeIn duration={200} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <ScaleIn
        duration={350}
        className={`relative w-full ${maxWidth} bg-app-card border border-app-border rounded-sm shadow-card overflow-hidden z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-4 sm:py-4 border-b border-app-border bg-app-card flex-shrink-0">
          <h2 className="text-sm font-bold text-app-text tracking-tight truncate mr-2">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </ScaleIn>
    </div>
  )
}
