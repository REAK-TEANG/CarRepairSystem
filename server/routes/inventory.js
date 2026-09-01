import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All inventory routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all spare parts
router.get('/', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT sp.*, s.name AS supplier_name
      FROM spare_parts sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      ORDER BY sp.id DESC
    `)

    const items = rows.map((r) => ({
      id: r.id,
      partCode: r.part_code,
      name: r.name,
      category: r.category || 'General',
      brand: r.brand || '',
      unitPrice: parseFloat(r.unit_price) || 0,
      stockQty: r.stock_quantity || 0,
      minThreshold: r.min_stock || 5,
      supplier: r.supplier_name || 'Supplier',
      supplierId: r.supplier_id,
      location: r.location || 'Shelf A-01',
      image: r.photo_url || r.image || '',
      status: (r.stock_quantity || 0) === 0 ? 'Out of Stock' : (r.stock_quantity || 0) <= (r.min_stock || 5) ? 'Low Stock' : 'In Stock',
    }))

    res.json({ data: items })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory', message: err.message })
  }
})

// GET inventory transaction history (including auto stock-outs)
router.get('/transactions', requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT it.*, 
             sp.part_code, sp.name AS part_name,
             u.full_name AS performed_by_name
      FROM inventory_transactions it
      JOIN spare_parts sp ON it.spare_part_id = sp.id
      LEFT JOIN users u ON it.performed_by = u.id
      ORDER BY it.id DESC
      LIMIT 100
    `)

    const txs = rows.map((r) => ({
      id: r.id,
      sparePartId: r.spare_part_id,
      partCode: r.part_code,
      partName: r.part_name,
      type: r.type,
      quantity: r.quantity,
      referenceId: r.reference_id,
      referenceType: r.reference_type,
      notes: r.notes || '',
      performedBy: r.performed_by_name || 'System',
      createdAt: r.created_at,
    }))

    res.json({ data: txs })
  } catch (err) {
    console.error('[API Inventory Transactions Error]:', err)
    res.status(500).json({ error: 'Failed to fetch transactions', message: err.message })
  }
})

// POST create spare part
router.post('/', requirePermission('inventory', 'create'), async (req, res) => {
  try {
    const { name, category, brand, unitPrice, stockQty, minThreshold, supplierId, location, partCode, image, photoUrl } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Part name is required' })
    }

    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM spare_parts')
    const finalCode = partCode || `PT-${String((parseInt(countRow?.cnt, 10) || 0) + 100).padStart(4, '0')}`
    const qty = parseInt(stockQty, 10) || 0
    const min = parseInt(minThreshold, 10) || 5
    const finalPhoto = image || photoUrl || null

    let inserted = null
    try {
      inserted = await query.get(
        `INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [finalCode, name.trim(), category || null, brand || null, parseFloat(unitPrice) || 0, qty, min, supplierId || null, location || 'Shelf A-01', finalPhoto]
      )
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('photo_url')) {
        await query.run('ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;')
        inserted = await query.get(
          `INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [finalCode, name.trim(), category || null, brand || null, parseFloat(unitPrice) || 0, qty, min, supplierId || null, location || 'Shelf A-01', finalPhoto]
        )
      } else {
        throw dbErr
      }
    }

    const sup = inserted.supplier_id ? await query.get('SELECT name FROM suppliers WHERE id = $1', [inserted.supplier_id]) : null

    res.status(201).json({
      data: {
        id: inserted.id,
        partCode: finalCode,
        name: inserted.name,
        category: inserted.category || 'General',
        brand: inserted.brand || '',
        unitPrice: inserted.unit_price,
        stockQty: inserted.stock_quantity,
        minThreshold: inserted.min_stock,
        supplier: sup?.name || '',
        supplierId: inserted.supplier_id,
        location: inserted.location,
        image: inserted.photo_url || '',
        status: qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock',
      },
    })
  } catch (err) {
    console.error('[API Inventory Create Error]:', err)
    res.status(500).json({ error: 'Failed to create spare part', message: err.message })
  }
})

