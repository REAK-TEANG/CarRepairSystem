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
        return 'bg-app-accent hover:bg-app-accentHover text-app-accentText'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle} maxWidth="max-w-md">
      <div className="space-y-4 text-xs font-sans">
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex-shrink-0">
              <Warning size={20} weight="fill" />
            </div>
          )}
          <div className="flex-1 text-app-text text-xs leading-relaxed pt-0.5">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg text-app-muted hover:bg-app-hover hover:text-app-text transition-colors disabled:opacity-50"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors shadow-subtle disabled:opacity-50 ${getButtonClass()}`}
          >
            {isLoading ? t('common.loading') : resolvedConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
