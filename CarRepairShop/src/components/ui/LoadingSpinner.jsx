import { CircleNotch } from '@phosphor-icons/react'
import clsx from 'clsx'

export default function LoadingSpinner({
  label = 'Loading workspace...',
  size = 'md',
  fullPage = false,
  className = '',
}) {
  const sizeMap = {
    sm: 18,
    md: 28,
    lg: 38,
  }

  const spinnerSize = sizeMap[size] || 28

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 font-sans animate-fade-in select-none text-app-text',
        fullPage ? 'min-h-[70vh] w-full' : 'min-h-[300px] w-full py-12',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <CircleNotch size={spinnerSize} weight="bold" className="text-app-accent animate-spin" />
        <div className="absolute inset-0 rounded-full bg-app-accent/15 animate-ping -z-10 opacity-75" />
      </div>
      {label && <p className="text-xs text-app-muted font-medium tracking-wide">{label}</p>}
    </div>
  )
}
