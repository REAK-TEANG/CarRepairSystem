import { Router } from 'express'

const router = Router()

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (username === 'admin' && password === 'admin123') {
    res.json({
      token: 'bearer-demo-token-12345',
      user: {
        id: 1,
        name: 'System Administrator',
        role: 'admin',
        roleTitle: 'Workshop Administrator',
        email: 'admin@carrepair.com'
      }
    })
  } else {
    res.status(401).json({ error: 'Invalid username or password' })
  }
})

// GET me
router.get('/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      name: 'System Administrator',
      role: 'admin',
      roleTitle: 'Workshop Administrator',
      email: 'admin@carrepair.com'
    }
  })
})

export default router
