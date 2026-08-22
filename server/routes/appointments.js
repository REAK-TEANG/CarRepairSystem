import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    const appointments = (rows || []).map((r) => ({
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

    // Generate appointment code
    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
    const code = `APT-2026-${String((count || 0) + 1).padStart(3, '0')}`

    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert({
        appointment_code: code,
        customer_id: customerId || 1,
        customer,
        vehicle_id: vehicleId || 1,
        vehicle,
        plate,
        mechanic_id: mechanicId || 1,
        mechanic,
        service,
        scheduled_date: date,
        scheduled_time: time || '09:00',
        status: status || 'Scheduled',
        notes: notes || ''
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
        code: inserted.appointment_code,
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
    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (mechanic !== undefined) updateData.mechanic = mechanic
    if (mechanicId !== undefined) updateData.mechanic_id = mechanicId
    if (date !== undefined) updateData.scheduled_date = date
    if (time !== undefined) updateData.scheduled_time = time
    if (service !== undefined) updateData.service = service
    if (notes !== undefined) updateData.notes = notes

    const { data: updated, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

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
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Appointment cancelled' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
