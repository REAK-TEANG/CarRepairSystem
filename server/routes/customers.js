import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All customer routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all customers (with optional search)
router.get('/', requirePermission('customers', 'read'), async (req, res) => {
  try {
    const { search } = req.query
    let sql = `
      SELECT c.*, 
             COUNT(DISTINCT v.id) AS vehicles_count,
             COALESCE(SUM(i.amount_paid), 0) AS total_spent
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
      LEFT JOIN invoices i ON i.customer_id = c.id
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
      totalSpent: `$${parseFloat(r.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      registrationDate: r.registration_date ? new Date(r.registration_date).toISOString().split('T')[0] : '',
      notes: r.notes || '',
    }))

    res.json({ data: customers })
  } catch (err) {
    console.error('[API Customers Error]:', err)
    res.status(500).json({ error: 'Failed to fetch customers', message: err.message })
  }
})

// GET single customer
router.get('/:id', requirePermission('customers', 'read'), async (req, res) => {
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
        registrationDate: r.registration_date,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer', message: err.message })
  }
})

// POST create customer
router.post('/', requirePermission('customers', 'create'), async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Customer name is required' })
    }

    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM customers')
    const code = `CUST-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`

    const inserted = await query.get(
      `INSERT INTO customers (customer_code, full_name, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, name.trim(), phone || null, email || null, address || null, notes || null]
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
        registrationDate: inserted.registration_date ? new Date(inserted.registration_date).toISOString().split('T')[0] : '',
      },
    })
  } catch (err) {
    console.error('[API Customer Create Error]:', err)
    res.status(500).json({ error: 'Failed to create customer', message: err.message })
  }
})

// PUT update customer
router.put('/:id', requirePermission('customers', 'update'), async (req, res) => {
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

    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json({
      data: {
        id: updated.id,
        code: updated.customer_code,
        name: updated.full_name,
        phone: updated.phone || '',
        email: updated.email || '',
        address: updated.address || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        totalSpent: '$0.00',
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer', message: err.message })
  }
})

// DELETE customer
router.delete('/:id', requirePermission('customers', 'delete'), async (req, res) => {
  try {
    const exists = await query.get('SELECT id FROM customers WHERE id = $1', [req.params.id])
    if (!exists) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    await query.run('DELETE FROM customers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Customer deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', message: err.message })
  }
})

export default router
