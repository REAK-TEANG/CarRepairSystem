import { useNavigate } from 'react-router-dom'
import { ShieldWarning, ArrowLeft, SignOut } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useAuth, ROLE_PROFILES } from '../../context/AuthContext'

export default function UnauthorizedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleGoHome = () => {
    const roleRoutes = {
      admin: '/admin/dashboard',
      manager: '/admin/dashboard',
      mechanic: '/mechanic/dashboard',
      service_advisor: '/appointments',
      cashier: '/invoices',
      storekeeper: '/inventory',
    }
    const target = user?.defaultRoute || (user?.role && (roleRoutes[user.role] || ROLE_PROFILES[user.role]?.defaultRoute)) || '/login'
    navigate(target, { replace: true })
  }

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg text-app-text font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-app-card border border-app-border p-8 rounded-2xl shadow-card text-center transition-colors duration-200">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldWarning size={32} weight="duotone" />
        </div>

        <h1 className="text-xl font-bold text-app-text">{t('auth.unauthorizedTitle')}</h1>
        <p className="text-xs text-app-muted mt-2 leading-relaxed">
          {t('auth.unauthorizedDesc')}{' '}
          <span className="font-semibold text-app-accent font-mono">({user?.role || 'Guest'})</span>
        </p>

        <div className="mt-6 pt-6 border-t border-app-border flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            {t('auth.backToHome')}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-app-hover hover:bg-app-border text-app-text font-semibold rounded-xl text-xs transition-colors border border-app-border cursor-pointer"
          >
            <SignOut size={16} weight="bold" className="text-rose-500" />
            {t('common.signOut')} / {t('common.signIn')}
          </button>
        </div>
      </div>
    </div>
  )
}
