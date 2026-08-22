import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all services
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM services ORDER BY id ASC')
    const services = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: 'Maintenance',
      description: r.description || '',
      estimatedCost: parseFloat(r.estimated_cost) || 0,
      laborHours: parseFloat(r.estimated_hours) || 1.0,
      isActive: Boolean(r.is_active)
    }))
    res.json({ data: services })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create service
router.post('/', async (req, res) => {
  try {
    const { name, description, estimatedCost, laborHours, isActive } = req.body

    const inserted = await query.get(
      `INSERT INTO services (name, description, estimated_cost, estimated_hours, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        description || null,
        parseFloat(estimatedCost) || 0,
        parseFloat(laborHours) || 1.0,
        isActive !== false
      ]
    )

    res.status(201).json({
      data: {
        id: inserted.id,
        name: inserted.name,
        category: 'Maintenance',
        description: inserted.description || '',
        estimatedCost: parseFloat(inserted.estimated_cost) || 0,
        laborHours: parseFloat(inserted.estimated_hours) || 1.0,
        isActive: Boolean(inserted.is_active)
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    const { name, description, estimatedCost, laborHours, isActive } = req.body

    const updated = await query.get(
      `UPDATE services
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           estimated_cost = COALESCE($3, estimated_cost),
           estimated_hours = COALESCE($4, estimated_hours),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        name,
        description,
        estimatedCost ? parseFloat(estimatedCost) : null,
        laborHours ? parseFloat(laborHours) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        req.params.id
      ]
    )

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        category: 'Maintenance',
        description: updated.description || '',
        estimatedCost: parseFloat(updated.estimated_cost) || 0,
        laborHours: parseFloat(updated.estimated_hours) || 1.0,
        isActive: Boolean(updated.is_active)
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE service
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM services WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Service removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
