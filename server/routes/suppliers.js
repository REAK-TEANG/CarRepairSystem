import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const suppliers = (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      contactPerson: r.contact_person || r.contact_name,
      phone: r.phone,
      email: r.email,
      address: r.address,
      categories: r.categories,
      rating: r.rating || 4.9,
      activeOrders: r.active_orders || 0
    }))
    res.json({ data: suppliers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, categories } = req.body

    const { data: inserted, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        contact_person: contactPerson,
        contact_name: contactPerson,
        phone,
        email,
        address,
        categories,
        rating: 4.9,
        active_orders: 0
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
        name,
        contactPerson,
        phone,
        email,
        address,
        categories,
        rating: 4.9,
        activeOrders: 0
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, categories } = req.body

    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({
        name,
        contact_person: contactPerson,
        contact_name: contactPerson,
        phone,
        email,
        address,
        categories
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        contactPerson: updated.contact_person || updated.contact_name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        categories: updated.categories,
        rating: updated.rating,
        activeOrders: updated.active_orders
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Supplier removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
