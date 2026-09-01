import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All appointment routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all appointments
router.get('/', requirePermission('appointments', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT a.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN employees e ON a.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY a.scheduled_date ASC
    `)

    const appointments = rows.map((r) => ({
      id: r.id,
      code: r.appointment_code,
      customer: r.customer_name || 'Customer',
      customerId: r.customer_id,
      vehicle: r.brand ? `${r.brand} ${r.model || ''}`.trim() : 'Vehicle',
      vehicleId: r.vehicle_id,
      plate: r.vehicle_number || '',
      mechanic: r.mechanic_name || 'Mechanic',
      mechanicId: r.mechanic_id,
      service: 'General Service',
      date: r.scheduled_date ? new Date(r.scheduled_date).toISOString().split('T')[0] : '',
      time: r.scheduled_time || '09:00',
      status: r.status || 'Scheduled',
      notes: r.notes || '',
    }))

    res.json({ data: appointments })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', message: err.message })
  }
})

// POST create appointment
router.post('/', requirePermission('appointments', 'create'), async (req, res) => {
  try {
    const { customerId, vehicleId, mechanicId, date, time, status, notes } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM appointments')
    const code = `APT-2026-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`

    const inserted = await query.get(
      `INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        code,
        customerId || 1,
        vehicleId || 1,
        mechanicId || null,
        date || new Date().toISOString().split('T')[0],
        time || '09:00',
        status || 'Scheduled',
        notes || null,
      ]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [inserted.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [inserted.vehicle_id])

    res.status(201).json({
      data: {
        id: inserted.id,
        code: inserted.appointment_code,
        customer: customer?.full_name || '',
        customerId: inserted.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: inserted.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: inserted.mechanic_id,
        service: 'General Service',
        date: inserted.scheduled_date,
        time: inserted.scheduled_time,
        status: inserted.status,
        notes: inserted.notes,
      },
    })
  } catch (err) {
    console.error('[API Appointment Create Error]:', err)
    res.status(500).json({ error: 'Failed to create appointment', message: err.message })
  }
})

// PUT update appointment
router.put('/:id', requirePermission('appointments', 'update'), async (req, res) => {
  try {
    const { status, mechanicId, date, time, notes } = req.body

    const updated = await query.get(
      `UPDATE appointments
       SET status = COALESCE($1, status),
           mechanic_id = COALESCE($2, mechanic_id),
           scheduled_date = COALESCE($3, scheduled_date),
           scheduled_time = COALESCE($4, scheduled_time),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [status, mechanicId, date, time, notes, req.params.id]
    )

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [updated.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [updated.vehicle_id])

    res.json({
      data: {
        id: updated.id,
        code: updated.appointment_code,
        customer: customer?.full_name || '',
        customerId: updated.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: updated.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: updated.mechanic_id,
        service: 'General Service',
        date: updated.scheduled_date,
        time: updated.scheduled_time,
        status: updated.status,
        notes: updated.notes,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment', message: err.message })
  }
})

// PATCH update status
router.patch('/:id/status', requirePermission('appointments', 'update'), async (req, res) => {
  try {
    const { status } = req.body
    const updated = await query.get(
      `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    )
    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' })
    }
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', message: err.message })
  }
})

// DELETE cancel appointment
router.delete('/:id', requirePermission('appointments', 'delete'), async (req, res) => {
  try {
    const exists = await query.get('SELECT id FROM appointments WHERE id = $1', [req.params.id])
    if (!exists) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    await query.run(`UPDATE appointments SET status = 'Cancelled', updated_at = NOW() WHERE id = $1`, [req.params.id])
    res.json({ success: true, message: 'Appointment cancelled successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel appointment', message: err.message })
  }
})

export default router
