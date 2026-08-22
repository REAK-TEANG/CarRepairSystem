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
      contactPerson: r.contact_name || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      categories: 'OEM Parts, Fluids',
      rating: 4.9,
      activeOrders: 0
    }))
    res.json({ data: suppliers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body

    const inserted = await query.get(
      `INSERT INTO suppliers (name, contact_name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, contactPerson || null, phone || null, email || null, address || null]
    )

    res.status(201).json({
      data: {
        id: inserted.id,
        name: inserted.name,
        contactPerson: inserted.contact_name || '',
        phone: inserted.phone || '',
        email: inserted.email || '',
        address: inserted.address || '',
        categories: 'OEM Parts, Fluids',
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
    const { name, contactPerson, phone, email, address } = req.body

    const updated = await query.get(
      `UPDATE suppliers
       SET name = COALESCE($1, name),
           contact_name = COALESCE($2, contact_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, contactPerson, phone, email, address, req.params.id]
    )

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        contactPerson: updated.contact_name || '',
        phone: updated.phone || '',
        email: updated.email || '',
        address: updated.address || '',
        categories: 'OEM Parts, Fluids',
        rating: 4.9,
        activeOrders: 0
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM suppliers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Supplier removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
