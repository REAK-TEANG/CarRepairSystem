import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM invoices ORDER BY id DESC')
    const invoices = rows.map((r) => ({
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
    const count = await query.get('SELECT COUNT(*) as cnt FROM invoices')
    const invoiceNumber = `INV-2026-${String((count?.cnt || 0) + 1).padStart(3, '0')}`
    const amt = parseFloat(amount) || 0

    const result = await query.run(
      'INSERT INTO invoices (invoice_number, repair_order_id, order_number, customer_id, customer, amount, paid_amount, status, payment_method, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceNumber, repairOrderId || 1, orderNumber, customerId || 1, customer, amt, 0.00, 'Issued', paymentMethod || 'Credit Card', dueDate]
    )

    res.status(201).json({
      data: {
        id: result.lastID,
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
    const inv = await query.get('SELECT * FROM invoices WHERE id = ?', [req.params.id])
    if (!inv) return res.status(404).json({ error: 'Invoice not found' })

    const addPaid = parseFloat(paidAmount) || 0
    const newTotalPaid = (inv.paid_amount || 0) + addPaid
    const newStatus = newTotalPaid >= inv.amount ? 'Paid' : newTotalPaid > 0 ? 'Partially Paid' : 'Issued'

    await query.run(
      'UPDATE invoices SET paid_amount = ?, status = ?, payment_method = COALESCE(?, payment_method), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newTotalPaid, newStatus, paymentMethod, req.params.id]
    )

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
