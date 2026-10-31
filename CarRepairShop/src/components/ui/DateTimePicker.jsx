import DatePicker from './DatePicker'
import TimePicker from './TimePicker'
import { cn } from '@/lib/utils'

/**
 * 21st.dev Premium Unified Date & Time Picker
 *
 * Combines DatePicker and TimePicker in a responsive grid.
 * Can be used either with unified ISO value ('YYYY-MM-DDTHH:mm')
 * or with separate date and time handlers.
 */
export default function DateTimePicker({
  value,
  onChange,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
  required = false,
  datePlaceholder = 'Select date...',
  timePlaceholder = 'Select time...',
  className,
  name,
}) {
  // If unified ISO string is provided ('YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm')
  let resolvedDate = dateValue || ''
  let resolvedTime = timeValue || ''

  if (value) {
    if (value instanceof Date && !isNaN(value)) {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')
      const hh = String(value.getHours()).padStart(2, '0')
      const mm = String(value.getMinutes()).padStart(2, '0')
      resolvedDate = `${y}-${m}-${d}`
      resolvedTime = `${hh}:${mm}`
    } else if (typeof value === 'string') {
      const parts = value.includes('T') ? value.split('T') : value.split(' ')
      resolvedDate = parts[0] || ''
      resolvedTime = parts[1]?.slice(0, 5) || ''
    }
  }

  const handleDateChange = (eOrStr, directVal) => {
    const newDate = typeof directVal === 'string' ? directVal : (eOrStr?.target?.value ?? eOrStr ?? '')
    if (onDateChange) {
      onDateChange(eOrStr, newDate)
    }
    if (onChange) {
      const combined = newDate ? `${newDate}T${resolvedTime || '09:00'}` : ''
      const syntheticEvent = {
        target: { name, value: combined },
        currentTarget: { name, value: combined },
      }
      onChange(syntheticEvent, combined)
    }
  }

  const handleTimeChange = (eOrStr, directVal) => {
    const newTime = typeof directVal === 'string' ? directVal : (eOrStr?.target?.value ?? eOrStr ?? '')
    if (onTimeChange) {
      onTimeChange(eOrStr, newTime)
    }
    if (onChange) {
      const datePart = resolvedDate || new Date().toISOString().split('T')[0]
      const combined = newTime ? `${datePart}T${newTime}` : ''
      const syntheticEvent = {
        target: { name, value: combined },
        currentTarget: { name, value: combined },
      }
      onChange(syntheticEvent, combined)
    }
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full', className)}>
      <DatePicker
        value={resolvedDate}
        onChange={handleDateChange}
        placeholder={datePlaceholder}
        disabled={disabled}
        required={required}
      />
      <TimePicker
        value={resolvedTime}
        onChange={handleTimeChange}
        placeholder={timePlaceholder}
        disabled={disabled}
        required={required}
      />
    </div>
  )
}
