import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT i.*, 
             c.full_name AS customer_name,
             ro.order_number
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN repair_orders ro ON i.repair_order_id = ro.id
      ORDER BY i.id DESC
    `)

    const invoices = rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      orderNumber: r.order_number || 'RO-2026-0001',
      repairOrderId: r.repair_order_id,
      customer: r.customer_name || 'Customer',
      customerId: r.customer_id,
      amount: parseFloat(r.total_amount) || 0,
      paidAmount: parseFloat(r.amount_paid) || 0,
      status: r.status || 'Draft',
      paymentMethod: 'Credit Card',
      issueDate: r.issued_date ? new Date(r.issued_date).toISOString().split('T')[0] : '2026-08-22',
      dueDate: r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : '2026-08-29',
      notes: r.notes || ''
    }))

    res.json({ data: invoices })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create invoice
router.post('/', async (req, res) => {
  try {
    const { customerId, repairOrderId, amount, dueDate } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM invoices')
    const invoiceNumber = `INV-2026-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`
    const amt = parseFloat(amount) || 0

    const inserted = await query.get(
      `INSERT INTO invoices (invoice_number, repair_order_id, customer_id, total_amount, amount_paid, balance_due, status, due_date)
       VALUES ($1, $2, $3, $4, 0.00, $4, 'Issued', $5)
       RETURNING *`,
      [invoiceNumber, repairOrderId || 1, customerId || 1, amt, dueDate || null]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [inserted.customer_id])
    const ro = inserted.repair_order_id ? await query.get('SELECT order_number FROM repair_orders WHERE id = $1', [inserted.repair_order_id]) : null

    res.status(201).json({
      data: {
        id: inserted.id,
        invoiceNumber,
        orderNumber: ro?.order_number || '',
        repairOrderId: inserted.repair_order_id,
        customer: customer?.full_name || '',
        customerId: inserted.customer_id,
        amount: amt,
        paidAmount: 0.00,
        status: 'Issued',
        paymentMethod: 'Credit Card',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST record payment
const recordPaymentHandler = async (req, res) => {
  try {
    const { paidAmount } = req.body
    const inv = await query.get('SELECT * FROM invoices WHERE id = $1', [req.params.id])
    if (!inv) return res.status(404).json({ error: 'Invoice not found' })

    const addPaid = parseFloat(paidAmount) || 0
    const newTotalPaid = (parseFloat(inv.amount_paid) || 0) + addPaid
    const totalAmount = parseFloat(inv.total_amount) || 0
    const newBalance = Math.max(0, totalAmount - newTotalPaid)
    const newStatus = newTotalPaid >= totalAmount ? 'Paid' : newTotalPaid > 0 ? 'Partially Paid' : 'Issued'

    const updated = await query.get(
      `UPDATE invoices
       SET amount_paid = $1, balance_due = $2, status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newTotalPaid, newBalance, newStatus, req.params.id]
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [updated.customer_id])
    const ro = updated.repair_order_id ? await query.get('SELECT order_number FROM repair_orders WHERE id = $1', [updated.repair_order_id]) : null

    res.json({
      data: {
        id: updated.id,
        invoiceNumber: updated.invoice_number,
        orderNumber: ro?.order_number || '',
        customer: customer?.full_name || '',
        amount: totalAmount,
        paidAmount: newTotalPaid,
        status: newStatus,
        paymentMethod: 'Credit Card',
        issueDate: updated.issued_date,
        dueDate: updated.due_date
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

router.post('/:id/pay', recordPaymentHandler)
router.post('/:id/payments', recordPaymentHandler)

export default router
