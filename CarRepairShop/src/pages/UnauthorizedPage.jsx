import React from 'react'
import { Link } from 'react-router-dom'
import { LockSimple, ArrowLeft } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const homePath = user?.role === 'mechanic' ? '/mechanic/dashboard' : '/admin/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg text-app-text p-6 font-sans transition-colors duration-250">
      <div className="max-w-md w-full text-center bg-app-card border border-app-border rounded-3xl p-8 shadow-card">
        <div className="w-16 h-16 bg-app-hover rounded-2xl flex items-center justify-center mx-auto mb-6 border border-app-border">
          <LockSimple size={32} className="text-danger-500" weight="bold" />
        </div>
        <h1 className="text-3xl font-extrabold text-app-text mb-2">Access Denied</h1>
        <p className="text-xs text-app-muted mb-6 leading-relaxed">
          You don't have permission to access this page. Your role (<span className="text-app-accent font-bold uppercase">{user?.role}</span>) is restricted from viewing this area.
        </p>
        <Link
          to={homePath}
          className="inline-flex items-center gap-2 px-6 py-3 bg-app-accent hover:opacity-90 text-app-accentText font-bold rounded-full text-xs transition-default shadow-neon uppercase tracking-wider"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to My Dashboard
        </Link>
      </div>
    </div>
  )
}
