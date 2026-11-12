import { useState } from 'react'
import clsx from 'clsx'

const PALETTE = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
]

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function colorOf(name) {
  let hash = 0
  for (const ch of String(name || '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/**
 * User avatar: shows the uploaded photo when there is one, otherwise (or if the
 * image fails to load) a coloured initials badge. No external requests.
 */
export default function Avatar({ src, name, className }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = Boolean(src) && failedSrc !== src

  if (showImage) {
    return (
      <img
        src={src}
        alt={name || ''}
        loading="lazy"
        onError={() => setFailedSrc(src)}
        className={clsx('rounded-full object-cover border border-app-border', className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={name || 'User'}
      className={clsx(
        'inline-flex items-center justify-center rounded-full border border-app-border text-[11px] font-bold select-none',
        colorOf(name),
        className
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
