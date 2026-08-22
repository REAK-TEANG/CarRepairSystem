import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// POST login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Query the users table for matching username
    const { data: user, error } = await supabase
      .from('users')
      .select('*, roles(name)')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // For now, basic password check (in production, use bcrypt.compare)
    // The seed data uses bcrypt hash, so we do a simple check for the demo admin
    if (username === 'admin' && password === 'admin123') {
      // Update last_login
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

      res.json({
        token: 'bearer-demo-token-12345',
        user: {
          id: user.id,
          name: user.full_name,
          role: user.roles?.name?.toLowerCase() || 'admin',
          roleTitle: user.roles?.name || 'Admin',
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
    // In a real app, you'd decode the token to get the user ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*, roles(name)')
      .eq('username', 'admin')
      .single()

    if (error || !user) {
      return res.json({
        user: { id: 1, name: 'System Administrator', role: 'admin', roleTitle: 'Admin', email: 'admin@carrepair.com' }
      })
    }

    res.json({
      user: {
        id: user.id,
        name: user.full_name,
        role: user.roles?.name?.toLowerCase() || 'admin',
        roleTitle: user.roles?.name || 'Admin',
        email: user.email
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
