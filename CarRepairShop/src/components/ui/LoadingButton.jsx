import { CircleNotch } from '@phosphor-icons/react'
import clsx from 'clsx'
import { Spin } from '../animation/AnimeWrapper'

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
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-sm text-xs font-semibold transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle'

  const variants = {
    primary:
      'bg-app-accent hover:bg-app-accentHover active:scale-[0.98] text-app-accentText shadow-subtle active:scale-[0.98]',
    secondary:
      'bg-app-card hover:bg-app-hover active:scale-[0.98] border border-app-border text-app-text hover:border-app-border/80',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-subtle active:scale-[0.98]',
    ghost:
      'text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] border border-transparent',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(baseStyles, variants[variant], 'px-4 py-2', className)}
      {...props}
    >
      {loading ? (
        <>
          <Spin>
            <CircleNotch size={15} weight="bold" className="text-current flex-shrink-0" />
          </Spin>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={15} weight="bold" className="flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
