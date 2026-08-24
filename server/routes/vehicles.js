import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT v.*, c.full_name AS customer_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      ORDER BY v.id DESC
    `)

    const vehicles = rows.map((r) => ({
      id: r.id,
      number: r.vehicle_number,
      vin: r.vin || '',
      brand: r.brand || '',
      model: r.model || '',
      year: r.year || 2022,
      color: r.color || '',
      fuelType: r.fuel_type || 'Gasoline',
      mileage: r.mileage || 0,
      image: r.photo_url || r.image || '',
      owner: r.customer_name || 'Owner',
      ownerId: r.customer_id,
      notes: r.notes || ''
    }))

    res.json({ data: vehicles })
  } catch (err) {
    console.error('[API Vehicles Get Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// Helper to resolve valid customer ID
async function resolveCustomerId(ownerId) {
  let custId = parseInt(ownerId, 10)
  if (!custId || isNaN(custId)) {
    const firstCust = await query.get('SELECT id FROM customers ORDER BY id ASC LIMIT 1')
    return firstCust?.id || 1
  }
  const exists = await query.get('SELECT id FROM customers WHERE id = $1', [custId])
  if (!exists) {
    const firstCust = await query.get('SELECT id FROM customers ORDER BY id ASC LIMIT 1')
    return firstCust?.id || custId
  }
  return custId
}

// POST create vehicle
router.post('/', async (req, res) => {
  try {
    const { number, vin, brand, model, year, color, fuelType, mileage, ownerId, notes, image, photoUrl } = req.body

    const targetCustomerId = await resolveCustomerId(ownerId)
    const validFuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG']
    const normalizedFuel = validFuels.find((f) => f.toLowerCase() === (fuelType || '').toLowerCase()) || 'Gasoline'

    let inserted = null
    try {
      inserted = await query.get(
        `INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          targetCustomerId,
          number,
          vin || null,
          brand || null,
          model || null,
          year ? parseInt(year, 10) : null,
          color || null,
          normalizedFuel,
          mileage ? parseInt(mileage, 10) : 0,
          image || photoUrl || null,
          notes || null
        ]
      )
    } catch (dbErr) {
      // If photo_url column was missing, add it and retry
      if (dbErr.message && dbErr.message.includes('photo_url')) {
        await query.run('ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT;')
        inserted = await query.get(
          `INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            targetCustomerId,
            number,
            vin || null,
            brand || null,
            model || null,
            year ? parseInt(year, 10) : null,
            color || null,
            normalizedFuel,
            mileage ? parseInt(mileage, 10) : 0,
            image || photoUrl || null,
            notes || null
          ]
        )
      } else {
        throw dbErr
      }
    }

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [inserted.customer_id])

    res.status(201).json({
      data: {
        id: inserted.id,
        number: inserted.vehicle_number,
        vin: inserted.vin || '',
        brand: inserted.brand || '',
        model: inserted.model || '',
        year: inserted.year,
        color: inserted.color || '',
        fuelType: inserted.fuel_type,
        mileage: inserted.mileage,
        image: inserted.photo_url || '',
        owner: customer?.full_name || '',
        ownerId: inserted.customer_id
      }
    })
  } catch (err) {
    console.error('[API Vehicle Create Error]:', err)
    res.status(500).json({ error: 'Failed to create vehicle', message: err.message })
  }
})

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { number, vin, brand, model, year, color, fuelType, mileage, ownerId, notes, image, photoUrl } = req.body

    const targetCustomerId = ownerId ? await resolveCustomerId(ownerId) : null
    const validFuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG']
    const normalizedFuel = fuelType ? (validFuels.find((f) => f.toLowerCase() === fuelType.toLowerCase()) || 'Gasoline') : null

    const updated = await query.get(
      `UPDATE vehicles
       SET vehicle_number = COALESCE($1, vehicle_number),
           vin = COALESCE($2, vin),
           brand = COALESCE($3, brand),
           model = COALESCE($4, model),
           year = COALESCE($5, year),
           color = COALESCE($6, color),
           fuel_type = COALESCE($7, fuel_type),
           mileage = COALESCE($8, mileage),
           customer_id = COALESCE($9, customer_id),
           photo_url = COALESCE($10, photo_url),
           notes = COALESCE($11, notes),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        number,
        vin,
        brand,
        model,
        year ? parseInt(year, 10) : null,
        color,
        normalizedFuel,
        mileage ? parseInt(mileage, 10) : null,
        targetCustomerId,
        image || photoUrl || null,
        notes,
        req.params.id
      ]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [updated?.customer_id])

    res.json({
      data: {
        id: updated.id,
        number: updated.vehicle_number,
        vin: updated.vin || '',
        brand: updated.brand || '',
        model: updated.model || '',
        year: updated.year,
        color: updated.color || '',
        fuelType: updated.fuel_type,
        mileage: updated.mileage,
        image: updated.photo_url || '',
        owner: customer?.full_name || '',
        ownerId: updated.customer_id
      }
    })
  } catch (err) {
    console.error('[API Vehicle Update Error]:', err)
    res.status(500).json({ error: 'Failed to update vehicle', message: err.message })
  }
})

// DELETE vehicle
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM vehicles WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Vehicle removed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
