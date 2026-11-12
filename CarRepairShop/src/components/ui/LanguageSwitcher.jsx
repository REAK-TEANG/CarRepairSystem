import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, CaretDown } from '@phosphor-icons/react'
import clsx from 'clsx'

const languages = [
  { code: 'km', label: 'ភាសាខ្មែរ', flag: '🇰🇭', short: 'KH' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
]

export default function LanguageSwitcher({ variant = 'topbar', className }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  if (variant === 'pill') {
    return (
      <div className={clsx('inline-flex items-center p-1 rounded-sm bg-app-hover border border-app-border gap-1', className)}>
        {languages.map((l) => {
          const isActive = i18n.language === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n.changeLanguage(l.code)}
              className={clsx(
                'h-8 px-2.5 py-1 flex items-center justify-center gap-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer active:scale-95',
                isActive
                  ? 'bg-app-card text-app-accent shadow-sm border border-app-border ring-1 ring-app-accent/20'
                  : 'text-app-muted hover:text-app-text hover:bg-app-card/50'
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className={clsx('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-app-text hover:bg-app-card transition-all border border-transparent hover:border-app-border cursor-pointer active:scale-95"
        title={`Language: ${currentLang.label}`}
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="font-semibold text-xs hidden sm:inline">{currentLang.short}</span>
        <CaretDown size={12} weight="bold" className="text-app-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] bg-app-card border border-app-border rounded-sm shadow-card py-1.5 z-50 text-xs">
          <div className="px-3 py-1.5 border-b border-app-border text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={13} weight="bold" />
            <span>Select Language / ភាសា</span>
          </div>
          <div className="py-1">
            {languages.map((l) => {
              const isSelected = i18n.language === l.code
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={clsx(
                    'w-full h-8.5 flex items-center justify-between px-3 py-1.5 hover:bg-app-hover active:scale-[0.98] text-left transition-colors cursor-pointer',
                    isSelected && 'text-app-accent font-bold bg-app-accent/10'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                  </div>
                  {isSelected && <Check size={14} weight="bold" className="text-app-accent" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
