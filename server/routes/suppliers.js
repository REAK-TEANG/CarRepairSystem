import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM suppliers ORDER BY id DESC')
    const suppliers = rows.map((r) => ({
      id: r.id,
      name: r.name,
      contactPerson: r.contact_person,
      phone: r.phone,
      email: r.email,
      address: r.address,
      categories: r.categories,
      rating: r.rating || 4.9,
      activeOrders: r.active_orders || 0
    }))
    res.json({ data: suppliers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, categories } = req.body
    const result = await query.run(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, categories, rating, active_orders) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, contactPerson, phone, email, address, categories, 4.9, 0]
    )
    res.status(201).json({
      data: {
        id: result.lastID,
        name,
        contactPerson,
        phone,
        email,
        address,
        categories,
        rating: 4.9,
        activeOrders: 0
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, categories } = req.body
    await query.run(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, categories = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, contactPerson, phone, email, address, categories, req.params.id]
    )
    const updated = await query.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        contactPerson: updated.contact_person,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        categories: updated.categories,
        rating: updated.rating,
        activeOrders: updated.active_orders
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM suppliers WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Supplier removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
