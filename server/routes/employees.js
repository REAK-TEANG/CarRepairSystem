import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all employees
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM employees ORDER BY id ASC')
    const employees = rows.map((r) => ({
      id: r.id,
      empCode: r.employee_code,
      name: r.name,
      roleTitle: r.position,
      department: r.department,
      phone: r.phone,
      email: r.email,
      baseSalary: r.salary,
      attendanceToday: r.attendance_today,
      status: r.employment_status
    }))
    res.json({ data: employees })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create employee
router.post('/', async (req, res) => {
  try {
    const { name, roleTitle, department, phone, email, baseSalary, attendanceToday, status } = req.body
    const count = await query.get('SELECT COUNT(*) as cnt FROM employees')
    const empCode = `EMP-${String((count?.cnt || 0) + 1).padStart(3, '0')}`

    const result = await query.run(
      'INSERT INTO employees (employee_code, name, position, department, phone, email, salary, attendance_today, employment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [empCode, name, roleTitle, department || 'Workshop', phone, email, baseSalary || '$3,500/mo', attendanceToday || 'Present', status || 'Active']
    )

    res.status(201).json({
      data: {
        id: result.lastID,
        empCode,
        name,
        roleTitle,
        department: department || 'Workshop',
        phone,
        email,
        baseSalary: baseSalary || '$3,500/mo',
        attendanceToday: attendanceToday || 'Present',
        status: status || 'Active'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { name, roleTitle, department, phone, email, baseSalary, attendanceToday, status } = req.body
    await query.run(
      'UPDATE employees SET name = COALESCE(?, name), position = COALESCE(?, position), department = COALESCE(?, department), phone = COALESCE(?, phone), email = COALESCE(?, email), salary = COALESCE(?, salary), attendance_today = COALESCE(?, attendance_today), employment_status = COALESCE(?, employment_status), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, roleTitle, department, phone, email, baseSalary, attendanceToday, status, req.params.id]
    )
    const updated = await query.get('SELECT * FROM employees WHERE id = ?', [req.params.id])
    res.json({
      data: {
        id: updated.id,
        empCode: updated.employee_code,
        name: updated.name,
        roleTitle: updated.position,
        department: updated.department,
        phone: updated.phone,
        email: updated.email,
        baseSalary: updated.salary,
        attendanceToday: updated.attendance_today,
        status: updated.employment_status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST toggle attendance
router.post('/:id/toggle-attendance', async (req, res) => {
  try {
    const emp = await query.get('SELECT * FROM employees WHERE id = ?', [req.params.id])
    if (!emp) return res.status(404).json({ error: 'Employee not found' })

    const newAttendance = emp.attendance_today === 'Present' ? 'On Leave' : 'Present'
    await query.run('UPDATE employees SET attendance_today = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newAttendance, req.params.id])

    res.json({
      data: {
        id: emp.id,
        empCode: emp.employee_code,
        name: emp.name,
        roleTitle: emp.position,
        department: emp.department,
        phone: emp.phone,
        email: emp.email,
        baseSalary: emp.salary,
        attendanceToday: newAttendance,
        status: emp.employment_status
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    await query.run('DELETE FROM employees WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Employee removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
