import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all employees
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error

    const employees = (rows || []).map((r) => ({
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
    const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true })
    const empCode = `EMP-${String((count || 0) + 1).padStart(3, '0')}`

    const { data: inserted, error } = await supabase
      .from('employees')
      .insert({
        employee_code: empCode,
        name,
        position: roleTitle,
        department: department || 'Workshop',
        phone,
        email,
        salary: baseSalary || '$3,500/mo',
        attendance_today: attendanceToday || 'Present',
        employment_status: status || 'Active'
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
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
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (roleTitle !== undefined) updateData.position = roleTitle
    if (department !== undefined) updateData.department = department
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (baseSalary !== undefined) updateData.salary = baseSalary
    if (attendanceToday !== undefined) updateData.attendance_today = attendanceToday
    if (status !== undefined) updateData.employment_status = status

    const { data: updated, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

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
    const { data: emp, error: fetchErr } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !emp) return res.status(404).json({ error: 'Employee not found' })

    const newAttendance = emp.attendance_today === 'Present' ? 'On Leave' : 'Present'
    const { error } = await supabase
      .from('employees')
      .update({ attendance_today: newAttendance })
      .eq('id', req.params.id)

    if (error) throw error

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
    const { error } = await supabase.from('employees').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Employee removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
