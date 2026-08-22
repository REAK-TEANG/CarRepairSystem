import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM appointments ORDER BY scheduled_date ASC, scheduled_time ASC')
    const appointments = rows.map((r) => ({
      id: r.id,
      code: r.appointment_code,
      customer: r.customer,
      customerId: r.customer_id,
      vehicle: r.vehicle,
      vehicleId: r.vehicle_id,
      plate: r.plate,
      mechanic: r.mechanic,
      mechanicId: r.mechanic_id,
      service: r.service,
      date: r.scheduled_date,
      time: r.scheduled_time,
      status: r.status,
      notes: r.notes
    }))
    res.json({ data: appointments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create appointment
router.post('/', async (req, res) => {
  try {
    const { customer, customerId, vehicle, vehicleId, plate, mechanic, mechanicId, service, date, time, status, notes } = req.body
    const count = await query.get('SELECT COUNT(*) as cnt FROM appointments')
    const code = `APT-2026-${String((count?.cnt || 0) + 1).padStart(3, '0')}`

    const result = await query.run(
      'INSERT INTO appointments (appointment_code, customer_id, customer, vehicle_id, vehicle, plate, mechanic_id, mechanic, service, scheduled_date, scheduled_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, customerId || 1, customer, vehicleId || 1, vehicle, plate, mechanicId || 1, mechanic, service, date, time || '09:00', status || 'Scheduled', notes || '']
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        code,
        customer,
        customerId,
        vehicle,
        vehicleId,
        plate,
        mechanic,
        mechanicId,
        service,
        date,
        time,
        status: status || 'Scheduled',
        notes
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update appointment
router.put('/:id', async (req, res) => {
  try {
    const { status, mechanic, mechanicId, date, time, notes, service } = req.body
    await query.run(
      'UPDATE appointments SET status = COALESCE(?, status), mechanic = COALESCE(?, mechanic), mechanic_id = COALESCE(?, mechanic_id), scheduled_date = COALESCE(?, scheduled_date), scheduled_time = COALESCE(?, scheduled_time), service = COALESCE(?, service), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, mechanic, mechanicId, date, time, service, notes, req.params.id]
    )
    const updated = await query.get('SELECT * FROM appointments WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        code: updated.appointment_code,
        customer: updated.customer,
        customerId: updated.customer_id,
        vehicle: updated.vehicle,
        vehicleId: updated.vehicle_id,
        plate: updated.plate,
        mechanic: updated.mechanic,
        mechanicId: updated.mechanic_id,
        service: updated.service,
        date: updated.scheduled_date,
        time: updated.scheduled_time,
        status: updated.status,
        notes: updated.notes
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE cancel appointment
router.delete('/:id', async (req, res) => {
  try {
    await query.run('UPDATE appointments SET status = "Cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Appointment cancelled' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
