import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui'

export default function ProtectedRoute({ allowedRoles, module }) {
  const { user, can, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner />
  }

  // If user is not logged in, redirect to login preserving intended target
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // System Administrator permanently retains 100% root access across all routes and pages
  if (user.role === 'admin') {
    return <Outlet />
  }

  // Dynamic RBAC: If module is specified, verify read permission dynamically from matrix
  if (module && !can(module, 'read')) {
    return <Navigate to="/unauthorized" replace />
  }

  // Fallback / explicit role whitelist
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // If authorized, render the child routes
  return <Outlet />
}
