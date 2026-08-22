import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, SignIn } from '@phosphor-icons/react'
import Logo from '../../components/ui/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (form.username === 'admin' && form.password === 'admin123') {
        navigate('/admin/dashboard')
      } else {
        setError('Invalid username or password')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex bg-app-bg text-app-text font-sans transition-colors duration-200">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-app-card border-r border-app-border relative flex-col justify-center px-16 text-app-text">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-app-accent rounded-lg flex items-center justify-center shadow-subtle">
              <Logo size={24} className="text-app-accentText" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">AUTO REPAIR</h1>
              <p className="text-app-muted text-xs uppercase tracking-wider">Workshop System</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-4 tracking-tight">
            Workshop operations, simplified and centralized.
          </h2>
          <p className="text-app-muted text-sm leading-relaxed">
            Manage repair orders, track parts inventory, schedule technician jobs, and monitor shop performance in one workspace.
          </p>

          <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-app-border">
            {[
              { label: 'Active Repairs', value: '18' },
              { label: 'Customers', value: '1.2K' },
              { label: 'Monthly Revenue', value: '$48.5K' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-app-accent tabular-nums">{stat.value}</p>
                <p className="text-xs text-app-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-app-bg">
        <div className="w-full max-w-md bg-app-card border border-app-border p-8 rounded-xl shadow-card transition-colors duration-200">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-app-accent rounded-lg flex items-center justify-center shadow-subtle">
              <Logo size={20} className="text-app-accentText" strokeWidth={2.2} />
            </div>
            <h1 className="text-base font-bold text-app-text">Auto Repair Shop</h1>
          </div>

          <div>
            <h2 className="text-xl font-bold text-app-text">Sign In</h2>
            <p className="text-xs text-app-muted mt-1">Access your repair shop dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-medium text-app-muted mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-app-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2 pr-10 bg-app-input border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-app-accentText border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SignIn size={16} weight="bold" />
                  Sign In
                </>
              )}
            </button>

            <div className="p-3 bg-app-hover/50 rounded-lg border border-app-border text-center text-xs text-app-muted">
              Demo Credentials: <span className="font-mono text-app-text font-semibold">admin / admin123</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
