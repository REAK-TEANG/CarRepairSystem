import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * Backward-compatible Modal wrapper adhering to Shadcn UI Dialog.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="space-y-4 text-xs font-sans">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
