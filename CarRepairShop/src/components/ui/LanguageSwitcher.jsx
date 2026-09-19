import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, CaretDown } from '@phosphor-icons/react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

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
      <div className={clsx('inline-flex items-center p-1 rounded-xl bg-app-hover border border-app-border gap-1', className)}>
        {languages.map((l) => {
          const isActive = i18n.language === l.code
          return (
            <Button
              key={l.code}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => i18n.changeLanguage(l.code)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-lg text-xs font-semibold transition-all',
                isActive
                  ? 'bg-app-card text-app-accent shadow-sm border border-app-border ring-1 ring-app-accent/20 hover:bg-app-card'
                  : 'text-app-muted hover:text-app-text hover:bg-app-card/50'
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className={clsx('relative inline-block text-left', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 h-auto rounded-xl text-xs font-medium text-app-text hover:bg-app-card transition-all border border-transparent hover:border-app-border"
        title={`Language: ${currentLang.label}`}
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="font-semibold text-xs hidden sm:inline">{currentLang.short}</span>
        <CaretDown size={12} weight="bold" className="text-app-muted" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-app-card border border-app-border rounded-2xl shadow-card py-1.5 z-50 animate-fade-in text-xs">
          <div className="px-3 py-1.5 border-b border-app-border text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={13} weight="bold" />
            <span>Select Language / ភាសា</span>
          </div>
          <div className="py-1">
            {languages.map((l) => {
              const isSelected = i18n.language === l.code
              return (
                <Button
                  key={l.code}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(l.code)}
                  className={clsx(
                    'w-full h-auto flex items-center justify-between px-3.5 py-2 hover:bg-app-hover text-left transition-colors rounded-none font-normal',
                    isSelected && 'text-app-accent font-bold bg-app-accent/10 hover:bg-app-accent/15'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                  </div>
                  {isSelected && <Check size={14} weight="bold" className="text-app-accent" />}
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
