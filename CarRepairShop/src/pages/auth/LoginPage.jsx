import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeSlash, SignIn, ShieldCheck, Key, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import Logo from '../../components/ui/Logo'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { Modal, LoadingButton } from '../../components/ui'
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
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans selection:bg-emerald-300 selection:text-emerald-950">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-3">
        <LanguageSwitcher variant="pill" className="bg-white/15 backdrop-blur-md border-white/20 text-white" />
      </div>

      {/* Main Two-Column Layout */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center z-10 py-6">
        {/* Left Branding / Hero Side */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center text-white px-4 lg:px-8">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3.5 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <Logo size={26} className="text-white" strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white block">
                {t('common.appName')}
              </span>
              <p className="text-emerald-100/75 text-xs uppercase tracking-widest font-semibold">
                {t('common.appSubtitle')}
              </p>
            </div>
          </div>

          {/* Headline and Tagline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Hey, Hello!
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-emerald-100">
              Join The Workshop Management System!
            </p>
            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed font-normal pt-2">
              We provide all the advantages that can simplify all your vehicle repairs, appointments, spare parts inventory, and financial workflows without any hassle.
            </p>
          </div>

          {/* Capability Badges */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/15 max-w-lg">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <p className="text-sm font-bold text-white">6 RBAC Roles</p>
              <p className="text-xs text-emerald-100/75 mt-0.5">Role Access</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <p className="text-sm font-bold text-white">PostgreSQL</p>
              <p className="text-xs text-emerald-100/75 mt-0.5">Live Database</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <p className="text-sm font-bold text-white">REST API</p>
              <p className="text-xs text-emerald-100/75 mt-0.5">Secure JWT</p>
            </div>
          </div>
        </div>

        {/* Right Floating Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-[440px] bg-white dark:bg-[#1E2328] rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-emerald-950/30 border border-white/40 dark:border-gray-800 p-6 sm:p-9 md:p-10 transition-all">
            {/* Mobile Header Logo */}
            <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <Logo size={24} className="text-white" strokeWidth={2.4} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{t('common.appName')}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.appSubtitle')}</p>
              </div>
            </div>

            {/* Card Titles */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {t('auth.signInSubtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl text-xs font-medium animate-fade-in">
                  {error}
                </div>
              )}

              {/* Username Input */}
              <div>
                <label htmlFor="username" className="sr-only">
                  {t('auth.emailLabel')}
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Forgot Password link positioned right under password like in the design */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-2xl text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <SignIn size={18} weight="bold" />
                    <span>Login</span>
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="relative flex py-2 items-center my-1">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Demo Role Quick Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t('auth.demoQuickLogin')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROLE_PROFILES).map(([key, prof]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={loading}
                      onClick={() => handleRoleQuickSelect(key)}
                      className="flex flex-col items-start px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all group disabled:opacity-50 cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {prof.name}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full">
                        {t(`roles.${key}`, prof.roleTitle)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="text-center pt-3 text-xs text-gray-500 dark:text-gray-400">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => addToast('Please contact your workshop administrator for account setup.', 'info')}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot & Reset Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={forgotStep === 1 ? t('auth.forgotPasswordTitle') : t('auth.resetPassword')}
      >
        <div className="space-y-4 text-xs font-sans">
          {forgotError && (
            <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-medium">
              {forgotError}
            </div>
          )}

          {forgotStep === 1 ? (
            /* STEP 1: Enter Username/Email */
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-app-text">
                <Key size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-app-muted">
                  {t('auth.forgotPasswordSubtitle')}
                </p>
              </div>

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.emailLabel')} / Username *
                </label>
                <input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. admin or admin@carrepair.com"
                  className="w-full px-3.5 py-2.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-app-muted hover:bg-app-hover transition-colors font-medium cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <LoadingButton type="submit" loading={forgotLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t('auth.requestResetCode')}
                </LoadingButton>
              </div>
            </form>
          ) : (
            /* STEP 2: Verification Code & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {codePreview && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} weight="bold" />
                    <span>
                      Verification code for <strong className="font-mono font-bold">{forgotIdentifier}</strong>:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm bg-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-300 tracking-wider">
                    {codePreview}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.resetCodeLabel')} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder={t('auth.resetCodePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text font-mono tracking-widest text-center text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-app-muted font-medium mb-1.5">
                  {t('auth.newPasswordLabel')} *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    className="w-full px-3.5 py-2.5 pr-10 bg-app-input border border-app-border rounded-xl text-xs text-app-text focus:outline-none focus:border-emerald-500"
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
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-app-input border border-app-border rounded-xl text-xs text-app-text focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1)
                    setForgotError('')
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-app-muted hover:text-app-text hover:bg-app-hover rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{t('common.back')}</span>
                </button>
                <LoadingButton type="submit" loading={forgotLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
