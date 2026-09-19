import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

export default function LoadingButton({
  children,
  loading = false,
  disabled = false,
  icon: Icon,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variants = {
    primary:
      'bg-app-accent hover:bg-app-accentHover text-white shadow-subtle',
    secondary:
      'bg-app-card hover:bg-app-hover border border-app-border text-app-text hover:border-app-border/80',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-subtle',
    ghost:
      'text-app-muted hover:text-app-text hover:bg-app-hover border border-transparent',
  }

  return (
    <Button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'h-9 px-4 rounded-xl text-xs font-semibold gap-2 transition-all',
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <CircleNotch size={15} weight="bold" className="animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={15} weight="bold" className="flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </Button>
  )
}
