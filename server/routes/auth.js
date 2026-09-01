import { Router } from 'express'
import { query } from '../db.js'
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateToken,
} from '../middleware/auth.js'

const router = Router()

// Default profiles for the 6 RBAC roles
const DEFAULT_ROLE_ACCOUNTS = {
  admin: {
    username: 'admin',
    name: 'Jane Doe',
    email: 'admin@carrepair.com',
    roleName: 'Admin',
    roleId: 1,
    roleTitle: 'System Administrator',
  },
  manager: {
    username: 'manager',
    name: 'Marcus Vance',
    email: 'manager@workshop.com',
    roleName: 'Manager',
    roleId: 2,
    roleTitle: 'Workshop Manager',
  },
  service_advisor: {
    username: 'advisor',
    name: 'Sarah Jenkins',
    email: 'advisor@workshop.com',
    roleName: 'Service Advisor',
    roleId: 3,
    roleTitle: 'Service Advisor',
  },
  mechanic: {
    username: 'mechanic',
    name: 'Mike Johnson',
    email: 'mike@workshop.com',
    roleName: 'Mechanic',
    roleId: 4,
    roleTitle: 'Master Technician',
  },
  cashier: {
    username: 'cashier',
    name: 'Emily Watson',
    email: 'cashier@workshop.com',
    roleName: 'Cashier',
    roleId: 5,
    roleTitle: 'Chief Cashier',
  },
  storekeeper: {
    username: 'storekeeper',
    name: 'David Miller',
    email: 'store@workshop.com',
    roleName: 'Storekeeper',
    roleId: 6,
    roleTitle: 'Inventory Storekeeper',
  },
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' })
    }

    const cleanUsername = String(username).trim().toLowerCase()

    // Find user by username or email
    const user = await query.get(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(u.username) = $1 OR LOWER(u.email) = $1`,
      [cleanUsername]
    )

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account is deactivated. Please contact an administrator.' })
    }

    // Verify password hash
    let isPasswordValid = false

    if (user.password_hash) {
      if (user.password_hash === password) {
        isPasswordValid = true
        const newHash = await hashPassword(password)
        await query.run('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id])
      } else {
        isPasswordValid = await comparePassword(password, user.password_hash)
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Update last login
    await query.run('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

    const normalizedRole = (user.role_name || 'Admin').toLowerCase().replace(/\s+/g, '_')
    const roleTitle = user.role_name || 'Administrator'

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.full_name,
      role: normalizedRole,
      roleTitle,
    }

    const token = generateToken(tokenPayload)

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: normalizedRole,
        roleTitle,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    })
  } catch (err) {
    console.error('[API Auth Login Error]:', err)
    res.status(500).json({ error: 'Authentication failed', message: err.message })
  }
})

// POST /api/auth/quick-login (Quick 1-click login for testing/demo role switching)
router.post('/quick-login', async (req, res) => {
  try {
    const { role } = req.body
    const cleanRole = (role || 'admin').toLowerCase().replace(/\s+/g, '_')
    const roleDef = DEFAULT_ROLE_ACCOUNTS[cleanRole] || DEFAULT_ROLE_ACCOUNTS.admin

    // Look for existing user or create one
    let user = await query.get(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(u.username) = $1 OR u.role_id = $2
       ORDER BY u.id ASC LIMIT 1`,
      [roleDef.username, roleDef.roleId]
    )

    if (!user) {
      const defaultHash = await hashPassword('password123')
      user = await query.get(
        `INSERT INTO users (username, email, password_hash, full_name, role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [roleDef.username, roleDef.email, defaultHash, roleDef.name, roleDef.roleId]
      )
      user.role_name = roleDef.roleName
    }

    const normalizedRole = (user.role_name || roleDef.roleName).toLowerCase().replace(/\s+/g, '_')
    const roleTitle = user.role_name || roleDef.roleTitle

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.full_name,
      role: normalizedRole,
      roleTitle,
    }

    const token = generateToken(tokenPayload)

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: normalizedRole,
        roleTitle,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    })
  } catch (err) {
    console.error('[API Quick Login Error]:', err)
    res.status(500).json({ error: 'Quick login failed', message: err.message })
  }
})

// GET /api/auth/me (Get profile of authenticated user)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url, u.is_active, u.last_login,
              r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [req.user.id]
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const normalizedRole = (user.role_name || 'Admin').toLowerCase().replace(/\s+/g, '_')

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: normalizedRole,
        roleTitle: user.role_name || 'Administrator',
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastLogin: user.last_login,
      },
    })
  } catch (err) {
    console.error('[API Auth Me Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' })
    }

    const user = await query.get('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isCurrentValid = await comparePassword(currentPassword, user.password_hash)
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const newHash = await hashPassword(newPassword)
    await query.run('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id])

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/forgot-password (Request 6-digit password reset verification code)
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrUsername } = req.body

    if (!emailOrUsername) {
      return res.status(400).json({ error: 'Username or email address is required' })
    }

    const cleanInput = String(emailOrUsername).trim().toLowerCase()

    // Find user by username or email
    const user = await query.get(
      `SELECT id, username, email, full_name, is_active 
       FROM users 
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [cleanInput]
    )

    if (!user) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'No account found matching this username or email address.',
      })
    }

    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'This account has been deactivated. Please contact your system administrator.',
      })
    }

    // Generate secure 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      await query.run(
        `UPDATE users 
         SET reset_token = $1, reset_expires_at = NOW() + INTERVAL '15 minutes' 
         WHERE id = $2`,
        [resetCode, user.id]
      )
    } catch {
      // If reset_token column doesn't exist yet, ensure column and retry
      await query.run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT, ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;`)
      await query.run(
        `UPDATE users 
         SET reset_token = $1, reset_expires_at = NOW() + INTERVAL '15 minutes' 
         WHERE id = $2`,
        [resetCode, user.id]
      )
    }

    console.log(`[AUTH] Password reset code generated for ${user.username} (${user.email}): ${resetCode}`)

    res.json({
      success: true,
      message: 'Verification code generated successfully (valid for 15 minutes).',
      username: user.username,
      email: user.email,
      resetCode, // Included for offline / demo workshop setups without SMTP server
    })
  } catch (err) {
    console.error('[API Forgot Password Error]:', err)
    res.status(500).json({ error: 'Failed to process password reset request', message: err.message })
  }
})

// POST /api/auth/reset-password (Verify 6-digit code and set new password)
router.post('/reset-password', async (req, res) => {
  try {
    const { emailOrUsername, resetCode, newPassword } = req.body

    if (!emailOrUsername || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Account identifier, verification code, and new password are required' })
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' })
    }

    const cleanInput = String(emailOrUsername).trim().toLowerCase()
    const cleanCode = String(resetCode).trim()

    const user = await query.get(
      `SELECT id, username, email, reset_token, reset_expires_at 
       FROM users 
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [cleanInput]
    )

    if (!user) {
      return res.status(404).json({ error: 'User account not found' })
    }

    // Check code match
    if (!user.reset_token || user.reset_token !== cleanCode) {
      return res.status(400).json({
        error: 'Invalid verification code',
        message: 'The 6-digit verification code you entered is invalid.',
      })
    }

    // Check expiration (if reset_expires_at exists)
    if (user.reset_expires_at && new Date(user.reset_expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Verification code expired',
        message: 'The verification code has expired. Please request a new code.',
      })
    }

    // Hash the new password with bcrypt
    const newHash = await hashPassword(String(newPassword))

    // Update user password and clear reset token
    await query.run(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_expires_at = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [newHash, user.id]
    )

    console.log(`[AUTH] Password successfully reset for user ${user.username}`)

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new password.',
      username: user.username,
    })
  } catch (err) {
    console.error('[API Reset Password Error]:', err)
    res.status(500).json({ error: 'Failed to reset password', message: err.message })
  }
})

export default router
