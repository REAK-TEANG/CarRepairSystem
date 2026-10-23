/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { settingsService } from '@/services/settingsService'
import { authService } from '@/services/authService'
import { apiClient } from '@/services/apiClient'

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SERVICE_ADVISOR: 'service_advisor',
  MECHANIC: 'mechanic',
  CASHIER: 'cashier',
  STOREKEEPER: 'storekeeper',
}

// UI styling and default navigation targets for each system role
export const ROLE_METADATA = {
  admin: {
    roleTitle: 'System Administrator',
    defaultRoute: '/admin/dashboard',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  manager: {
    roleTitle: 'Workshop Manager',
    defaultRoute: '/admin/dashboard',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  service_advisor: {
    roleTitle: 'Service Advisor',
    defaultRoute: '/appointments',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  mechanic: {
    roleTitle: 'Master Technician',
    defaultRoute: '/mechanic/dashboard',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  cashier: {
    roleTitle: 'Chief Cashier',
    defaultRoute: '/invoices',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  storekeeper: {
    roleTitle: 'Inventory Storekeeper',
    defaultRoute: '/inventory',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
}

// Export for backward compatibility with existing route lookups
export const ROLE_PROFILES = ROLE_METADATA

// Export empty default for fallback
export const DEFAULT_PERMISSIONS_MATRIX = {}
export const PERMISSIONS_MATRIX = DEFAULT_PERMISSIONS_MATRIX

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Current user state (strictly loaded from database)
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch {
        // fallback
      }
    }
    return null
  })

  // Dynamic permission matrix state loaded directly from PostgreSQL database
  const [permissionsMatrix, setPermissionsMatrix] = useState(() => {
    const saved = localStorage.getItem('workshop_permissions_matrix')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // fallback
      }
    }
    return {}
  })

  // Available real database accounts
  const [availableAccounts, setAvailableAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch all registered active database accounts
  const refreshAccounts = useCallback(async () => {
    try {
      const accounts = await authService.getAccounts()
      if (Array.isArray(accounts)) {
        setAvailableAccounts(accounts)
      }
    } catch {
      // Non-blocking
    }
  }, [])

  // Validate or initialize session on mount
  useEffect(() => {
    const token = apiClient.getToken()
    if (token) {
      authService
        .getMe()
        .then((userData) => {
          if (userData && userData.id) {
            const roleKey = (userData.role || 'admin').toLowerCase().replace(/\s+/g, '_')
            const meta = ROLE_METADATA[roleKey] || ROLE_METADATA.admin
            const mergedUser = {
              ...userData,
              role: roleKey,
              roleTitle: userData.roleTitle || meta.roleTitle,
              badgeColor: meta.badgeColor,
              defaultRoute: meta.defaultRoute,
            }
            setCurrentUser(mergedUser)
            localStorage.setItem('auth_user', JSON.stringify(mergedUser))
          } else {
            authService.logout()
            setCurrentUser(null)
          }
        })
        .catch(() => {
          // Token expired or invalid
          authService.logout()
          setCurrentUser(null)
        })
    }

    // Sync active permissions matrix from PostgreSQL database settings
    settingsService
      .getPermissionsMatrix()
      .then((matrix) => {
        if (matrix && typeof matrix === 'object') {
          setPermissionsMatrix(matrix)
          localStorage.setItem('workshop_permissions_matrix', JSON.stringify(matrix))
        }
      })
      .catch(() => {
        // ignore network errors on startup
      })

    // Load registered database accounts asynchronously
    authService
      .getAccounts()
      .then((accounts) => {
        if (Array.isArray(accounts)) {
          setAvailableAccounts(accounts)
        }
      })
      .catch(() => {})


    // Listen for session expiration events
    const handleAuthExpired = () => {
      authService.logout()
      setCurrentUser(null)
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [refreshAccounts])

  // Login handler using database credentials
  const login = async (username, password) => {
    setLoading(true)
    authService.logout()
    setCurrentUser(null)

    try {
      const res = await authService.login(username, password)
      if (res?.user) {
        const roleKey = (res.user.role || 'admin').toLowerCase().replace(/\s+/g, '_')
        const meta = ROLE_METADATA[roleKey] || ROLE_METADATA.admin
        const mergedUser = {
          ...res.user,
          role: roleKey,
          roleTitle: res.user.roleTitle || meta.roleTitle,
          badgeColor: meta.badgeColor,
          defaultRoute: meta.defaultRoute,
        }
        setCurrentUser(mergedUser)
        localStorage.setItem('auth_user', JSON.stringify(mergedUser))
        return { success: true, user: mergedUser }
      }
      return { success: false, error: 'Login failed' }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid username or password' }
    } finally {
      setLoading(false)
    }
  }

  // Role Switching: Authenticates strictly against database users
  const switchRole = useCallback(async (roleOrIdentifier) => {
    setLoading(true)
    authService.logout()
    setCurrentUser(null)

    try {
      const payload = typeof roleOrIdentifier === 'object'
        ? roleOrIdentifier
        : { role: roleOrIdentifier }
      const res = await authService.quickLogin(payload)
      if (res?.user) {
        const roleKey = (res.user.role || 'admin').toLowerCase().replace(/\s+/g, '_')
        const meta = ROLE_METADATA[roleKey] || ROLE_METADATA.admin
        const mergedUser = {
          ...res.user,
          role: roleKey,
          roleTitle: res.user.roleTitle || meta.roleTitle,
          badgeColor: meta.badgeColor,
          defaultRoute: meta.defaultRoute,
        }
        setCurrentUser(mergedUser)
        localStorage.setItem('auth_user', JSON.stringify(mergedUser))
        return mergedUser
      }
      throw new Error('Account not found in database')
    } catch (err) {
      console.error('Role login failed:', roleOrIdentifier, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout handler
  const logout = useCallback(() => {
    authService.logout()
    setCurrentUser(null)
  }, [])

  // Save new full matrix to database
  const savePermissionsMatrix = async (newMatrix) => {
    const sanitizedMatrix = { ...newMatrix }
    Object.keys(sanitizedMatrix).forEach((mod) => {
      if (!sanitizedMatrix[mod]) sanitizedMatrix[mod] = {}
      sanitizedMatrix[mod].admin = ['create', 'read', 'update', 'delete', 'export']
    })

    setPermissionsMatrix(sanitizedMatrix)
    localStorage.setItem('workshop_permissions_matrix', JSON.stringify(sanitizedMatrix))
    try {
      await settingsService.updatePermissionsMatrix(sanitizedMatrix)
    } catch {
      // persisted locally even if network offline
    }
  }

  // Toggle or set a specific permission for a role and persist to database
  const updateRolePermission = (role, moduleName, action, enabled) => {
    if (role === 'admin') return // Admin permissions are permanently locked on

    setPermissionsMatrix((prev) => {
      const currentModule = prev[moduleName] || {}
      const currentRolePerms = currentModule[role] || []
      let updatedRolePerms
      if (enabled) {
        updatedRolePerms = Array.from(new Set([...currentRolePerms, action]))
      } else {
        updatedRolePerms = currentRolePerms.filter((a) => a !== action)
      }

      const updated = {
        ...prev,
        [moduleName]: {
          ...currentModule,
          [role]: updatedRolePerms,
        },
      }

      localStorage.setItem('workshop_permissions_matrix', JSON.stringify(updated))
      settingsService.updatePermissionsMatrix(updated).catch(() => {})
      return updated
    })
  }

  // Reload permission matrix directly from the PostgreSQL database
  const resetPermissionsToDefault = async () => {
    try {
      const dbMatrix = await settingsService.getPermissionsMatrix()
      if (dbMatrix && typeof dbMatrix === 'object') {
        setPermissionsMatrix(dbMatrix)
        localStorage.setItem('workshop_permissions_matrix', JSON.stringify(dbMatrix))
        return dbMatrix
      }
    } catch {
      // ignore
    }
    return permissionsMatrix
  }

  // Dynamic Permission evaluation helper
  const can = (moduleName, action = 'read') => {
    if (!currentUser) return false
    // Admin always has full access
    if (currentUser.role === 'admin') return true

    const modulePerms = permissionsMatrix[moduleName]
    if (!modulePerms) return false
    const rolePerms = modulePerms[currentUser.role] || []
    return rolePerms.includes(action)
  }

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser?.role || 'admin',
        isAuthenticated: Boolean(currentUser),
        loading,
        login,
        switchRole,
        logout,
        can,
        permissionsMatrix,
        updateRolePermission,
        savePermissionsMatrix,
        resetPermissionsToDefault,
        availableAccounts,
        refreshAccounts,
        allRoles: Object.keys(ROLE_METADATA).map(k => ({ role: k, ...ROLE_METADATA[k] })),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
