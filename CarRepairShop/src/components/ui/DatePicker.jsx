import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { CalendarBlank, CaretLeft, CaretRight, CaretDown, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * Helper to safely format Date to YYYY-MM-DD without UTC timezone drift
 */
function toDateString(year, month, day) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

/**
 * Helper to parse YYYY-MM-DD into { year, month (0-indexed), day }
 */
function parseDateString(str) {
  if (!str) return null
  if (str instanceof Date && !isNaN(str)) {
    return {
      year: str.getFullYear(),
      month: str.getMonth(),
      day: str.getDate()
    }
  }
  if (typeof str === 'string') {
    const parts = str.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return { year, month, day }
      }
    }
  }
  return null
}

/**
 * 21st.dev / Origin UI Premium Date Picker
 *
 * Features:
 * - Direct portal rendering to document.body (collision-proof inside modals/drawers)
 * - Auto-flip placement (opens upward when near viewport bottom)
 * - Obsidian & Electric Lime (Dark) / Clean Slate & Emerald (Light) theme tokens
 * - Quick jump for Month and Year
 * - Quick date presets ("Today", "Tomorrow", "In 1 Week", "Next Monday")
 * - Dual compatibility for onChange: passes both formatted string and synthetic event
 * - Keyboard navigation (Escape closes, Enter selects)
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  format = 'MMM D, YYYY',
  minDate,
  maxDate,
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
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)

  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const generatedId = useId()
  const inputId = id || generatedId

  // Selected date components
  const parsedValue = parseDateString(value)

  // Current calendar view year & month
  const today = new Date()
  const [viewYear, setViewYear] = useState(() => parsedValue?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsedValue?.month ?? today.getMonth())
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (parsedValue) {
      setViewYear(parsedValue.year)
      setViewMonth(parsedValue.month)
    }
  }

  // Update coordinate positioning for the portal
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = 350
    const isTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    const width = 288 // Compact 288px (w-72)
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

  // Listen to resize and scroll
  useEffect(() => {
    if (!isOpen) return
    updateCoords()

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
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updateCoords])

  // Click outside to close
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
        setIsMonthPickerOpen(false)
        setIsYearPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsMonthPickerOpen(false)
        setIsYearPickerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Emit change safely supporting both (str) => ... and (e) => setVal(e.target.value)
  const emitChange = (dateStr) => {
    if (!onChange) return
    const syntheticEvent = {
      target: { name: name || inputId, value: dateStr },
      currentTarget: { name: name || inputId, value: dateStr },
      preventDefault: () => {},
      stopPropagation: () => {},
    }
    onChange(syntheticEvent, dateStr)
    // If user passed a single-arg handler expecting string directly:
    if (onChange.length === 1 && typeof dateStr === 'string') {
      try {
        onChange(syntheticEvent)
      } catch {
        onChange(dateStr)
      }
    }
  }

  // Check if a given calendar day is disabled by minDate or maxDate
  const isDateDisabled = useCallback(
    (year, month, day) => {
      const parsedMin = parseDateString(minDate)
      const parsedMax = parseDateString(maxDate)

      if (parsedMin) {
        if (year < parsedMin.year) return true
        if (year === parsedMin.year && month < parsedMin.month) return true
        if (year === parsedMin.year && month === parsedMin.month && day < parsedMin.day) return true
      }
      if (parsedMax) {
        if (year > parsedMax.year) return true
        if (year === parsedMax.year && month > parsedMax.month) return true
        if (year === parsedMax.year && month === parsedMax.month && day > parsedMax.day) return true
      }
      return false
    },
    [minDate, maxDate]
  )

  const handleSelectDate = (year, month, day) => {
    if (isDateDisabled(year, month, day)) return
    const formatted = toDateString(year, month, day)
    emitChange(formatted)
    setIsOpen(false)
    setIsMonthPickerOpen(false)
    setIsYearPickerOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    emitChange('')
  }

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Quick preset shortcuts
  const selectToday = () => {
    const now = new Date()
    handleSelectDate(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const selectTomorrow = () => {
    const tmrw = new Date()
    tmrw.setDate(tmrw.getDate() + 1)
    handleSelectDate(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate())
  }

  const selectInAWeek = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    handleSelectDate(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate())
  }

  // Generate calendar grid (6 weeks x 7 days)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays = []

  // Trailing days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    calendarDays.push({ year: y, month: m, day, isCurrentMonth: false })
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ year: viewYear, month: viewMonth, day: i, isCurrentMonth: true })
  }

  // Leading days of next month to complete 42 cells (6 rows)
  const remaining = 42 - calendarDays.length
  for (let i = 1; i <= remaining; i++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    calendarDays.push({ year: y, month: m, day: i, isCurrentMonth: false })
  }

  // Formatted display text for trigger button
  const getDisplayText = () => {
    if (!parsedValue) return ''
    return `${MONTH_NAMES_SHORT[parsedValue.month]} ${parsedValue.day}, ${parsedValue.year}`
  }

  // Quick year list for fast picker (-20 years to +10 years)
  const yearOptions = []
  const currentYearNum = today.getFullYear()
  for (let y = currentYearNum - 10; y <= currentYearNum + 10; y++) {
    yearOptions.push(y)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Hidden input for HTML form submission compatibility */}
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
          if (!isOpen) {
            if (parsedValue) {
              setViewYear(parsedValue.year)
              setViewMonth(parsedValue.month)
            }
          }
          setIsOpen(!isOpen)
          setIsMonthPickerOpen(false)
          setIsYearPickerOpen(false)
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
          <CalendarBlank
            size={15}
            weight={parsedValue ? 'fill' : 'regular'}
            className={cn(
              'shrink-0 transition-colors',
              parsedValue ? 'text-app-accent' : 'text-app-muted'
            )}
          />
          <span
            className={cn(
              'truncate font-medium',
              !parsedValue && 'text-app-caption font-normal'
            )}
          >
            {parsedValue ? getDisplayText() : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && parsedValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded text-app-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear date"
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
              'w-[288px] rounded-xl border border-app-border bg-app-card p-3 shadow-2xl backdrop-blur-md overflow-hidden',
              'animate-in fade-in zoom-in-95 duration-150 transition-all select-none',
              placement === 'top' ? 'origin-bottom' : 'origin-top'
            )}
          >
            {/* Header: Month & Year Selector + Prev/Next buttons */}
            <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-app-border/70">
              <div className="flex items-center gap-1">
                {/* Month Picker Dropdown Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthPickerOpen(!isMonthPickerOpen)
                    setIsYearPickerOpen(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                  <CaretDown size={10} className={cn('text-app-muted transition-transform', isMonthPickerOpen && 'rotate-180')} />
                </button>

                {/* Year Picker Dropdown Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsYearPickerOpen(!isYearPickerOpen)
                    setIsMonthPickerOpen(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-app-text hover:bg-app-hover transition-colors cursor-pointer"
                >
                  <span>{viewYear}</span>
                  <CaretDown size={10} className={cn('text-app-muted transition-transform', isYearPickerOpen && 'rotate-180')} />
                </button>
              </div>

              {/* Prev / Next navigation buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all cursor-pointer"
                  title="Previous month"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover active:scale-95 transition-all cursor-pointer"
                  title="Next month"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Quick Month Selector Overlay */}
            {isMonthPickerOpen ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {MONTH_NAMES_SHORT.map((name, idx) => {
                  const isCurrent = idx === viewMonth
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx)
                        setIsMonthPickerOpen(false)
                      }}
                      className={cn(
                        'py-2 px-1 text-xs rounded-lg font-medium transition-all cursor-pointer text-center',
                        isCurrent
                          ? 'bg-app-accent text-app-accentText font-bold shadow-xs'
                          : 'text-app-text hover:bg-app-hover hover:text-app-accent'
                      )}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            ) : isYearPickerOpen ? (
              /* Quick Year Selector Overlay */
              <div className="grid grid-cols-3 gap-1.5 py-1 max-h-48 overflow-y-auto pr-1">
                {yearOptions.map((y) => {
                  const isCurrent = y === viewYear
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y)
                        setIsYearPickerOpen(false)
                      }}
                      className={cn(
                        'py-1.5 px-1 text-xs rounded-lg font-medium transition-all cursor-pointer text-center font-mono',
                        isCurrent
                          ? 'bg-app-accent text-app-accentText font-bold shadow-xs'
                          : 'text-app-text hover:bg-app-hover hover:text-app-accent'
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Calendar Days Grid */
              <>
                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-[11px] font-semibold text-app-muted/80 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => {
                    const isSelected =
                      parsedValue &&
                      parsedValue.year === item.year &&
                      parsedValue.month === item.month &&
                      parsedValue.day === item.day

                    const isToday =
                      today.getFullYear() === item.year &&
                      today.getMonth() === item.month &&
                      today.getDate() === item.day

                    const isCellDisabled = isDateDisabled(item.year, item.month, item.day)

                    return (
                      <button
                        key={`${item.year}-${item.month}-${item.day}-${idx}`}
                        type="button"
                        disabled={isCellDisabled}
                        onClick={isCellDisabled ? undefined : () => handleSelectDate(item.year, item.month, item.day)}
                        className={cn(
                          'relative h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all select-none',
                          isCellDisabled
                            ? 'opacity-25 cursor-not-allowed pointer-events-none line-through text-app-muted'
                            : 'cursor-pointer outline-none focus:outline-none',
                          // Current month vs other month
                          item.isCurrentMonth
                            ? 'text-app-text'
                            : 'text-app-muted/35 hover:text-app-muted/70',
                          // Selected state
                          isSelected && !isCellDisabled
                            ? 'bg-app-accent text-app-accentText font-bold shadow-xs scale-105 z-10'
                            : !isCellDisabled && 'hover:bg-app-hover active:scale-95',
                          // Today ring indicator if not selected
                          isToday && !isSelected && !isCellDisabled && 'border border-app-accent/60 font-semibold'
                        )}
                      >
                        {item.day}
                        {isToday && !isSelected && !isCellDisabled && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-app-accent" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Quick Presets Bar */}
                <div className="mt-2.5 pt-2 border-t border-app-border flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={selectToday}
                      className="px-2 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover transition-colors font-medium cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={selectTomorrow}
                      className="px-2 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover transition-colors font-medium cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={selectInAWeek}
                      className="px-2 py-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover transition-colors font-medium cursor-pointer"
                    >
                      +1 Week
                    </button>
                  </div>
                  {parsedValue && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-app-muted hover:text-rose-500 transition-colors font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
