import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all services
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error

    const services = (rows || []).map((r) => ({
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

    const { data: inserted, error } = await supabase
      .from('services')
      .insert({
        name,
        category: category || 'Maintenance',
        description,
        estimated_cost: parseFloat(estimatedCost) || 0,
        estimated_hours: parseFloat(laborHours) || 1.0,
        is_active: isActive !== false
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
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
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (estimatedCost !== undefined) updateData.estimated_cost = estimatedCost
    if (laborHours !== undefined) updateData.estimated_hours = laborHours
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: updated, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

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
    const { error } = await supabase.from('services').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Service removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