// PUT update spare part
router.put('/:id', requirePermission('inventory', 'update'), async (req, res) => {
  try {
    const { name, category, brand, unitPrice, stockQty, minThreshold, supplierId, location, image, photoUrl } = req.body
    const qty = parseInt(stockQty, 10) || 0
    const min = parseInt(minThreshold, 10) || 5
    const finalPhoto = image !== undefined ? image : photoUrl !== undefined ? photoUrl : null

    let updated = null
    try {
      updated = await query.get(
        `UPDATE spare_parts
         SET name = COALESCE($1, name),
             category = COALESCE($2, category),
             brand = COALESCE($3, brand),
             unit_price = COALESCE($4, unit_price),
             stock_quantity = COALESCE($5, stock_quantity),
             min_stock = COALESCE($6, min_stock),
             supplier_id = COALESCE($7, supplier_id),
             location = COALESCE($8, location),
             photo_url = COALESCE($9, photo_url),
             updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [name, category, brand, parseFloat(unitPrice) || null, qty, min, supplierId, location, finalPhoto, req.params.id]
      )
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('photo_url')) {
        await query.run('ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;')
        updated = await query.get(
          `UPDATE spare_parts
           SET name = COALESCE($1, name),
               category = COALESCE($2, category),
               brand = COALESCE($3, brand),
               unit_price = COALESCE($4, unit_price),
               stock_quantity = COALESCE($5, stock_quantity),
               min_stock = COALESCE($6, min_stock),
               supplier_id = COALESCE($7, supplier_id),
               location = COALESCE($8, location),
               photo_url = COALESCE($9, photo_url),
               updated_at = NOW()
           WHERE id = $10
           RETURNING *`,
          [name, category, brand, parseFloat(unitPrice) || null, qty, min, supplierId, location, finalPhoto, req.params.id]
        )
      } else {
        throw dbErr
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Spare part not found' })
    }

    const sup = updated.supplier_id ? await query.get('SELECT name FROM suppliers WHERE id = $1', [updated.supplier_id]) : null

    res.json({
      data: {
        id: updated.id,
        partCode: updated.part_code,
        name: updated.name,
        category: updated.category,
        brand: updated.brand,
        unitPrice: updated.unit_price,
        stockQty: updated.stock_quantity,
        minThreshold: updated.min_stock,
        supplier: sup?.name || '',
        supplierId: updated.supplier_id,
        location: updated.location,
        image: updated.photo_url || '',
        status: qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock',
      },
    })
  } catch (err) {
    console.error('[API Inventory Update Error]:', err)
    res.status(500).json({ error: 'Failed to update spare part', message: err.message })
  }
})

// POST stock in / out adjustment
router.post('/:id/adjust', requirePermission('inventory', 'update'), async (req, res) => {
  try {
    const { quantity, type, notes } = req.body
    const part = await query.get('SELECT * FROM spare_parts WHERE id = $1', [req.params.id])
    if (!part) return res.status(404).json({ error: 'Part not found' })

    const qtyChange = parseInt(quantity, 10) || 0
    const newQty = type === 'Stock In'
      ? (part.stock_quantity || 0) + qtyChange
      : Math.max(0, (part.stock_quantity || 0) - qtyChange)

    const updated = await query.get(
      `UPDATE spare_parts SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newQty, req.params.id]
    )

    await query.run(
      `INSERT INTO inventory_transactions (spare_part_id, type, quantity, notes, performed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [part.id, type === 'Stock In' ? 'Stock In' : 'Stock Out', qtyChange, notes || '', req.user?.id || null]
    )

    const sup = updated.supplier_id ? await query.get('SELECT name FROM suppliers WHERE id = $1', [updated.supplier_id]) : null

    res.json({
      data: {
        id: updated.id,
        partCode: updated.part_code,
        name: updated.name,
        category: updated.category,
        brand: updated.brand,
        unitPrice: updated.unit_price,
        stockQty: newQty,
        minThreshold: updated.min_stock,
        supplier: sup?.name || '',
        location: updated.location,
        status: newQty === 0 ? 'Out of Stock' : newQty <= updated.min_stock ? 'Low Stock' : 'In Stock',
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust inventory', message: err.message })
  }
})

// DELETE spare part
router.delete('/:id', requirePermission('inventory', 'delete'), async (req, res) => {
  try {
    const exists = await query.get('SELECT id FROM spare_parts WHERE id = $1', [req.params.id])
    if (!exists) {
      return res.status(404).json({ error: 'Spare part not found' })
    }

    await query.run('DELETE FROM spare_parts WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Spare part removed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete spare part', message: err.message })
  }
})

export default router
