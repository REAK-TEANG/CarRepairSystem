import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all spare parts
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('spare_parts')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const items = (rows || []).map((r) => ({
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
    const { count } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true })
    const finalCode = partCode || `PT-${String((count || 0) + 100).padStart(4, '0')}`
    const qty = parseInt(stockQty, 10) || 0
    const min = parseInt(minThreshold, 10) || 5
    const status = qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

    const { data: inserted, error } = await supabase
      .from('spare_parts')
      .insert({
        part_code: finalCode,
        name,
        category,
        brand,
        unit_price: unitPrice || 0,
        stock_quantity: qty,
        min_stock: min,
        supplier_id: supplierId || null,
        supplier,
        location: location || 'Shelf A-01',
        status
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
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

    const { data: updated, error } = await supabase
      .from('spare_parts')
      .update({
        name,
        category,
        brand,
        unit_price: unitPrice,
        stock_quantity: qty,
        min_stock: min,
        supplier,
        supplier_id: supplierId || null,
        location,
        status
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

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

    const { data: part, error: fetchErr } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !part) return res.status(404).json({ error: 'Part not found' })

    const qtyChange = parseInt(quantity, 10) || 0
    const newQty = type === 'Stock In'
      ? part.stock_quantity + qtyChange
      : Math.max(0, part.stock_quantity - qtyChange)
    const newStatus = newQty === 0 ? 'Out of Stock' : newQty <= part.min_stock ? 'Low Stock' : 'In Stock'

    const { error: updateErr } = await supabase
      .from('spare_parts')
      .update({ stock_quantity: newQty, status: newStatus })
      .eq('id', req.params.id)

    if (updateErr) throw updateErr

    // Log the inventory transaction
    await supabase.from('inventory_transactions').insert({
      spare_part_id: parseInt(req.params.id),
      type,
      quantity: qtyChange,
      notes: notes || ''
    })

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
    const { error } = await supabase.from('spare_parts').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Spare part removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
