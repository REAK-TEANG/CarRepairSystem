import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all spare parts
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM spare_parts ORDER BY id DESC')
    const items = rows.map((r) => ({
      id: r.id,
      partCode: r.part_code,
      name: r.name,
      category: r.category,
      brand: r.brand,
      unitPrice: r.unit_price,
      stockQty: r.stock_quantity,
      minThreshold: r.min_stock,
      supplier: r.supplier,
      supplierId: r.supplier_id,
      location: r.location,
      status: r.stock_quantity === 0 ? 'Out of Stock' : r.stock_quantity <= r.min_stock ? 'Low Stock' : 'In Stock'
    }))
    res.json({ data: items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create spare part
router.post('/', async (req, res) => {
  try {
    const { name, category, brand, unitPrice, stockQty, minThreshold, supplier, supplierId, location, partCode } = req.body
    const count = await query.get('SELECT COUNT(*) as cnt FROM spare_parts')
    const finalCode = partCode || `PT-${String((count?.cnt || 0) + 100).padStart(4, '0')}`
    const qty = parseInt(stockQty, 10) || 0
    const min = parseInt(minThreshold, 10) || 5
    const status = qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

    const result = await query.run(
      'INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, supplier, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, name, category, brand, unitPrice || 0, qty, min, supplierId || 1, supplier, location || 'Shelf A-01', status]
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        partCode: finalCode,
        name,
        category,
        brand,
        unitPrice,
        stockQty: qty,
        minThreshold: min,
        supplier,
        supplierId,
        location,
        status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update spare part
router.put('/:id', async (req, res) => {
  try {
    const { name, category, brand, unitPrice, stockQty, minThreshold, supplier, supplierId, location } = req.body
    const qty = parseInt(stockQty, 10) || 0
    const min = parseInt(minThreshold, 10) || 5
    const status = qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

    await query.run(
      'UPDATE spare_parts SET name = ?, category = ?, brand = ?, unit_price = ?, stock_quantity = ?, min_stock = ?, supplier = ?, supplier_id = ?, location = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, brand, unitPrice, qty, min, supplier, supplierId || 1, location, status, req.params.id]
    )
    const updated = await query.get('SELECT * FROM spare_parts WHERE id = ?', [req.params.id])
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
        supplier: updated.supplier,
        supplierId: updated.supplier_id,
        location: updated.location,
        status: updated.status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST stock in / out adjustment
router.post('/:id/adjust', async (req, res) => {
  try {
    const { quantity, type, notes } = req.body
    const part = await query.get('SELECT * FROM spare_parts WHERE id = ?', [req.params.id])
    if (!part) return res.status(404).json({ error: 'Part not found' })

    const qtyChange = parseInt(quantity, 10) || 0
    const newQty = type === 'Stock In'
      ? part.stock_quantity + qtyChange
      : Math.max(0, part.stock_quantity - qtyChange)
    const newStatus = newQty === 0 ? 'Out of Stock' : newQty <= part.min_stock ? 'Low Stock' : 'In Stock'

    await query.run('UPDATE spare_parts SET stock_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQty, newStatus, req.params.id])
    await query.run('INSERT INTO inventory_transactions (spare_part_id, type, quantity, notes) VALUES (?, ?, ?, ?)', [req.params.id, type, qtyChange, notes || ''])

    res.json({
      data: {
        id: part.id,
        partCode: part.part_code,
        name: part.name,
        category: part.category,
        brand: part.brand,
        unitPrice: part.unit_price,
        stockQty: newQty,
        minThreshold: part.min_stock,
        supplier: part.supplier,
        location: part.location,
        status: newStatus
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE spare part
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM spare_parts WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Spare part removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
