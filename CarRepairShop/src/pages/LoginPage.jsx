import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Eye, EyeSlash, SignIn } from '@phosphor-icons/react'

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
    }, 800)
  }

  return (
    <div className="min-h-screen flex bg-app-bg text-app-text font-sans transition-colors duration-250">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-app-bg border-r border-app-border relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-app-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-app-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-app-text">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 bg-app-accent rounded-2xl flex items-center justify-center shadow-neon">
              <Wrench size={26} weight="bold" className="text-app-accentText" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">AUTO REPAIR</h1>
              <p className="text-app-accent font-semibold text-xs tracking-wider uppercase">Pro Edition</p>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Manage your shop<br />
            <span className="text-app-accent">with precision.</span>
          </h2>
          <p className="text-app-muted text-base max-w-md leading-relaxed">
            Real-time diagnostics, vehicle history, customer management, and analytics powered by an ultra-fast dashboard.
          </p>

          <div className="flex gap-8 mt-12 pt-8 border-t border-app-border">
            {[
              { label: 'Active Repairs', value: '18' },
              { label: 'Customers', value: '1.2K' },
              { label: 'Monthly Revenue', value: '$48.5K' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold text-app-accent">{stat.value}</p>
                <p className="text-xs text-app-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-app-bg">
        <div className="w-full max-w-md bg-app-card border border-app-border p-8 rounded-3xl shadow-card transition-colors duration-250">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 bg-app-accent rounded-xl flex items-center justify-center shadow-neon">
              <Wrench size={20} weight="bold" className="text-app-accentText" />
            </div>
            <h1 className="text-lg font-bold text-app-text">Auto Repair Pro</h1>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-app-text">Welcome Back</h2>
            <p className="text-xs text-app-muted mt-1">Sign in to access your repair dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="px-4 py-3 bg-danger-500/10 border border-danger-500/30 text-danger-500 rounded-2xl text-xs font-semibold animate-slide-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-app-muted mb-2 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-default"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-app-muted mb-2 uppercase tracking-wider">
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
                  className="w-full px-4 py-3 pr-11 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-default"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-default"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-app-accent hover:opacity-90 text-app-accentText font-extrabold rounded-xl text-xs tracking-wider uppercase transition-default shadow-neon disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-app-accentText border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SignIn size={18} weight="bold" />
                  Sign In
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-app-muted mt-4">
              Demo Credentials: <span className="font-mono text-app-accent font-bold">admin / admin123</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
