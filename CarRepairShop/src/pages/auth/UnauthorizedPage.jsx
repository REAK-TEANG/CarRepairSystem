import { Link } from 'react-router-dom'
import { ShieldWarning, ArrowLeft } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function UnauthorizedPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg text-app-text font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-app-card border border-app-border p-8 rounded-2xl shadow-card text-center transition-colors duration-200">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldWarning size={32} weight="duotone" />
        </div>

        <h1 className="text-xl font-bold text-app-text">{t('auth.unauthorizedTitle')}</h1>
        <p className="text-xs text-app-muted mt-2 leading-relaxed">
          {t('auth.unauthorizedDesc')} <span className="font-semibold text-app-accent font-mono">({user?.role})</span>
        </p>

        <div className="mt-6 pt-6 border-t border-app-border flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
          >
            <ArrowLeft size={16} weight="bold" />
            {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
