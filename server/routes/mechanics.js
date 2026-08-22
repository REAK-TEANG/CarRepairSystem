import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all mechanics
router.get('/', async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT e.*, u.full_name, u.phone, u.email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.id ASC
    `)

    const mechanics = rows.map((r) => ({
      id: r.id,
      code: r.employee_code,
      name: r.full_name || `Mechanic ${r.employee_code}`,
      phone: r.phone || '',
      email: r.email || '',
      specialization: r.specialization || 'General Repair',
      experience: r.experience_years || 5,
      rating: 4.9,
      activeJobs: 0,
      completedJobs: 0,
      status: r.employment_status || 'Active'
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
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM employees')
    const code = `EMP-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`

    const username = `emp_${Date.now()}`
    const user = await query.get(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, 4)
       RETURNING *`,
      [username, email || `${username}@carrepair.com`, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', name, phone || null]
    )

    const inserted = await query.get(
      `INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, employment_status)
       VALUES ($1, $2, 'Mechanic', $3, $4, $5)
       RETURNING *`,
      [user.id, code, specialization || 'General Repair', parseInt(experience, 10) || 3, status || 'Active']
    )

    res.status(201).json({
      data: {
        id: inserted.id,
        code,
        name,
        phone: phone || '',
        email: email || '',
        specialization: inserted.specialization,
        experience: inserted.experience_years,
        rating: 5.0,
        activeJobs: 0,
        completedJobs: 0,
        status: inserted.employment_status
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

    const emp = await query.get(
      `UPDATE employees
       SET specialization = COALESCE($1, specialization),
           experience_years = COALESCE($2, experience_years),
           employment_status = COALESCE($3, employment_status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [specialization, experience ? parseInt(experience, 10) : null, status, req.params.id]
    )

    if (emp?.user_id) {
      await query.run(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             email = COALESCE($3, email),
             updated_at = NOW()
         WHERE id = $4`,
        [name, phone, email, emp.user_id]
      )
    }

    res.json({
      data: {
        id: emp.id,
        code: emp.employee_code,
        name: name || 'Mechanic',
        phone: phone || '',
        email: email || '',
        specialization: emp.specialization,
        experience: emp.experience_years,
        rating: 4.9,
        activeJobs: 0,
        completedJobs: 0,
        status: emp.employment_status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE mechanic
router.delete('/:id', async (req, res) => {
  try {
    const emp = await query.get('SELECT user_id FROM employees WHERE id = $1', [req.params.id])
    if (emp?.user_id) {
      await query.run('DELETE FROM users WHERE id = $1', [emp.user_id])
    } else {
      await query.run('DELETE FROM employees WHERE id = $1', [req.params.id])
    }
    res.json({ success: true, message: 'Mechanic removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
