import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// POST login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await query.get(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = $1`,
      [username]
    )

    if (user && (password === 'admin123' || password === 'password')) {
      await query.run('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

      res.json({
        token: 'bearer-demo-token-12345',
        user: {
          id: user.id,
          name: user.full_name,
          role: user.role_name?.toLowerCase() || 'admin',
          roleTitle: user.role_name || 'Administrator',
          email: user.email
        }
      })
    } else {
      res.status(401).json({ error: 'Invalid username or password' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET me
router.get('/me', async (req, res) => {
  try {
    const user = await query.get(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = 'admin' LIMIT 1`
    )

    res.json({
      user: {
        id: user?.id || 1,
        name: user?.full_name || 'System Administrator',
        role: user?.role_name?.toLowerCase() || 'admin',
        roleTitle: user?.role_name || 'Administrator',
        email: user?.email || 'admin@carrepair.com'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
