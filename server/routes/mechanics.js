import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all mechanics
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('mechanics')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error

    const mechanics = (rows || []).map((r) => ({
      id: r.id,
      code: r.mechanic_code,
      name: r.name,
      phone: r.phone,
      email: r.email,
      specialization: r.specialization,
      experience: r.experience_years,
      rating: r.rating,
      activeJobs: r.active_jobs,
      completedJobs: r.completed_jobs,
      status: r.status
    }))
    res.json({ data: mechanics })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create mechanic
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, specialization, experience, status } = req.body
    const { count } = await supabase.from('mechanics').select('*', { count: 'exact', head: true })
    const code = `MEC-${String((count || 0) + 1).padStart(2, '0')}`

    const { data: inserted, error } = await supabase
      .from('mechanics')
      .insert({
        mechanic_code: code,
        name,
        phone,
        email,
        specialization,
        experience_years: parseInt(experience, 10) || 5,
        rating: 5.0,
        active_jobs: 0,
        completed_jobs: 0,
        status: status || 'Active'
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
        code,
        name,
        phone,
        email,
        specialization,
        experience: parseInt(experience, 10) || 5,
        rating: 5.0,
        activeJobs: 0,
        completedJobs: 0,
        status: status || 'Active'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update mechanic
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, specialization, experience, status } = req.body
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (specialization !== undefined) updateData.specialization = specialization
    if (experience !== undefined) updateData.experience_years = experience
    if (status !== undefined) updateData.status = status

    const { data: updated, error } = await supabase
      .from('mechanics')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json({
      data: {
        id: updated.id,
        code: updated.mechanic_code,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        specialization: updated.specialization,
        experience: updated.experience_years,
        rating: updated.rating,
        activeJobs: updated.active_jobs,
        completedJobs: updated.completed_jobs,
        status: updated.status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE mechanic
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('mechanics').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Mechanic removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
