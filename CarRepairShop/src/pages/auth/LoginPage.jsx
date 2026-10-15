import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeSlash, SignIn, Key, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import Logo from '../../components/ui/Logo'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { Modal, LoadingButton, Input } from '../../components/ui'
import { useAuth, ROLE_PROFILES } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, switchRole } = useAuth()
  const { addToast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: 'admin', password: 'password123' })
  const [error, setError] = useState('')

  // Forgot / Reset Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Request Code, 2: Enter Code & New Password
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [codePreview, setCodePreview] = useState('')

  const getTargetRoute = (userProfile, fallbackKey) => {
    const roleRoutes = {
      admin: '/admin/dashboard',
      manager: '/admin/dashboard',
      mechanic: '/mechanic/dashboard',
      service_advisor: '/appointments',
      cashier: '/invoices',
      storekeeper: '/inventory',
    }
    const defaultRoute =
      userProfile?.defaultRoute ||
      (userProfile?.role && roleRoutes[userProfile.role]) ||
      (fallbackKey && ROLE_PROFILES[fallbackKey]?.defaultRoute) ||
      '/admin/dashboard'

    return defaultRoute
  }

  const handleRoleQuickSelect = async (roleKey) => {
    setError('')
    setLoading(true)
    try {
      const user = await switchRole(roleKey)
      const target = getTargetRoute(user, roleKey)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message || 'Quick login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await login(form.username, form.password)
      if (res.success && res.user) {
        const target = getTargetRoute(res.user)
        navigate(target, { replace: true })
      } else {
        setError(res.error || 'Invalid username or password')
      }
    } catch (err) {
      setError(err.message || 'Authentication service unavailable')
    } finally {
      setLoading(false)
    }
  }

  // Open Forgot Password Modal
  const handleOpenForgot = () => {
    setForgotIdentifier(form.username || '')
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setForgotError('')
    setCodePreview('')
    setForgotStep(1)
    setIsForgotOpen(true)
  }

  // Step 1: Request 6-digit reset code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username or email')
      return
    }
    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await authService.forgotPassword(forgotIdentifier.trim())
      if (res?.resetCode) {
        setResetCode(res.resetCode)
        setCodePreview(res.resetCode)
      }
      setForgotStep(2)
    } catch (err) {
      setForgotError(err.message || 'Account not found. Please check username or email.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Step 2: Submit Code & Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetCode.trim()) {
      setForgotError('Please enter the 6-digit verification code')
      return
    }
    if (newPassword.length < 6) {
      setForgotError(t('auth.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setForgotError(t('auth.passwordsDoNotMatch'))
      return
    }

    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await authService.resetPassword(forgotIdentifier.trim(), resetCode.trim(), newPassword)
      addToast(res?.message || t('auth.passwordResetSuccess'), 'success')
      // Populate form with newly set password
      setForm({
        username: forgotIdentifier.trim(),
        password: newPassword,
      })
      setIsForgotOpen(false)
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please verify the code.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-app-bg text-app-text flex items-center justify-center p-4 relative font-sans">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <LanguageSwitcher variant="pill" className="bg-app-card border border-app-border text-app-text shadow-xs" />
      </div>

      {/* Main Centered Minimalist Card */}
      <div className="w-full max-w-[420px] bg-app-card border border-app-border rounded-lg p-6 sm:p-7 shadow-card transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-md bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent mb-3">
            <Logo size={22} className="text-app-accent" strokeWidth={2.4} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-app-text">
            {t('common.appName')}
          </h1>
          <p className="text-xs text-app-muted mt-0.5">
            {t('auth.signInSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md text-xs font-medium">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-[11px] font-medium text-app-muted mb-1">
              {t('auth.emailLabel')} / Username
            </label>
            <Input
              id="username"
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="text-[11px] font-medium text-app-muted">
                Password
              </label>
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-[11px] text-app-accent hover:underline font-medium transition-colors cursor-pointer"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-app-accent hover:bg-app-accentHover active:scale-[0.99] text-app-accentText font-semibold rounded-md text-xs transition-colors disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <SignIn size={15} weight="bold" />
                <span>{t('common.signIn')}</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-app-border"></div>
            <span className="flex-shrink mx-3 text-[10px] font-semibold text-app-muted uppercase tracking-wider">
              {t('auth.demoQuickLogin')}
            </span>
            <div className="flex-grow border-t border-app-border"></div>
          </div>

          {/* Demo Role Quick Switcher */}
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(ROLE_PROFILES).map(([key, prof]) => (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={() => handleRoleQuickSelect(key)}
                className="flex flex-col items-start px-2.5 py-1.5 rounded-md bg-app-hover/50 hover:bg-app-hover border border-app-border hover:border-app-accent/40 text-left transition-colors group disabled:opacity-50 cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-app-text group-hover:text-app-accent transition-colors">
                  {prof.name}
                </span>
                <span className="text-[10px] text-app-muted truncate w-full">
                  {t(`roles.${key}`, prof.roleTitle)}
                </span>
              </button>
            ))}
          </div>

          {/* Card Footer */}
          <div className="text-center pt-2 text-[11px] text-app-muted">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => addToast('Please contact your workshop administrator for account setup.', 'info')}
              className="text-app-accent hover:underline font-semibold cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>

      {/* Forgot & Reset Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={forgotStep === 1 ? t('auth.forgotPasswordTitle') : t('auth.resetPassword')}
      >
        <div className="space-y-4 text-xs font-sans">
          {forgotError && (
            <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-sm font-medium">
              {forgotError}
            </div>
          )}

          {forgotStep === 1 ? (
            /* STEP 1: Enter Username/Email */
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-app-text">
                <Key size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-app-muted">
                  {t('auth.forgotPasswordSubtitle')}
                </p>
              </div>

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.emailLabel')} / Username *
                </label>
                <Input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. admin or admin@carrepair.com"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-3.5 py-2 rounded-sm text-app-muted hover:bg-app-hover transition-colors font-medium cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <LoadingButton type="submit" loading={forgotLoading} className="bg-app-accent hover:bg-app-accentHover text-app-accentText">
                  {t('auth.requestResetCode')}
                </LoadingButton>
              </div>
            </form>
          ) : (
            /* STEP 2: Verification Code & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {codePreview && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} weight="bold" />
                    <span>
                      Verification code for <strong className="font-mono font-bold">{forgotIdentifier}</strong>:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm bg-emerald-500/20 px-2 py-0.5 rounded-sm text-emerald-600 dark:text-emerald-300 tracking-wider">
                    {codePreview}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.resetCodeLabel')} *
                </label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder={t('auth.resetCodePlaceholder')}
                  className="text-sm font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.newPasswordLabel')} *
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                  >
                    {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.confirmPasswordLabel')} *
                </label>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1)
                    setForgotError('')
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98] rounded-sm transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{t('common.back')}</span>
                </button>
                <LoadingButton type="submit" loading={forgotLoading} className="bg-app-accent hover:bg-app-accentHover text-app-accentText">
                  {t('auth.resetPasswordButton')}
                </LoadingButton>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
