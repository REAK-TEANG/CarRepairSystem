import Modal from './Modal'
import { Warning } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}) {
  const { t } = useTranslation()
  const resolvedTitle = title || t('common.confirm')
  const resolvedConfirmText = confirmText || (variant === 'danger' ? t('common.delete') : t('common.confirm'))
  const resolvedCancelText = cancelText || t('common.cancel')
  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white'
      default:
        return 'bg-app-accent hover:bg-app-accentHover active:scale-[0.98] text-app-accentText'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle} maxWidth="max-w-md">
      <div className="space-y-4 text-xs font-sans">
        <div className="flex items-start gap-3.5">
          {variant === 'danger' && (
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex-shrink-0">
              <Warning size={22} weight="fill" />
            </div>
          )}
          {variant === 'warning' && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
              <Warning size={22} weight="fill" />
            </div>
          )}
          <div className="flex-1 text-app-text text-xs leading-relaxed pt-0.5">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-app-border bg-app-card text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] transition-all text-xs font-medium cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 font-semibold rounded-lg transition-all shadow-subtle active:scale-[0.98] disabled:opacity-50 cursor-pointer text-xs ${getButtonClass()}`}
          >
            {isLoading ? t('common.loading') : resolvedConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
