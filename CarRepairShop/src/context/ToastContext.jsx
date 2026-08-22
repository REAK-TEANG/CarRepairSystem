/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-app-card border border-app-border rounded-xl shadow-card text-xs animate-fade-in text-app-text"
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && (
                <CheckCircle size={17} weight="fill" className="text-emerald-500 flex-shrink-0" />
              )}
              {toast.type === 'warning' && (
                <WarningCircle size={17} weight="fill" className="text-amber-500 flex-shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info size={17} weight="fill" className="text-app-accent flex-shrink-0" />
              )}
              <p className="font-medium leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-app-muted hover:text-app-text transition-colors p-0.5 rounded"
            >
              <X size={13} weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
