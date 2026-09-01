import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All supplier routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all suppliers
router.get('/', requirePermission('suppliers', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT s.*, 
             COUNT(sp.id) AS parts_count,
             COALESCE(STRING_AGG(DISTINCT sp.category, ', '), 'OEM Parts, Fluids') AS categories_list
      FROM suppliers s
      LEFT JOIN spare_parts sp ON sp.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.id DESC
    `)
    const suppliers = rows.map((r) => ({
      id: r.id,
      name: r.name,
      contactPerson: r.contact_name || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      categories: r.categories_list || 'OEM Parts, Fluids',
      rating: 4.9,
      activeOrders: parseInt(r.parts_count, 10) || 0,
    }))
    res.json({ data: suppliers })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers', message: err.message })
  }
})

// POST create supplier
router.post('/', requirePermission('suppliers', 'create'), async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Supplier name is required' })
    }

    const inserted = await query.get(
      `INSERT INTO suppliers (name, contact_name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), contactPerson || null, phone || null, email || null, address || null]
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
        activeOrders: 0,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create supplier', message: err.message })
  }
})

// PUT update supplier
router.put('/:id', requirePermission('suppliers', 'update'), async (req, res) => {
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

    if (!updated) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

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
        activeOrders: 0,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update supplier', message: err.message })
  }
})

// DELETE supplier
router.delete('/:id', requirePermission('suppliers', 'delete'), async (req, res) => {
  try {
    const exists = await query.get('SELECT id FROM suppliers WHERE id = $1', [req.params.id])
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    await query.run('DELETE FROM suppliers WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Supplier removed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete supplier', message: err.message })
  }
})

export default router
