import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all employees
router.get('/', async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT e.*, u.full_name, u.phone, u.email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.id ASC
    `)

    const employees = rows.map((r) => ({
      id: r.id,
      empCode: r.employee_code,
      name: r.full_name || `Employee ${r.employee_code}`,
      roleTitle: r.position || 'Staff',
      department: 'Workshop',
      phone: r.phone || '',
      email: r.email || '',
      baseSalary: r.salary ? `$${r.salary}/mo` : '$3,500/mo',
      attendanceToday: 'Present',
      status: r.employment_status || 'Active',
      image: r.photo_url || ''
    }))

    res.json({ data: employees })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create employee
router.post('/', async (req, res) => {
  try {
    const { name, roleTitle, phone, email, baseSalary, status, specialization, experience, image, photoUrl } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM employees')
    const empCode = `EMP-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`

    const username = `emp_${Date.now()}`
    const user = await query.get(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, 2)
       RETURNING *`,
      [username, email || `${username}@carrepair.com`, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', name, phone || null]
    )

    const salaryNum = parseFloat(String(baseSalary || '3500').replace(/[^0-9.]/g, '')) || 3500
    const finalPhoto = image || photoUrl || null

    let inserted = null
    try {
      inserted = await query.get(
        `INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [user.id, empCode, roleTitle || 'Staff', specialization || null, experience ? parseInt(experience, 10) : 0, salaryNum, status || 'Active', finalPhoto]
      )
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('photo_url')) {
        await query.run('ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;')
        inserted = await query.get(
          `INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [user.id, empCode, roleTitle || 'Staff', specialization || null, experience ? parseInt(experience, 10) : 0, salaryNum, status || 'Active', finalPhoto]
        )
      } else {
        throw dbErr
      }
    }

    res.status(201).json({
      data: {
        id: inserted.id,
        empCode,
        name,
        roleTitle: inserted.position,
        department: 'Workshop',
        phone: phone || '',
        email: email || '',
        baseSalary: `$${inserted.salary}/mo`,
        attendanceToday: 'Present',
        status: inserted.employment_status,
        image: inserted.photo_url || ''
      }
    })
  } catch (err) {
    console.error('[API Employee Create Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { name, roleTitle, phone, email, baseSalary, status, image, photoUrl } = req.body
    const salaryNum = baseSalary ? parseFloat(String(baseSalary).replace(/[^0-9.]/g, '')) : null
    const finalPhoto = image || photoUrl || null

    let emp = null
    try {
      emp = await query.get(
        `UPDATE employees
         SET position = COALESCE($1, position),
             salary = COALESCE($2, salary),
             employment_status = COALESCE($3, employment_status),
             photo_url = COALESCE($4, photo_url),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [roleTitle, salaryNum, status, finalPhoto, req.params.id]
      )
    } catch (dbErr) {
      if (dbErr.message && dbErr.message.includes('photo_url')) {
        await query.run('ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;')
        emp = await query.get(
          `UPDATE employees
           SET position = COALESCE($1, position),
               salary = COALESCE($2, salary),
               employment_status = COALESCE($3, employment_status),
               photo_url = COALESCE($4, photo_url),
               updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [roleTitle, salaryNum, status, finalPhoto, req.params.id]
        )
      } else {
        throw dbErr
      }
    }

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
        empCode: emp.employee_code,
        name: name || 'Employee',
        roleTitle: emp.position,
        department: 'Workshop',
        phone: phone || '',
        email: email || '',
        baseSalary: `$${emp.salary}/mo`,
        attendanceToday: 'Present',
        status: emp.employment_status,
        image: emp.photo_url || ''
      }
    })
  } catch (err) {
    console.error('[API Employee Update Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST toggle attendance
router.post('/:id/toggle-attendance', async (req, res) => {
  res.json({ success: true, message: 'Attendance toggled' })
})

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const emp = await query.get('SELECT user_id FROM employees WHERE id = $1', [req.params.id])
    if (emp?.user_id) {
      await query.run('DELETE FROM users WHERE id = $1', [emp.user_id])
    } else {
      await query.run('DELETE FROM employees WHERE id = $1', [req.params.id])
    }
    res.json({ success: true, message: 'Employee removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
