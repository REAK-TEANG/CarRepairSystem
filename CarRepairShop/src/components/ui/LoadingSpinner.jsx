import { CircleNotch } from '@phosphor-icons/react'

/**
 * Clean, lightweight loading indicator for page transitions & Suspense.
 */
export default function LoadingSpinner({ label = 'Loading workspace...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-3 font-sans animate-fade-in">
      <CircleNotch size={28} weight="bold" className="text-app-accent animate-spin" />
      {label && <p className="text-xs text-app-muted font-medium">{label}</p>}
    </div>
  )
}
