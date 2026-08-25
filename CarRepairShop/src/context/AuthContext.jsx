/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { settingsService } from '../services/settingsService'

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SERVICE_ADVISOR: 'service_advisor',
  MECHANIC: 'mechanic',
  CASHIER: 'cashier',
  STOREKEEPER: 'storekeeper',
}

export const ROLE_PROFILES = {
  admin: {
    id: 1,
    name: 'Jane Doe',
    role: 'admin',
    roleTitle: 'System Administrator',
    email: 'admin@workshop.com',
    defaultRoute: '/admin/dashboard',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  manager: {
    id: 2,
    name: 'Marcus Vance',
    role: 'manager',
    roleTitle: 'Workshop Manager',
    email: 'manager@workshop.com',
    defaultRoute: '/admin/dashboard',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  service_advisor: {
    id: 3,
    name: 'Sarah Jenkins',
    role: 'service_advisor',
    roleTitle: 'Service Advisor',
    email: 'advisor@workshop.com',
    defaultRoute: '/appointments',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  mechanic: {
    id: 4,
    name: 'Mike Johnson',
    role: 'mechanic',
    roleTitle: 'Master Technician',
    email: 'mike@workshop.com',
    defaultRoute: '/mechanic/dashboard',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  cashier: {
    id: 5,
    name: 'Emily Watson',
    role: 'cashier',
    roleTitle: 'Chief Cashier',
    email: 'cashier@workshop.com',
    defaultRoute: '/invoices',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  storekeeper: {
    id: 6,
    name: 'David Miller',
    role: 'storekeeper',
    roleTitle: 'Inventory Storekeeper',
    email: 'store@workshop.com',
    defaultRoute: '/inventory',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
}

// Default Global Permission Matrix
export const DEFAULT_PERMISSIONS_MATRIX = {
  customers: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  vehicles: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  appointments: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  repair_jobs: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read', 'update'],
    mechanic: ['read', 'update'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  services: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  mechanics: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: [],
    storekeeper: [],
  },
  inventory: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: [],
    storekeeper: ['create', 'read', 'update', 'delete'],
  },
  suppliers: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: [],
    mechanic: [],
    cashier: [],
    storekeeper: ['create', 'read', 'update', 'delete'],
  },
  invoices: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read'],
    mechanic: [],
    cashier: ['create', 'read', 'update'],
    storekeeper: [],
  },
  employees: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  reports: {
    admin: ['read', 'export'],
    manager: ['read', 'export'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  settings: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['read'],
    service_advisor: [],
    mechanic: [],
    cashier: [],
    storekeeper: [],
  },
}

export const PERMISSIONS_MATRIX = DEFAULT_PERMISSIONS_MATRIX

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Load saved role or default to 'admin'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('demo_role') || ROLES.ADMIN
  })

  // Dynamic permission matrix state
  const [permissionsMatrix, setPermissionsMatrix] = useState(() => {
    const saved = localStorage.getItem('workshop_permissions_matrix')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // fallback
      }
    }
    return DEFAULT_PERMISSIONS_MATRIX
  })

  // Sync permissions matrix from backend database on initial mount
  useEffect(() => {
    settingsService.getPermissionsMatrix().then((matrix) => {
      if (matrix && typeof matrix === 'object') {
        setPermissionsMatrix((prev) => ({ ...prev, ...matrix }))
        localStorage.setItem('workshop_permissions_matrix', JSON.stringify(matrix))
      }
    }).catch(() => {
      // ignore network errors on startup
    })
  }, [])

  const user = ROLE_PROFILES[currentRole] || ROLE_PROFILES.admin

  const switchRole = (newRole) => {
    if (ROLE_PROFILES[newRole]) {
      setCurrentRole(newRole)
      localStorage.setItem('demo_role', newRole)
    }
  }

  // Save new full matrix
  const savePermissionsMatrix = async (newMatrix) => {
    // Ensure admin permanently has full control on all modules
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

  // Toggle or set a specific permission for a role
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

  // Reset to default permission matrix
  const resetPermissionsToDefault = async () => {
    setPermissionsMatrix(DEFAULT_PERMISSIONS_MATRIX)
    localStorage.setItem('workshop_permissions_matrix', JSON.stringify(DEFAULT_PERMISSIONS_MATRIX))
    try {
      await settingsService.updatePermissionsMatrix(DEFAULT_PERMISSIONS_MATRIX)
    } catch {
      // ignore
    }
  }

  // Dynamic Permission evaluation helper
  const can = (moduleName, action = 'read') => {
    // Admin always has 100% full system control
    if (user.role === 'admin') return true

    const modulePerms = permissionsMatrix[moduleName]
    if (!modulePerms) return false
    const rolePerms = modulePerms[user.role] || []
    return rolePerms.includes(action)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        switchRole,
        can,
        permissionsMatrix,
        updateRolePermission,
        savePermissionsMatrix,
        resetPermissionsToDefault,
        allRoles: Object.values(ROLE_PROFILES),
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

