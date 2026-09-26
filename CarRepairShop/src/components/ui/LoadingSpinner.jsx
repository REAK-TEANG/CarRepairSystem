import { CircleNotch } from '@phosphor-icons/react'
import clsx from 'clsx'
import { Spin, Pulse } from '../animation/AnimeWrapper'

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
        'flex flex-col items-center justify-center gap-3 font-sans  select-none text-app-text',
        fullPage ? 'min-h-[70vh] w-full' : 'min-h-[300px] w-full py-12',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <Spin>
          <CircleNotch size={spinnerSize} weight="bold" className="text-app-accent" />
        </Spin>
        <Pulse className="absolute inset-0 rounded-full bg-app-accent/15 -z-10" />
      </div>
      {label && <p className="text-xs text-app-muted font-medium tracking-wide">{label}</p>}
    </div>
  )
}
