import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all repair jobs (with optional mechanicId filter)
router.get('/', async (req, res) => {
  try {
    const { mechanicId } = req.query
    let sql = 'SELECT * FROM repair_orders ORDER BY id DESC'
    let params = []
    if (mechanicId) {
      sql = 'SELECT * FROM repair_orders WHERE mechanic_id = ? ORDER BY id DESC'
      params = [mechanicId]
    }
    const rows = await query.all(sql, params)
    const jobs = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: r.customer,
      customerId: r.customer_id,
      vehicle: r.vehicle,
      vehicleId: r.vehicle_id,
      plate: r.plate,
      mechanic: r.mechanic,
      mechanicId: r.mechanic_id,
      problem: r.problem_description,
      diagnosis: r.diagnosis,
      estimatedCost: r.estimated_cost,
      actualCost: r.actual_cost,
      status: r.status,
      createdAt: r.created_at ? r.created_at.split(' ')[0] : 'Today'
    }))
    res.json({ data: jobs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create repair job
router.post('/', async (req, res) => {
  try {
    const { customer, customerId, vehicle, vehicleId, plate, mechanic, mechanicId, problem, diagnosis, estimatedCost, status } = req.body
    const count = await query.get('SELECT COUNT(*) as cnt FROM repair_orders')
    const orderNumber = `RO-2026-${String((count?.cnt || 0) + 41).padStart(4, '0')}`

    const result = await query.run(
      'INSERT INTO repair_orders (order_number, customer_id, customer, vehicle_id, vehicle, plate, mechanic_id, mechanic, problem_description, diagnosis, estimated_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNumber, customerId || 1, customer, vehicleId || 1, vehicle, plate, mechanicId || 1, mechanic, problem, diagnosis || '', estimatedCost || '$350', status || 'Pending']
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        orderNumber,
        customer,
        customerId,
        vehicle,
        vehicleId,
        plate,
        mechanic,
        mechanicId,
        problem,
        diagnosis,
        estimatedCost: estimatedCost || '$350',
        status: status || 'Pending',
        createdAt: new Date().toISOString().split('T')[0]
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update repair job (e.g. status, diagnosis, cost)
router.put('/:id', async (req, res) => {
  try {
    const { status, diagnosis, actualCost, mechanic, estimatedCost } = req.body
    await query.run(
      'UPDATE repair_orders SET status = COALESCE(?, status), diagnosis = COALESCE(?, diagnosis), actual_cost = COALESCE(?, actual_cost), mechanic = COALESCE(?, mechanic), estimated_cost = COALESCE(?, estimated_cost), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, diagnosis, actualCost, mechanic, estimatedCost, req.params.id]
    )
    const updated = await query.get('SELECT * FROM repair_orders WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        orderNumber: updated.order_number,
        customer: updated.customer,
        customerId: updated.customer_id,
        vehicle: updated.vehicle,
        vehicleId: updated.vehicle_id,
        plate: updated.plate,
        mechanic: updated.mechanic,
        mechanicId: updated.mechanic_id,
        problem: updated.problem_description,
        diagnosis: updated.diagnosis,
        estimatedCost: updated.estimated_cost,
        actualCost: updated.actual_cost,
        status: updated.status,
        createdAt: updated.created_at ? updated.created_at.split(' ')[0] : 'Today'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
