import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all customers (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    let sql = 'SELECT * FROM customers ORDER BY id DESC'
    let params = []
    if (search) {
      sql = 'SELECT * FROM customers WHERE full_name LIKE ? OR phone LIKE ? OR customer_code LIKE ? ORDER BY id DESC'
      params = [`%${search}%`, `%${search}%`, `%${search}%`]
    }
    const rows = await query.all(sql, params)

    // Map DB fields to frontend format
    const customers = await Promise.all(rows.map(async (r) => {
      const vehCount = await query.get('SELECT COUNT(*) as count FROM vehicles WHERE customer_id = ? OR owner = ?', [r.id, r.full_name])
      return {
        id: r.id,
        code: r.customer_code,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        avatar: r.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        vehiclesCount: vehCount ? vehCount.count : 0,
        totalSpent: r.total_spent || '$0.00',
        registrationDate: r.registration_date,
        notes: r.notes
      }
    }))
    res.json({ data: customers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const r = await query.get('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!r) return res.status(404).json({ error: 'Customer not found' })
    res.json({
      data: {
        id: r.id,
        code: r.customer_code,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        avatar: r.avatar_url,
        totalSpent: r.total_spent,
        registrationDate: r.registration_date
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    const count = await query.get('SELECT COUNT(*) as cnt FROM customers')
    const code = `CUST-${String((count?.cnt || 0) + 1).padStart(3, '0')}`
    const avatar = `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`

    const result = await query.run(
      'INSERT INTO customers (customer_code, full_name, phone, email, address, avatar_url, total_spent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, phone, email, address, avatar, '$0.00']
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        code,
        name,
        phone,
        email,
        address,
        avatar,
        vehiclesCount: 0,
        totalSpent: '$0.00',
        registrationDate: new Date().toISOString().split('T')[0]
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    await query.run(
      'UPDATE customers SET full_name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, email, address, req.params.id]
    )
    const updated = await query.get('SELECT * FROM customers WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        code: updated.customer_code,
        name: updated.full_name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        avatar: updated.avatar_url,
        totalSpent: updated.total_spent
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM customers WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Customer deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
