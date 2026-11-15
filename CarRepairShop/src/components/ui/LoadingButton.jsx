import { CircleNotch } from '@phosphor-icons/react'
import clsx from 'clsx'
import { Spin } from '../animation/AnimeWrapper'

export default function LoadingButton({
  children,
  loading = false,
  isLoading,        // alias – stripped from DOM spread
  disabled = false,
  icon: Icon,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const isActive = loading || isLoading
  const baseStyles =
    'inline-flex flex-row items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle cursor-pointer touch-manipulation [&_svg]:shrink-0 [&_svg]:inline-block'

  const variants = {
    primary:
      'bg-app-accent hover:bg-app-accentHover text-app-accentText shadow-subtle active:scale-[0.98]',
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
      disabled={disabled || isActive}
      onClick={onClick}
      className={clsx(baseStyles, variants[variant], 'px-4 py-2', className)}
      {...props}
    >
      {isActive ? (
        <span className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap leading-none">
          <Spin>
            <CircleNotch size={15} weight="bold" className="text-current shrink-0 inline-block" />
          </Spin>
          <span>Processing...</span>
        </span>
      ) : (
        <span className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap leading-none">
          {Icon && <Icon size={15} weight="bold" className="shrink-0 inline-block" />}
          {children}
        </span>
      )}
    </button>
  )
}
