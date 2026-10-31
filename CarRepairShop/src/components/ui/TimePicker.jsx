import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { Clock, CaretDown, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Format 24h HH:mm to 12h display { hour12, minute, period: 'AM' | 'PM' }
 */
function parseTimeValue(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return null

  let h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null

  // Ensure within bounds
  h = Math.max(0, Math.min(23, h))
  const minute = Math.max(0, Math.min(59, m))

  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12

  return {
    hour24: h,
    hour12,
    minute,
    period,
  }
}

/**
 * Format 12h components back into standard 24h "HH:mm" string
 */
function to24HourString(hour12, minute, period) {
  let h = hour12 % 12
  if (period === 'PM') h += 12
  const hh = String(h).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * 21st.dev / Origin UI Premium Time Picker
 *
 * Features:
 * - Direct portal rendering to document.body (collision-proof)
 * - Strict overflow clamping (no leaking content or buttons)
 * - Pinned column headers with isolated scroll containers
 * - Obsidian & Electric Lime (Dark) / Clean Slate & Emerald (Light) theme tokens
 * - Interactive scroll columns for Hours and Minutes
 * - AM / PM toggle pill with smooth micro-transition
 * - Popular workshop presets (Opening, Mid-Day, Afternoon, Pickup, Now)
 * - Dual compatibility: returns standard 'HH:mm' string and synthetic event
 */
export default function TimePicker({
  value,
  onChange,
  placeholder = 'Select time...',
  use12Hour = true,
  step = 5,
  disabled = false,
  required = false,
  clearable = true,
  className,
  triggerClassName,
  name,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [placement, setPlacement] = useState('bottom')
  const [dropdownStyle, setDropdownStyle] = useState({})

  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const hoursColRef = useRef(null)
  const minutesColRef = useRef(null)

  const generatedId = useId()
  const inputId = id || generatedId

  // Parsed time
  const parsed = parseTimeValue(value)

  // Internal selection state for the picker columns
  const [selectedHour12, setSelectedHour12] = useState(() => parsed?.hour12 ?? 9)
  const [selectedMinute, setSelectedMinute] = useState(() => parsed?.minute ?? 0)
  const [selectedPeriod, setSelectedPeriod] = useState(() => parsed?.period ?? 'AM')
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (parsed) {
      setSelectedHour12(parsed.hour12)
      setSelectedMinute(parsed.minute)
      setSelectedPeriod(parsed.period)
    }
  }

  // Coordinate calculation
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = 340
    const isTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    const width = 280 // Balanced 280px width
    let left = rect.left

    if (left + width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - width - 12)
    }
    if (left < 12) {
      left = 12
    }

    setPlacement(isTop ? 'top' : 'bottom')
    setDropdownStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      ...(isTop
        ? { bottom: `${viewportHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
      zIndex: 99999999,
    })
  }, [])

  // Auto scroll to active items when opened
  useEffect(() => {
    if (!isOpen) return
    updateCoords()

    // Smooth scroll active column items into view
    const timer = setTimeout(() => {
      if (hoursColRef.current) {
        const activeHour = hoursColRef.current.querySelector('[data-active="true"]')
        if (activeHour) {
          activeHour.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }
      if (minutesColRef.current) {
        const activeMin = minutesColRef.current.querySelector('[data-active="true"]')
        if (activeMin) {
          activeMin.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }
    }, 60)

    const handleScrollOrResize = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false)
          return
        }
      }
      updateCoords()
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updateCoords])

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Emit changes
  const emitChange = (timeStr) => {
    if (!onChange) return
    const syntheticEvent = {
      target: { name: name || inputId, value: timeStr },
      currentTarget: { name: name || inputId, value: timeStr },
      preventDefault: () => {},
      stopPropagation: () => {},
    }
    onChange(syntheticEvent, timeStr)
    if (onChange.length === 1 && typeof timeStr === 'string') {
      try {
        onChange(syntheticEvent)
      } catch {
        onChange(timeStr)
      }
    }
  }

  const handleApplyTime = (h12, m, p) => {
    const time24 = to24HourString(h12, m, p)
    emitChange(time24)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    emitChange('')
  }

  // Generate hours array (1-12)
  const hours12List = Array.from({ length: 12 }, (_, i) => i + 1)

  // Generate minutes array based on step
  const minutesList = []
  for (let m = 0; m < 60; m += step) {
    minutesList.push(m)
  }

  // Quick preset handlers
  const handleSelectPreset = (time24) => {
    emitChange(time24)
    setIsOpen(false)
  }

  const handleSelectNow = () => {
    const now = new Date()
    const h = now.getHours()
    const m = Math.round(now.getMinutes() / step) * step
    const formatted = `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    emitChange(formatted)
    setIsOpen(false)
  }

  // Formatted trigger text
  const getDisplayText = () => {
    if (!parsed) return ''
    if (use12Hour) {
      const hh = String(parsed.hour12).padStart(2, '0')
      const mm = String(parsed.minute).padStart(2, '0')
      return `${hh}:${mm} ${parsed.period}`
    }
    const hh = String(parsed.hour24).padStart(2, '0')
    const mm = String(parsed.minute).padStart(2, '0')
    return `${hh}:${mm}`
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Hidden input for form submission compatibility */}
      <input
        type="hidden"
        name={name}
        id={inputId}
        value={value || ''}
        required={required}
        disabled={disabled}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setIsOpen(!isOpen)
        }}
        className={cn(
          'flex h-8 w-full items-center justify-between rounded-lg border border-app-border bg-app-input px-2.5 py-1 text-xs text-app-text transition-all outline-none cursor-pointer select-none',
          'hover:border-app-muted/60 focus:border-app-accent focus:ring-1 focus:ring-app-accent',
          isOpen && 'border-app-accent ring-1 ring-app-accent shadow-xs',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none bg-app-hover/50',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock
            size={15}
            weight={parsed ? 'fill' : 'regular'}
            className={cn(
              'shrink-0 transition-colors',
              parsed ? 'text-app-accent' : 'text-app-muted'
            )}
          />
          <span
            className={cn(
              'truncate font-medium tabular-nums tracking-tight font-sans',
              !parsed && 'text-app-caption font-normal'
            )}
          >
            {parsed ? getDisplayText() : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && parsed && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded text-app-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer outline-none focus:outline-none"
              title="Clear time"
            >
              <X size={12} weight="bold" />
            </span>
          )}
          <CaretDown
            size={12}
            className={cn(
              'text-app-muted transition-transform duration-200',
              isOpen && 'rotate-180 text-app-accent'
            )}
          />
        </div>
      </button>

      {/* Portal Dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className={cn(
              'w-[280px] rounded-xl border border-app-border bg-app-card p-3 shadow-2xl backdrop-blur-md',
              'animate-in fade-in zoom-in-95 duration-150 transition-all select-none overflow-hidden',
              placement === 'top' ? 'origin-bottom' : 'origin-top'
            )}
          >
            {/* Header: Period Pill (AM / PM) + Title */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-app-border/70">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-app-accent" weight="fill" />
                <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider">
                  Select Time
                </span>
              </div>

              {use12Hour && (
                <div className="inline-flex rounded-lg bg-app-hover p-0.5 border border-app-border">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('AM')
                      handleApplyTime(selectedHour12, selectedMinute, 'AM')
                    }}
                    className={cn(
                      'px-2.5 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer outline-none focus:outline-none',
                      selectedPeriod === 'AM'
                        ? 'bg-app-accent text-app-accentText shadow-xs'
                        : 'text-app-muted hover:text-app-text'
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('PM')
                      handleApplyTime(selectedHour12, selectedMinute, 'PM')
                    }}
                    className={cn(
                      'px-2.5 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer outline-none focus:outline-none',
                      selectedPeriod === 'PM'
                        ? 'bg-app-accent text-app-accentText shadow-xs'
                        : 'text-app-muted hover:text-app-text'
                    )}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>

            {/* Time Columns: Hours & Minutes */}
            <div className="grid grid-cols-2 gap-2 h-44 my-1">
              {/* Hours Column */}
              <div className="flex flex-col h-full min-h-0 bg-app-hover/30 border border-app-border/50 rounded-lg p-1 overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted text-center py-1 border-b border-app-border/40 shrink-0 select-none">
                  Hour
                </div>
                <div
                  ref={hoursColRef}
                  className="flex-1 min-h-0 overflow-y-auto space-y-1 py-1 px-0.5 scrollbar-thin scrollbar-thumb-app-border/50 hover:scrollbar-thumb-app-muted/60"
                >
                  {hours12List.map((h) => {
                    const isActive = selectedHour12 === h
                    return (
                      <button
                        key={h}
                        type="button"
                        data-active={isActive}
                        onClick={() => {
                          setSelectedHour12(h)
                          handleApplyTime(h, selectedMinute, selectedPeriod)
                        }}
                        className={cn(
                          'w-full py-1.5 rounded-md text-xs font-semibold tabular-nums transition-all cursor-pointer text-center outline-none focus:outline-none select-none',
                          isActive
                            ? 'bg-app-accent text-app-accentText font-bold shadow-xs scale-[1.02]'
                            : 'text-app-text hover:bg-app-hover hover:text-app-accent active:scale-95'
                        )}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col h-full min-h-0 bg-app-hover/30 border border-app-border/50 rounded-lg p-1 overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted text-center py-1 border-b border-app-border/40 shrink-0 select-none">
                  Minute
                </div>
                <div
                  ref={minutesColRef}
                  className="flex-1 min-h-0 overflow-y-auto space-y-1 py-1 px-0.5 scrollbar-thin scrollbar-thumb-app-border/50 hover:scrollbar-thumb-app-muted/60"
                >
                  {minutesList.map((m) => {
                    const isActive = selectedMinute === m
                    return (
                      <button
                        key={m}
                        type="button"
                        data-active={isActive}
                        onClick={() => {
                          setSelectedMinute(m)
                          handleApplyTime(selectedHour12, m, selectedPeriod)
                        }}
                        className={cn(
                          'w-full py-1.5 rounded-md text-xs font-semibold tabular-nums transition-all cursor-pointer text-center outline-none focus:outline-none select-none',
                          isActive
                            ? 'bg-app-accent text-app-accentText font-bold shadow-xs scale-[1.02]'
                            : 'text-app-text hover:bg-app-hover hover:text-app-accent active:scale-95'
                        )}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="mt-2.5 pt-2 border-t border-app-border/70 flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={handleSelectNow}
                  className="px-2 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border/50 transition-colors font-medium cursor-pointer outline-none focus:outline-none"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('09:00')}
                  className="px-1.5 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border/50 transition-colors font-medium cursor-pointer outline-none focus:outline-none"
                >
                  9 AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('13:00')}
                  className="px-1.5 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border/50 transition-colors font-medium cursor-pointer outline-none focus:outline-none"
                >
                  1 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('17:00')}
                  className="px-1.5 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border/50 transition-colors font-medium cursor-pointer outline-none focus:outline-none"
                >
                  5 PM
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-md bg-app-accent text-app-accentText text-[11px] font-bold hover:bg-app-accentHover transition-colors cursor-pointer shrink-0 shadow-xs outline-none focus:outline-none"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
