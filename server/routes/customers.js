import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all customers (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    let sql = `
      SELECT c.*, 
             COUNT(v.id) AS vehicles_count
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
    `
    let params = []

    if (search) {
      sql += ` WHERE c.full_name ILIKE $1 OR c.phone ILIKE $1 OR c.customer_code ILIKE $1 `
      params.push(`%${search}%`)
    }

    sql += ` GROUP BY c.id ORDER BY c.id DESC`

    const rows = await query.all(sql, params)

    const customers = rows.map((r) => ({
      id: r.id,
      code: r.customer_code,
      name: r.full_name,
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      vehiclesCount: parseInt(r.vehicles_count, 10) || 0,
      totalSpent: '$0.00',
      registrationDate: r.registration_date ? new Date(r.registration_date).toISOString().split('T')[0] : '',
      notes: r.notes || ''
    }))

    res.json({ data: customers })
  } catch (err) {
    console.error('[API Customers Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const r = await query.get('SELECT * FROM customers WHERE id = $1', [req.params.id])
    if (!r) return res.status(404).json({ error: 'Customer not found' })

    res.json({
      data: {
        id: r.id,
        code: r.customer_code,
        name: r.full_name,
        phone: r.phone || '',
        email: r.email || '',
        address: r.address || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        totalSpent: '$0.00',
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
    const { name, phone, email, address, notes } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM customers')
    const code = `CUST-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`

    const inserted = await query.get(
      `INSERT INTO customers (customer_code, full_name, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, name, phone || null, email || null, address || null, notes || null]
    )

    res.status(201).json({
      data: {
        id: inserted.id,
        code: inserted.customer_code,
        name: inserted.full_name,
        phone: inserted.phone || '',
        email: inserted.email || '',
        address: inserted.address || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        vehiclesCount: 0,
        totalSpent: '$0.00',
        registrationDate: inserted.registration_date ? new Date(inserted.registration_date).toISOString().split('T')[0] : ''
      }
    })
  } catch (err) {
    console.error('[API Customer Create Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body
    const updated = await query.get(
      `UPDATE customers
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, phone, email, address, notes, req.params.id]
    )

    res.json({
      data: {
        id: updated.id,
        code: updated.customer_code,
        name: updated.full_name,
        phone: updated.phone || '',
        email: updated.email || '',
        address: updated.address || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        totalSpent: '$0.00'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM customers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Customer deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
