import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All invoice routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all invoices
router.get('/', requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT i.*, 
             c.full_name AS customer_name,
             c.customer_code,
             c.phone AS customer_phone,
             c.email AS customer_email,
             c.address AS customer_address,
             ro.order_number,
             ro.problem_description,
             ro.diagnosis,
             ro.odometer,
             ro.fuel_level,
             ro.labor_minutes,
             ro.labor_rate,
             v.vehicle_number,
             v.brand AS vehicle_brand,
             v.model AS vehicle_model,
             v.year AS vehicle_year,
             v.color AS vehicle_color,
             v.vin AS vehicle_vin,
             u.full_name AS mechanic_name,
             COALESCE(
               (SELECT json_agg(
                  json_build_object(
                    'id', rp.id,
                    'sparePartId', sp.id,
                    'partCode', sp.part_code,
                    'name', sp.name,
                    'quantity', rp.quantity,
                    'unitPrice', rp.unit_price,
                    'totalPrice', rp.total_price
                  )
                )
                FROM repair_parts rp
                JOIN spare_parts sp ON rp.spare_part_id = sp.id
                WHERE rp.repair_order_id = ro.id),
               '[]'
             ) AS parts_used,
             COALESCE(
               (SELECT json_agg(
                  json_build_object(
                    'id', p.id,
                    'paymentNumber', p.payment_number,
                    'amount', p.amount,
                    'paymentMethod', p.payment_method,
                    'paymentDate', p.payment_date
                  )
                )
                FROM payments p
                WHERE p.invoice_id = i.id),
               '[]'
             ) AS payments_list
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN repair_orders ro ON i.repair_order_id = ro.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY i.id DESC
    `)

    const invoices = rows.map((r) => {
      const partsUsed = Array.isArray(r.parts_used) ? r.parts_used : []
      const paymentsList = Array.isArray(r.payments_list) ? r.payments_list : []
      const lastPayment = paymentsList.length > 0 ? paymentsList[paymentsList.length - 1] : null
      const totalAmt = parseFloat(r.total_amount) || 0
      const paidAmt = parseFloat(r.amount_paid) || 0
      const balDue = r.balance_due !== undefined && r.balance_due !== null ? parseFloat(r.balance_due) : Math.max(0, totalAmt - paidAmt)

      return {
        id: r.id,
        invoiceNumber: r.invoice_number,
        orderNumber: r.order_number || 'RO-2026-0001',
        repairOrderId: r.repair_order_id,
        customer: r.customer_name || 'Customer',
        customerId: r.customer_id,
        customerCode: r.customer_code || 'CUST-001',
        customerPhone: r.customer_phone || '',
        customerEmail: r.customer_email || '',
        customerAddress: r.customer_address || '',
        vehicle: r.vehicle_brand ? `${r.vehicle_brand} ${r.vehicle_model || ''}`.trim() : 'Vehicle',
        vehiclePlate: r.vehicle_number || '',
        vehicleBrand: r.vehicle_brand || '',
        vehicleModel: r.vehicle_model || '',
        vehicleYear: r.vehicle_year || '',
        vehicleColor: r.vehicle_color || '',
        vehicleVin: r.vehicle_vin || '',
        odometer: r.odometer || '',
        mechanic: r.mechanic_name || 'Workshop Technician',
        problem: r.problem_description || '',
        diagnosis: r.diagnosis || '',
        laborMinutes: r.labor_minutes || 0,
        laborRate: r.labor_rate || 45.0,
        partsUsed,
        payments: paymentsList,
        amount: totalAmt,
        subtotal: parseFloat(r.subtotal) || totalAmt,
        taxRate: parseFloat(r.tax_rate) || 0,
        taxAmount: parseFloat(r.tax_amount) || 0,
        discount: parseFloat(r.discount) || 0,
        paidAmount: paidAmt,
        balanceDue: balDue,
        status: r.status || 'Draft',
        paymentMethod: lastPayment?.paymentMethod || (paidAmt > 0 ? 'Credit/Debit Card' : 'Pending'),
        issueDate: r.issued_date ? new Date(r.issued_date).toISOString().split('T')[0] : '2026-08-22',
        dueDate: r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : '2026-08-29',
        notes: r.notes || '',
      }
    })

    res.json({ data: invoices })
  } catch (err) {
    console.error('[API Invoices Get Error]:', err)
    res.status(500).json({ error: 'Failed to fetch invoices', message: err.message })
  }
})

// POST create invoice
router.post('/', requirePermission('invoices', 'create'), async (req, res) => {
  try {
    const { customerId, repairOrderId, orderNumber, amount, dueDate } = req.body
    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM invoices')
    const invoiceNumber = `INV-2026-${String((parseInt(countRow?.cnt, 10) || 0) + 1).padStart(3, '0')}`
    const amt = parseFloat(amount) || 0

    let roId = repairOrderId
    let custId = customerId

    if (!roId && orderNumber) {
      const foundRo = await query.get('SELECT id, customer_id FROM repair_orders WHERE order_number = $1', [orderNumber])
      if (foundRo) {
        roId = foundRo.id
        if (!custId) custId = foundRo.customer_id
      }
    }

    if (!roId) {
      const anyRo = await query.get('SELECT id, customer_id FROM repair_orders ORDER BY id DESC LIMIT 1')
      roId = anyRo?.id || 1
      if (!custId && anyRo?.customer_id) custId = anyRo.customer_id
    }

    if (!custId) {
      const anyCust = await query.get('SELECT id FROM customers ORDER BY id LIMIT 1')
      custId = anyCust?.id || 1
    }

    const inserted = await query.get(
      `INSERT INTO invoices (invoice_number, repair_order_id, customer_id, total_amount, amount_paid, balance_due, status, due_date)
       VALUES ($1, $2, $3, $4, 0.00, $4, 'Issued', $5)
       RETURNING *`,
      [invoiceNumber, roId, custId, amt, dueDate || null]
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
        dueDate,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice', message: err.message })
  }
})

// POST record payment
const recordPaymentHandler = async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body
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

    // Record in payments table
    try {
      const payCount = await query.get('SELECT COUNT(*) AS cnt FROM payments')
      const payNum = `PAY-2026-${String((parseInt(payCount?.cnt, 10) || 0) + 1).padStart(3, '0')}`
      const validMethods = ['Cash', 'Credit/Debit Card', 'Bank Transfer', 'Mobile Payment', 'QR Payment']
      const pMethod = validMethods.find((m) => m.toLowerCase() === (paymentMethod || '').toLowerCase()) || 'Credit/Debit Card'

      await query.run(
        `INSERT INTO payments (payment_number, invoice_id, amount, payment_method, payment_date, received_by)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [payNum, updated.id, addPaid, pMethod, req.user?.id || null]
      )
    } catch (payErr) {
      console.warn('[Payments table note]:', payErr.message)
    }

    res.json({
      data: {
        id: updated.id,
        invoiceNumber: updated.invoice_number,
        orderNumber: ro?.order_number || '',
        customer: customer?.full_name || '',
        amount: totalAmount,
        paidAmount: newTotalPaid,
        status: newStatus,
        paymentMethod: paymentMethod || 'Credit Card',
        issueDate: updated.issued_date,
        dueDate: updated.due_date,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment', message: err.message })
  }
}

router.post('/:id/pay', requirePermission('invoices', 'update'), recordPaymentHandler)
router.post('/:id/payments', requirePermission('invoices', 'update'), recordPaymentHandler)

export default router
