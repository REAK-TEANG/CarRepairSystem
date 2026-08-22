import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM vehicles ORDER BY id DESC')
    const vehicles = rows.map((r) => ({
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
    const result = await query.run(
      'INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerId || 1, number, vin, brand, model, year, color, fuelType || 'Gasoline', mileage || 0, owner]
    )

    res.status(201).json({
      data: {
        id: result.lastID,
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
    await query.run(
      'UPDATE vehicles SET vehicle_number = ?, vin = ?, brand = ?, model = ?, year = ?, color = ?, fuel_type = ?, mileage = ?, owner = ?, customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [number, vin, brand, model, year, color, fuelType, mileage, owner, ownerId || 1, req.params.id]
    )
    const updated = await query.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id])
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
    await query.run('DELETE FROM vehicles WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Vehicle removed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
