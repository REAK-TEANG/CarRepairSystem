import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all mechanics
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM mechanics ORDER BY id ASC')
    const mechanics = rows.map((r) => ({
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
    const count = await query.get('SELECT COUNT(*) as cnt FROM mechanics')
    const code = `MEC-${String((count?.cnt || 0) + 1).padStart(2, '0')}`

    const result = await query.run(
      'INSERT INTO mechanics (mechanic_code, name, phone, email, specialization, experience_years, rating, active_jobs, completed_jobs, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, name, phone, email, specialization, parseInt(experience, 10) || 5, 5.0, 0, 0, status || 'Active']
    )

    res.status(201).json({
      data: {
        id: result.lastID,
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
    await query.run(
      'UPDATE mechanics SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email), specialization = COALESCE(?, specialization), experience_years = COALESCE(?, experience_years), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, email, specialization, experience, status, req.params.id]
    )
    const updated = await query.get('SELECT * FROM mechanics WHERE id = ?', [req.params.id])
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
    await query.run('DELETE FROM mechanics WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Mechanic removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
