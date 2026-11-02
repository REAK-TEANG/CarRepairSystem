import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MagnifyingGlass, CaretDown, Check, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * 21st.dev Premium Searchable Select (Combobox) with Portal Dropdown
 * 
 * Features:
 * - Direct portal rendering to document.body, eliminating all modal and container overflow clipping!
 * - Automatic collision detection (opens upward when close to bottom of screen)
 * - Dynamic repositioning on window resize and scroll
 * - Real-time client-side search filtering across label and sublabel
 * - Obsidian & Electric Lime design tokens
 * - Micro-interactions (smooth chevron rotation, active item checkmark, hover glow)
 * - Keyboard navigation (Up/Down arrows, Enter to select, Escape to close)
 * - Click-outside dismissal
 * - Supports simple array of strings or array of objects: { value, label, sublabel?, icon? }
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  className,
  triggerClassName,
  disabled = false,
  required = false,
  clearable = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [, setPlacement] = useState('bottom') // 'bottom' | 'top'
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)
  const generatedId = useId()
  const selectId = id || generatedId

  // Calculate coordinates and portal placement
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = 240

    // Auto-flip upward if too close to bottom of viewport
    const isTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxAvailableHeight = isTop ? spaceAbove - 16 : spaceBelow - 16
    const clampedHeight = Math.min(280, Math.max(120, maxAvailableHeight))

    let left = rect.left
    let width = rect.width

    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8)
    }
    if (left < 8) {
      left = 8
      width = Math.min(width, viewportWidth - 16)
    }

    setPlacement(isTop ? 'top' : 'bottom')
    setDropdownStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      ...(isTop
        ? { bottom: `${viewportHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
      maxHeight: `${clampedHeight}px`,
      zIndex: 99999999, // Above modal overlay (999999)
    })
  }, [])

  // Reposition on scroll and resize
  useEffect(() => {
    if (!isOpen) return
    updateCoords()

    const handleScrollOrResize = (e) => {
      // If scroll is inside the dropdown list itself, do not reposition
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return
      }
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        // If trigger is scrolled completely out of view, close
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

  // Normalize options to uniform { value, label, sublabel, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt), sublabel: null }
    }
    return {
      value: opt.value ?? opt.id,
      label: opt.label ?? opt.name ?? String(opt.value ?? opt.id ?? ''),
      sublabel: opt.sublabel ?? opt.description ?? opt.phone ?? opt.code ?? opt.number ?? null,
      icon: opt.icon ?? null,
      disabled: opt.disabled ?? false,
    }
  })

  // Selected item
  const selectedItem = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  )

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    const matchLabel = opt.label.toLowerCase().includes(q)
    const matchSublabel = opt.sublabel ? String(opt.sublabel).toLowerCase().includes(q) : false
    const matchValue = String(opt.value).toLowerCase().includes(q)
    return matchLabel || matchSublabel || matchValue
  })

  // Auto-focus search input when opening
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Close when clicking outside
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

  const handleToggle = () => {
    if (disabled) return
    if (!isOpen) {
      setSearch('')
      setHighlightedIndex(0)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSearch('')
        setHighlightedIndex(0)
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
        handleSelect(filteredOptions[highlightedIndex])
      }
    }
  }

  const handleSelect = (item) => {
    onChange?.(item.value, item)
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange?.('', null)
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full text-xs font-sans', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submissions / required validation */}
      {required && (
        <input
          type="text"
          value={value ?? ''}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-app-border bg-app-input px-3 py-1.5 text-xs text-app-text shadow-xs transition-all outline-none',
          'hover:border-app-muted/60 focus:border-app-accent focus:ring-1 focus:ring-app-accent/30',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-app-accent ring-1 ring-app-accent/30',
          triggerClassName
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedItem ? (
            <>
              {selectedItem.icon && <span className="flex-shrink-0">{selectedItem.icon}</span>}
              <span className="font-medium text-app-text truncate">{selectedItem.label}</span>
              {selectedItem.sublabel && (
                <span className="text-[11px] font-mono text-app-muted truncate hidden sm:inline">
                  ({selectedItem.sublabel})
                </span>
              )}
            </>
          ) : (
            <span className="text-app-muted">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0 text-app-muted">
          {clearable && selectedItem && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded hover:text-app-text hover:bg-app-hover transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={12} weight="bold" />
            </span>
          )}
          <CaretDown
            size={14}
            weight="bold"
            className={cn('transition-transform duration-200', isOpen && 'rotate-180 text-app-accent')}
          />
        </div>
      </button>

      {/* Floating Popover Dropdown (Rendered via portal to document.body to prevent clipping) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          onKeyDown={handleKeyDown}
          className="rounded-lg border border-app-border bg-app-card text-app-text shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col"
          style={dropdownStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Search Header */}
          <div className="p-2 border-b border-app-border bg-app-card/95 backdrop-blur-xs flex-shrink-0">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none z-10"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-7 py-1.5 bg-app-input border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent/20 transition-all font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text p-0.5 cursor-pointer"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="flex-1 overflow-y-auto p-1 divide-y divide-app-border/30 scrollbar-thin min-h-0"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-app-muted text-xs">
                <p className="font-medium">{emptyMessage}</p>
                {search && (
                  <p className="text-[11px] text-app-muted/70 mt-1">
                    No results for &ldquo;<span className="font-semibold text-app-text">{search}</span>&rdquo;
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedItem && String(selectedItem.value) === String(opt.value)
                const isHighlighted = highlightedIndex === idx

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'group flex items-center justify-between gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs select-none',
                      isSelected
                        ? 'bg-app-accent/15 text-app-accent font-semibold'
                        : isHighlighted
                        ? 'bg-app-hover text-app-text'
                        : 'text-app-text hover:bg-app-hover',
                      opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <p className={cn('truncate', isSelected && 'font-semibold text-app-accent')}>
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p className="text-[11px] font-mono text-app-muted truncate group-hover:text-app-text/70 transition-colors">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} weight="bold" className="text-app-accent flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

