import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'

// In-memory cached permissions matrix
let cachedPermissions = null
let cacheExpiresAt = 0

// Fallback Default Permissions Matrix (matches RBAC specifications)
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

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro'
}

/**
 * Generate a signed JWT token
 */
export function generateToken(payload) {
  const secret = getJwtSecret()
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h'
  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Verify a JWT token
 */
export function verifyToken(token) {
  const secret = getJwtSecret()
  return jwt.verify(token, secret)
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10)
}

/**
 * Compare plaintext password with bcrypt hash (supports $2y$ and $2a$/$2b$)
 */
export async function comparePassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false
  // Normalize PHP $2y$ blowfish hash prefix to standard bcrypt $2a$ for bcryptjs compatibility
  const normalizedHash = storedHash.startsWith('$2y$')
    ? '$2a$' + storedHash.substring(4)
    : storedHash
  return await bcrypt.compare(plainPassword, normalizedHash)
}

/**
 * Fetch permissions matrix from DB with in-memory caching
 */
export async function getPermissionsMatrix() {
  const now = Date.now()
  if (cachedPermissions && now < cacheExpiresAt) {
    return cachedPermissions
  }

  try {
    const row = await query.get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'")
    if (row?.setting_value) {
      cachedPermissions = JSON.parse(row.setting_value)
      cacheExpiresAt = now + 60000 // Cache for 1 minute
      return cachedPermissions
    }
  } catch {
    // ignore db error, use fallback
  }

  cachedPermissions = DEFAULT_PERMISSIONS_MATRIX
  cacheExpiresAt = now + 60000
  return cachedPermissions
}

/**
 * Invalidate cached permissions matrix
 */
export function invalidatePermissionsCache() {
  cachedPermissions = null
  cacheExpiresAt = 0
}

/**
 * Express Middleware: Authenticate incoming requests via Bearer JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No authentication token provided in Authorization header.',
    })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Your session has expired. Please sign in again.',
      })
    }
    return res.status(401).json({
      error: 'InvalidToken',
      message: 'Invalid authentication token provided.',
    })
  }
}

/**
 * Express Middleware: Optional authentication (attaches user if present, doesn't reject if missing)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (token) {
    try {
      req.user = verifyToken(token)
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next()
}

/**
 * Express Middleware: Restrict access by Role names (e.g. 'admin', 'manager')
 */
export function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase().replace(/\s+/g, '_'))

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' })
    }

    const userRole = (req.user.role || '').toLowerCase().replace(/\s+/g, '_')

    // Root admin always has full bypass
    if (userRole === 'admin') {
      return next()
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}. Your role: ${req.user.roleTitle || req.user.role}.`,
      })
    }

    next()
  }
}

/**
 * Express Middleware: Dynamic RBAC permission validation
 * Checks if the user's role has permission to perform action ('read', 'create', 'update', 'delete', 'export') on moduleName
 */
export function requirePermission(moduleName, action = 'read') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' })
    }

    const userRole = (req.user.role || '').toLowerCase().replace(/\s+/g, '_')

    // Root admin permanently retains 100% root access across all modules
    if (userRole === 'admin') {
      return next()
    }

    try {
      const matrix = await getPermissionsMatrix()
      const modulePermissions = matrix[moduleName] || {}
      const roleActions = modulePermissions[userRole] || []

      if (!roleActions.includes(action)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Role '${req.user.roleTitle || req.user.role}' lacks '${action}' permission on module '${moduleName}'.`,
        })
      }

      next()
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error', message: err.message })
    }
  }
}
