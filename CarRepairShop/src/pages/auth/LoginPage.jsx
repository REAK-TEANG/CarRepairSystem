import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeSlash, SignIn, ShieldCheck } from '@phosphor-icons/react'
import Logo from '../../components/ui/Logo'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { useAuth, ROLE_PROFILES } from '../../context/AuthContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { switchRole } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: 'admin', password: 'password123' })
  const [error, setError] = useState('')

  const handleRoleQuickSelect = (roleKey) => {
    switchRole(roleKey)
    const profile = ROLE_PROFILES[roleKey]
    if (profile?.defaultRoute) {
      navigate(profile.defaultRoute)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (form.username) {
        switchRole('admin')
        navigate('/admin/dashboard')
      } else {
        setError('Invalid username or password')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen flex bg-app-bg text-app-text font-sans transition-colors duration-200 relative">
      {/* Top right language & theme toggle */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-3">
        <LanguageSwitcher variant="pill" />
      </div>

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-app-card border-r border-app-border relative flex-col justify-center px-16 text-app-text">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-app-accent rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Logo size={26} className="text-app-accentText" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide uppercase">{t('common.appName')}</h1>
              <p className="text-app-muted text-xs uppercase tracking-wider">{t('common.appSubtitle')}</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-4 tracking-tight">
            {t('auth.signInTitle')}
          </h2>
          <p className="text-app-muted text-sm leading-relaxed">
            {t('auth.signInSubtitle')}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-app-border">
            <div>
              <p className="text-xl font-bold text-app-accent tabular-nums">18</p>
              <p className="text-xs text-app-muted mt-0.5">{t('nav.repairJobs')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-app-accent tabular-nums">1.2K</p>
              <p className="text-xs text-app-muted mt-0.5">{t('nav.customers')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-app-accent tabular-nums">$48.5K</p>
              <p className="text-xs text-app-muted mt-0.5">{t('dashboard.totalRevenue')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-8 bg-app-bg pt-16 sm:pt-8">
        <div className="w-full max-w-md bg-app-card border border-app-border p-5 sm:p-8 rounded-2xl shadow-card transition-colors duration-200">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 bg-app-accent rounded-xl flex items-center justify-center shadow-subtle">
              <Logo size={22} className="text-app-accentText" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-app-text">{t('common.appName')}</h1>
              <p className="text-[10px] text-app-muted">{t('common.appSubtitle')}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-app-text">{t('common.signIn')}</h2>
            <p className="text-xs text-app-muted mt-1">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-medium text-app-muted mb-1.5 uppercase tracking-wider">
                {t('auth.emailLabel')}
              </label>
              <input
                id="username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-app-muted uppercase tracking-wider">
                  {t('auth.passwordLabel')}
                </label>
                <span className="text-[11px] text-app-accent hover:underline cursor-pointer">
                  {t('auth.forgotPassword')}
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full px-3.5 py-2.5 pr-10 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-app-accentText border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SignIn size={16} weight="bold" />
                  {t('auth.signInButton')}
                </>
              )}
            </button>

            {/* Quick Demo Access */}
            <div className="pt-4 border-t border-app-border">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2">
                <ShieldCheck size={14} className="text-app-accent" />
                <span>{t('auth.demoQuickLogin')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(ROLE_PROFILES).map(([key, prof]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleQuickSelect(key)}
                    className="flex flex-col items-start px-2.5 py-2 rounded-lg bg-app-hover/60 hover:bg-app-hover border border-app-border/70 text-left transition-colors group"
                  >
                    <span className="text-xs font-semibold text-app-text group-hover:text-app-accent">{prof.name}</span>
                    <span className="text-[10px] text-app-muted truncate w-full">{t(`roles.${key}`, prof.roleTitle)}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
