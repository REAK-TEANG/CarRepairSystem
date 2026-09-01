import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All service reminder routes require authenticated Bearer JWT
router.use(authenticateToken)

// GET all service reminders
router.get('/', requirePermission('appointments', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT sr.*, 
             c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
             v.brand, v.model, v.vehicle_number, v.mileage as current_mileage
      FROM service_reminders sr
      JOIN customers c ON sr.customer_id = c.id
      JOIN vehicles v ON sr.vehicle_id = v.id
      ORDER BY sr.due_date ASC NULLS LAST, sr.id DESC
    `)

    const reminders = rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      customer: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      vehicleId: r.vehicle_id,
      vehicle: `${r.brand || ''} ${r.model || ''}`.trim(),
      plate: r.vehicle_number,
      currentMileage: r.current_mileage || 0,
      serviceType: r.service_type,
      dueDate: r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : null,
      dueOdometer: r.due_odometer || null,
      status: r.status || 'Pending',
      notes: r.notes || '',
      createdAt: r.created_at,
    }))

    res.json({ data: reminders })
  } catch (err) {
    console.error('[API Service Reminders Error]:', err)
    res.status(500).json({ error: 'Failed to fetch service reminders', message: err.message })
  }
})

// POST create service reminder
router.post('/', requirePermission('appointments', 'create'), async (req, res) => {
  try {
    const { customerId, vehicleId, repairOrderId, serviceType, dueDate, dueOdometer, notes } = req.body

    if (!customerId || !vehicleId || !serviceType) {
      return res.status(400).json({ error: 'Customer, vehicle, and service type are required' })
    }

    const inserted = await query.get(
      `INSERT INTO service_reminders (customer_id, vehicle_id, repair_order_id, service_type, due_date, due_odometer, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING *`,
      [customerId, vehicleId, repairOrderId || null, serviceType, dueDate || null, dueOdometer ? parseInt(dueOdometer, 10) : null, notes || null]
    )

    res.status(201).json({ data: inserted, message: 'Service reminder scheduled successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service reminder', message: err.message })
  }
})

// PUT update reminder status (e.g. mark as 'Notified' or 'Booked')
router.put('/:id', requirePermission('appointments', 'update'), async (req, res) => {
  try {
    const { status, notes, dueDate } = req.body
    const updated = await query.get(
      `UPDATE service_reminders
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           due_date = COALESCE($3, due_date)
       WHERE id = $4
       RETURNING *`,
      [status, notes, dueDate, req.params.id]
    )

    if (!updated) {
      return res.status(404).json({ error: 'Service reminder not found' })
    }

    res.json({ data: updated, message: 'Service reminder updated' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reminder', message: err.message })
  }
})

// DELETE reminder
router.delete('/:id', requirePermission('appointments', 'delete'), async (req, res) => {
  try {
    await query.run('DELETE FROM service_reminders WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Service reminder deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reminder', message: err.message })
  }
})

export default router
