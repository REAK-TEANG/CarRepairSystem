import Modal from './Modal'
import { Warning } from '@phosphor-icons/react'

/**
 * Reusable Confirmation & Deletion Dialog Component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Triggered on cancel or dismiss
 * @param {function} props.onConfirm - Triggered when user confirms the action
 * @param {string} [props.title='Confirm Action'] - Modal title
 * @param {string} props.message - Descriptive warning / confirmation message
 * @param {string} [props.confirmText='Delete'] - Text for the confirm button
 * @param {string} [props.cancelText='Cancel'] - Text for the cancel button
 * @param {'danger'|'warning'|'primary'} [props.variant='danger'] - Visual style of confirm button
 * @param {boolean} [props.isLoading=false] - Disables buttons while processing
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
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
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
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
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors shadow-subtle disabled:opacity-50 ${getButtonClass()}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
