import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all repair jobs
router.get('/', async (req, res) => {
  try {
    const { mechanicId } = req.query
    let sql = `
      SELECT ro.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
    `
    let params = []

    if (mechanicId) {
      sql += ` WHERE ro.mechanic_id = $1 `
      params.push(mechanicId)
    }

    sql += ` ORDER BY ro.id DESC`

    const rows = await query.all(sql, params)

    const jobs = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: r.customer_name || 'Customer',
      customerId: r.customer_id,
      vehicle: r.brand ? `${r.brand} ${r.model || ''}`.trim() : 'Vehicle',
      vehicleId: r.vehicle_id,
      plate: r.vehicle_number || '',
      mechanic: r.mechanic_name || 'Mechanic',
      mechanicId: r.mechanic_id,
      problem: r.problem_description || '',
      diagnosis: r.diagnosis || '',
      estimatedCost: r.estimated_cost ? `$${r.estimated_cost}` : '$350.00',
      actualCost: r.actual_cost ? `$${r.actual_cost}` : '',
      status: r.status || 'Pending',
      createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'Today'
    }))

    res.json({ data: jobs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create repair job
router.post('/', async (req, res) => {
  try {
    const { customerId, vehicleId, mechanicId, problem, diagnosis, estimatedCost, status } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM repair_orders')
    const orderNumber = `RO-2026-${String((parseInt(countRow?.cnt, 10) || 0) + 41).padStart(4, '0')}`

    const costNum = parseFloat(String(estimatedCost || '350').replace(/[^0-9.]/g, '')) || 350.00

    const inserted = await query.get(
      `INSERT INTO repair_orders (order_number, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis, estimated_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        orderNumber,
        customerId || 1,
        vehicleId || 1,
        mechanicId || null,
        problem || null,
        diagnosis || null,
        costNum,
        status || 'Pending'
      ]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [inserted.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [inserted.vehicle_id])

    res.status(201).json({
      data: {
        id: inserted.id,
        orderNumber,
        customer: customer?.full_name || '',
        customerId: inserted.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: inserted.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: inserted.mechanic_id,
        problem: inserted.problem_description,
        diagnosis: inserted.diagnosis,
        estimatedCost: `$${inserted.estimated_cost}`,
        status: inserted.status,
        createdAt: new Date().toISOString().split('T')[0]
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update repair job
router.put('/:id', async (req, res) => {
  try {
    const { status, diagnosis, actualCost, estimatedCost, mechanicId, notes } = req.body
    const actualNum = actualCost ? parseFloat(String(actualCost).replace(/[^0-9.]/g, '')) : null
    const estNum = estimatedCost ? parseFloat(String(estimatedCost).replace(/[^0-9.]/g, '')) : null

    const updated = await query.get(
      `UPDATE repair_orders
       SET status = COALESCE($1, status),
           diagnosis = COALESCE($2, diagnosis),
           actual_cost = COALESCE($3, actual_cost),
           estimated_cost = COALESCE($4, estimated_cost),
           mechanic_id = COALESCE($5, mechanic_id),
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [status, diagnosis, actualNum, estNum, mechanicId, notes, req.params.id]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [updated.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [updated.vehicle_id])

    res.json({
      data: {
        id: updated.id,
        orderNumber: updated.order_number,
        customer: customer?.full_name || '',
        customerId: updated.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: updated.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: updated.mechanic_id,
        problem: updated.problem_description,
        diagnosis: updated.diagnosis,
        estimatedCost: updated.estimated_cost ? `$${updated.estimated_cost}` : '',
        actualCost: updated.actual_cost ? `$${updated.actual_cost}` : '',
        status: updated.status,
        createdAt: updated.created_at ? new Date(updated.created_at).toISOString().split('T')[0] : 'Today'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const updated = await query.get(
      `UPDATE repair_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    )
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE repair job
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM repair_orders WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Repair order deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
