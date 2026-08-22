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
      category: r.category,
      description: r.description,
      estimatedCost: r.estimated_cost,
      laborHours: r.estimated_hours,
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
    const { name, category, description, estimatedCost, laborHours, isActive } = req.body
    const result = await query.run(
      'INSERT INTO services (name, category, description, estimated_cost, estimated_hours, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category || 'Maintenance', description, parseFloat(estimatedCost) || 0, parseFloat(laborHours) || 1.0, isActive === false ? 0 : 1]
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        name,
        category: category || 'Maintenance',
        description,
        estimatedCost: parseFloat(estimatedCost) || 0,
        laborHours: parseFloat(laborHours) || 1.0,
        isActive: isActive !== false
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    const { name, category, description, estimatedCost, laborHours, isActive } = req.body
    await query.run(
      'UPDATE services SET name = COALESCE(?, name), category = COALESCE(?, category), description = COALESCE(?, description), estimated_cost = COALESCE(?, estimated_cost), estimated_hours = COALESCE(?, estimated_hours), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, description, estimatedCost, laborHours, isActive === undefined ? null : (isActive ? 1 : 0), req.params.id]
    )
    const updated = await query.get('SELECT * FROM services WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        description: updated.description,
        estimatedCost: updated.estimated_cost,
        laborHours: updated.estimated_hours,
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
    await query.run('DELETE FROM services WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Service removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
