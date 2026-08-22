import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('invoices')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    const invoices = (rows || []).map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      orderNumber: r.order_number,
      repairOrderId: r.repair_order_id,
      customer: r.customer,
      customerId: r.customer_id,
      amount: r.amount,
      paidAmount: r.paid_amount,
      status: r.status,
      paymentMethod: r.payment_method,
      issueDate: r.issue_date,
      dueDate: r.due_date,
      notes: r.notes
    }))
    res.json({ data: invoices })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create invoice
router.post('/', async (req, res) => {
  try {
    const { customer, customerId, orderNumber, repairOrderId, amount, dueDate, paymentMethod } = req.body
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
    const invoiceNumber = `INV-2026-${String((count || 0) + 1).padStart(3, '0')}`
    const amt = parseFloat(amount) || 0

    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        repair_order_id: repairOrderId || 1,
        order_number: orderNumber,
        customer_id: customerId || 1,
        customer,
        amount: amt,
        paid_amount: 0.00,
        status: 'Issued',
        payment_method: paymentMethod || 'Credit Card',
        due_date: dueDate
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      data: {
        id: inserted.id,
        invoiceNumber,
        orderNumber,
        repairOrderId,
        customer,
        customerId,
        amount: amt,
        paidAmount: 0.00,
        status: 'Issued',
        paymentMethod: paymentMethod || 'Credit Card',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST record payment
router.post('/:id/pay', async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body

    const { data: inv, error: fetchErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !inv) return res.status(404).json({ error: 'Invoice not found' })

    const addPaid = parseFloat(paidAmount) || 0
    const newTotalPaid = (inv.paid_amount || 0) + addPaid
    const newStatus = newTotalPaid >= inv.amount ? 'Paid' : newTotalPaid > 0 ? 'Partially Paid' : 'Issued'

    const updateData = { paid_amount: newTotalPaid, status: newStatus }
    if (paymentMethod) updateData.payment_method = paymentMethod

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', req.params.id)

    if (error) throw error

    res.json({
      data: {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        orderNumber: inv.order_number,
        customer: inv.customer,
        amount: inv.amount,
        paidAmount: newTotalPaid,
        status: newStatus,
        paymentMethod: paymentMethod || inv.payment_method,
        issueDate: inv.issue_date,
        dueDate: inv.due_date
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
