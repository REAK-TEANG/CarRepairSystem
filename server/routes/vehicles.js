import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const vehicles = (rows || []).map((r) => ({
      id: r.id,
      number: r.vehicle_number,
      vin: r.vin,
      brand: r.brand,
      model: r.model,
      year: r.year,
      color: r.color,
      fuelType: r.fuel_type,
      mileage: r.mileage,
      owner: r.owner,
      ownerId: r.customer_id,
      notes: r.notes
    }))
    res.json({ data: vehicles })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create vehicle
router.post('/', async (req, res) => {
  try {
    const { number, vin, brand, model, year, color, fuelType, mileage, owner, ownerId } = req.body

    const { data: inserted, error } = await supabase
      .from('vehicles')
      .insert({
        customer_id: ownerId || 1,
        vehicle_number: number,
        vin,
        brand,
        model,
        year,
        color,
        fuel_type: fuelType || 'Gasoline',
        mileage: mileage || 0,
        owner
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
        number,
        vin,
        brand,
        model,
        year,
        color,
        fuelType,
        mileage,
        owner,
        ownerId
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { number, vin, brand, model, year, color, fuelType, mileage, owner, ownerId } = req.body

    const { data: updated, error } = await supabase
      .from('vehicles')
      .update({
        vehicle_number: number,
        vin,
        brand,
        model,
        year,
        color,
        fuel_type: fuelType,
        mileage,
        owner,
        customer_id: ownerId || 1
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json({
      data: {
        id: updated.id,
        number: updated.vehicle_number,
        vin: updated.vin,
        brand: updated.brand,
        model: updated.model,
        year: updated.year,
        color: updated.color,
        fuelType: updated.fuel_type,
        mileage: updated.mileage,
        owner: updated.owner,
        ownerId: updated.customer_id
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Vehicle removed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
