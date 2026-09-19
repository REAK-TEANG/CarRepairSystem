import { Warning } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
        </DialogHeader>
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
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 rounded-xl"
            >
              {resolvedCancelText}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`h-9 px-4 rounded-xl shadow-subtle font-semibold ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-app-accent hover:bg-app-accentHover text-white'
              }`}
            >
              {isLoading ? t('common.loading') : resolvedConfirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
