import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all customers (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    let query = supabase.from('customers').select('*').order('id', { ascending: false })

    if (search) {
      query = supabase
        .from('customers')
        .select('*')
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,customer_code.ilike.%${search}%`)
        .order('id', { ascending: false })
    }

    const { data: rows, error } = await query
    if (error) throw error

    // Get vehicle counts for each customer
    const customers = await Promise.all((rows || []).map(async (r) => {
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', r.id)

      return {
        id: r.id,
        code: r.customer_code,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        avatar: r.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        vehiclesCount: count || 0,
        totalSpent: r.total_spent || '$0.00',
        registrationDate: r.registration_date,
        notes: r.notes
      }
    }))
    res.json({ data: customers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const { data: r, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !r) return res.status(404).json({ error: 'Customer not found' })

    res.json({
      data: {
        id: r.id,
        code: r.customer_code,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        avatar: r.avatar_url,
        totalSpent: r.total_spent,
        registrationDate: r.registration_date
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true })
    const code = `CUST-${String((count || 0) + 1).padStart(3, '0')}`
    const avatar = `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`

    const { data: inserted, error } = await supabase
      .from('customers')
      .insert({
        customer_code: code,
        full_name: name,
        phone,
        email,
        address,
        avatar_url: avatar,
        total_spent: '$0.00'
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
        address,
        avatar,
        vehiclesCount: 0,
        totalSpent: '$0.00',
        registrationDate: new Date().toISOString().split('T')[0]
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    const { data: updated, error } = await supabase
      .from('customers')
      .update({ full_name: name, phone, email, address })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json({
      data: {
        id: updated.id,
        code: updated.customer_code,
        name: updated.full_name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        avatar: updated.avatar_url,
        totalSpent: updated.total_spent
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Customer deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
