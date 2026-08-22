import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all repair jobs (with optional mechanicId filter)
router.get('/', async (req, res) => {
  try {
    const { mechanicId } = req.query
    let query = supabase.from('repair_orders').select('*').order('id', { ascending: false })

    if (mechanicId) {
      query = supabase.from('repair_orders').select('*').eq('mechanic_id', mechanicId).order('id', { ascending: false })
    }

    const { data: rows, error } = await query
    if (error) throw error

    const jobs = (rows || []).map((r) => ({
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
      createdAt: r.created_at ? r.created_at.split('T')[0] : 'Today'
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
    const { count } = await supabase.from('repair_orders').select('*', { count: 'exact', head: true })
    const orderNumber = `RO-2026-${String((count || 0) + 41).padStart(4, '0')}`

    const { data: inserted, error } = await supabase
      .from('repair_orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId || 1,
        customer,
        vehicle_id: vehicleId || 1,
        vehicle,
        plate,
        mechanic_id: mechanicId || 1,
        mechanic,
        problem_description: problem,
        diagnosis: diagnosis || '',
        estimated_cost: estimatedCost || '$350',
        status: status || 'Pending'
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
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
    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (actualCost !== undefined) updateData.actual_cost = actualCost
    if (mechanic !== undefined) updateData.mechanic = mechanic
    if (estimatedCost !== undefined) updateData.estimated_cost = estimatedCost

    const { data: updated, error } = await supabase
      .from('repair_orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

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
        createdAt: updated.created_at ? updated.created_at.split('T')[0] : 'Today'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
