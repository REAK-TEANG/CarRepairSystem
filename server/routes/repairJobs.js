import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All repair order routes require authenticated Bearer JWT token
router.use(authenticateToken)

/**
 * Helper function to execute automatic stock deductions
 */
async function autoStockOutForRepair(repairOrderId, orderNumber, serviceId, usedParts, performedBy) {
  const partsToDeduct = []

  // 1. If serviceId provided, fetch Bill of Materials (required parts)
  if (serviceId) {
    const serviceParts = await query.all(
      `SELECT sp.id as spare_part_id, sp.part_code, sp.name, sp.unit_price, sp.stock_quantity,
              svp.quantity as required_quantity, s.name as service_name
       FROM service_parts svp
       JOIN spare_parts sp ON svp.spare_part_id = sp.id
       JOIN services s ON svp.service_id = s.id
       WHERE svp.service_id = $1`,
      [serviceId]
    )

    for (const sp of serviceParts) {
      partsToDeduct.push({
        sparePartId: sp.spare_part_id,
        partCode: sp.part_code,
        name: sp.name,
        unitPrice: parseFloat(sp.unit_price) || 0,
        quantity: parseInt(sp.required_quantity, 10) || 1,
        serviceName: sp.service_name,
      })
    }
  }

  // 2. If usedParts array provided explicitly
  if (Array.isArray(usedParts) && usedParts.length > 0) {
    for (const item of usedParts) {
      const partId = item.sparePartId || item.spare_part_id || item.id
      const qty = parseInt(item.quantity, 10) || 1
      if (!partId) continue

      const partInfo = await query.get('SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE id = $1', [partId])
      if (partInfo) {
        partsToDeduct.push({
          sparePartId: partInfo.id,
          partCode: partInfo.part_code,
          name: partInfo.name,
          unitPrice: parseFloat(partInfo.unit_price) || 0,
          quantity: qty,
          serviceName: null,
        })
      }
    }
  }

  // 3. Execute stock deduction, insert inventory transactions, and add to repair_parts
  for (const part of partsToDeduct) {
    // A. Decrement stock quantity
    await query.run(
      `UPDATE spare_parts
       SET stock_quantity = GREATEST(0, stock_quantity - $1),
           updated_at = NOW()
       WHERE id = $2`,
      [part.quantity, part.sparePartId]
    )

    // B. Insert inventory transaction log
    const notes = part.serviceName
      ? `Auto Stock-Out for Service "${part.serviceName}" on Job ${orderNumber}`
      : `Auto Stock-Out for Repair Job ${orderNumber}`

    await query.run(
      `INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
       VALUES ($1, 'Stock Out', $2, $3, 'repair_order', $4, $5)`,
      [part.sparePartId, part.quantity, repairOrderId, notes, performedBy]
    )

    // C. Record in repair_parts
    const totalPrice = part.unitPrice * part.quantity
    await query.run(
      `INSERT INTO repair_parts (repair_order_id, spare_part_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [repairOrderId, part.sparePartId, part.quantity, part.unitPrice, totalPrice]
    )
  }

  return partsToDeduct
}

// GET all repair jobs
router.get('/', requirePermission('repair_jobs', 'read'), async (req, res) => {
  try {
    const { mechanicId, vehicleId, customerId } = req.query
    let sql = `
      SELECT ro.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', rp.id,
                   'sparePartId', sp.id,
                   'partCode', sp.part_code,
                   'name', sp.name,
                   'quantity', rp.quantity,
                   'unitPrice', rp.unit_price,
                   'totalPrice', rp.total_price
                 )
               ) FILTER (WHERE rp.id IS NOT NULL),
               '[]'
             ) AS parts_used
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN repair_parts rp ON rp.repair_order_id = ro.id
      LEFT JOIN spare_parts sp ON rp.spare_part_id = sp.id
    `
    let params = []
    let whereClauses = []

    if (mechanicId) {
      whereClauses.push(`ro.mechanic_id = $${params.length + 1}`)
      params.push(mechanicId)
    }
    if (vehicleId) {
      whereClauses.push(`ro.vehicle_id = $${params.length + 1}`)
      params.push(vehicleId)
    }
    if (customerId) {
      whereClauses.push(`ro.customer_id = $${params.length + 1}`)
      params.push(customerId)
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ')
    }

    sql += ` GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name ORDER BY ro.id DESC`

    const rows = await query.all(sql, params)

    const jobs = rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      customer: r.customer_name || 'Customer',
      customerId: r.customer_id,
      vehicle: r.brand ? `${r.brand} ${r.model || ''}`.trim() : 'Vehicle',
      vehicleId: r.vehicle_id,
      plate: r.vehicle_number || '',
      mechanic: r.mechanic_name || 'Mechanic',
      mechanicId: r.mechanic_id,
      problem: r.problem_description || '',
      diagnosis: r.diagnosis || '',
      estimatedCost: r.estimated_cost ? `$${r.estimated_cost}` : '$350.00',
      actualCost: r.actual_cost ? `$${r.actual_cost}` : '',
      status: r.status || 'Pending',
      odometer: r.odometer || 0,
      fuelLevel: r.fuel_level || '1/2',
      intakeInspection: r.intake_inspection || {},
      customerApproval: r.customer_approval || 'Approved',
      approvedAmount: r.approved_amount || 0,
      qaChecklist: r.qa_checklist || {},
      laborMinutes: r.labor_minutes || 0,
      laborRate: r.labor_rate || 45.00,
      nextServiceDueDate: r.next_service_due_date || null,
      nextServiceDueKm: r.next_service_due_km || null,
      createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'Today',
      partsUsed: Array.isArray(r.parts_used) ? r.parts_used : [],
    }))

    res.json({ data: jobs })
  } catch (err) {
    console.error('[API Repair Jobs Error]:', err)
    res.status(500).json({ error: 'Failed to fetch repair jobs', message: err.message })
  }
})

// GET single repair job
router.get('/:id', requirePermission('repair_jobs', 'read'), async (req, res) => {
  try {
    const r = await query.get(
      `SELECT ro.*, 
              c.full_name AS customer_name,
              v.vehicle_number, v.brand, v.model,
              u.full_name AS mechanic_name,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', rp.id,
                    'sparePartId', sp.id,
                    'partCode', sp.part_code,
                    'name', sp.name,
                    'quantity', rp.quantity,
                    'unitPrice', rp.unit_price,
                    'totalPrice', rp.total_price
                  )
                ) FILTER (WHERE rp.id IS NOT NULL),
                '[]'
              ) AS parts_used
       FROM repair_orders ro
       LEFT JOIN customers c ON ro.customer_id = c.id
       LEFT JOIN vehicles v ON ro.vehicle_id = v.id
       LEFT JOIN employees e ON ro.mechanic_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN repair_parts rp ON rp.repair_order_id = ro.id
       LEFT JOIN spare_parts sp ON rp.spare_part_id = sp.id
       WHERE ro.id = $1
       GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name`,
      [req.params.id]
    )

    if (!r) {
      return res.status(404).json({ error: 'Repair order not found' })
    }

    res.json({
      data: {
        id: r.id,
        orderNumber: r.order_number,
        customer: r.customer_name || '',
        customerId: r.customer_id,
        vehicle: r.brand ? `${r.brand} ${r.model || ''}`.trim() : '',
        vehicleId: r.vehicle_id,
        plate: r.vehicle_number || '',
        mechanic: r.mechanic_name || '',
        mechanicId: r.mechanic_id,
        problem: r.problem_description,
        diagnosis: r.diagnosis,
        estimatedCost: r.estimated_cost ? `$${r.estimated_cost}` : '',
        actualCost: r.actual_cost ? `$${r.actual_cost}` : '',
        status: r.status,
        odometer: r.odometer || 0,
        fuelLevel: r.fuel_level || '1/2',
        intakeInspection: r.intake_inspection || {},
        customerApproval: r.customer_approval || 'Approved',
        approvedAmount: r.approved_amount || 0,
        qaChecklist: r.qa_checklist || {},
        laborMinutes: r.labor_minutes || 0,
        laborRate: r.labor_rate || 45.00,
        nextServiceDueDate: r.next_service_due_date || null,
        nextServiceDueKm: r.next_service_due_km || null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'Today',
        partsUsed: Array.isArray(r.parts_used) ? r.parts_used : [],
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repair job', message: err.message })
  }
})

// POST create repair job (with Auto Stock-Out, DVI & Estimate Authorization)
router.post('/', requirePermission('repair_jobs', 'create'), async (req, res) => {
  try {
    const {
      customerId,
      vehicleId,
      mechanicId,
      problem,
      diagnosis,
      estimatedCost,
      status,
      serviceId,
      usedParts,
      odometer,
      fuelLevel,
      intakeInspection,
      customerApproval,
      approvedAmount,
    } = req.body

    const countRow = await query.get('SELECT COUNT(*) AS cnt FROM repair_orders')
    const orderNumber = `RO-2026-${String((parseInt(countRow?.cnt, 10) || 0) + 41).padStart(4, '0')}`
    const costNum = parseFloat(String(estimatedCost || '350').replace(/[^0-9.]/g, '')) || 350.00

    const inserted = await query.get(
      `INSERT INTO repair_orders (
        order_number, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis, 
        estimated_cost, status, odometer, fuel_level, intake_inspection, customer_approval, approved_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        orderNumber,
        customerId || 1,
        vehicleId || 1,
        mechanicId || null,
        problem || null,
        diagnosis || null,
        costNum,
        status || 'Pending',
        parseInt(odometer, 10) || 0,
        fuelLevel || '1/2',
        JSON.stringify(intakeInspection || {}),
        customerApproval || 'Approved',
        parseFloat(approvedAmount) || costNum,
      ]
    )

    // Trigger Auto Stock-Out for the linked service / parts
    const deductedParts = await autoStockOutForRepair(
      inserted.id,
      orderNumber,
      serviceId,
      usedParts,
      req.user?.id || null
    )

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [inserted.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [inserted.vehicle_id])

    res.status(201).json({
      data: {
        id: inserted.id,
        orderNumber,
        customer: customer?.full_name || '',
        customerId: inserted.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: inserted.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: inserted.mechanic_id,
        problem: inserted.problem_description,
        diagnosis: inserted.diagnosis,
        estimatedCost: `$${inserted.estimated_cost}`,
        status: inserted.status,
        odometer: inserted.odometer,
        fuelLevel: inserted.fuel_level,
        intakeInspection: inserted.intake_inspection,
        customerApproval: inserted.customer_approval,
        approvedAmount: inserted.approved_amount,
        createdAt: new Date().toISOString().split('T')[0],
        partsUsed: deductedParts,
      },
    })
  } catch (err) {
    console.error('[API Repair Job Create Error]:', err)
    res.status(500).json({ error: 'Failed to create repair job', message: err.message })
  }
})

// PUT update repair job (with status transitions, labor clocking, parts addition / stock-out)
router.put('/:id', requirePermission('repair_jobs', 'update'), async (req, res) => {
  try {
    const {
      status,
      diagnosis,
      actualCost,
      estimatedCost,
      mechanicId,
      notes,
      serviceId,
      usedParts,
      qaChecklist,
      laborMinutes,
      laborRate,
      customerApproval,
      approvedAmount,
      nextServiceDueDate,
      nextServiceDueKm,
    } = req.body

    const actualNum = actualCost ? parseFloat(String(actualCost).replace(/[^0-9.]/g, '')) : null
    const estNum = estimatedCost ? parseFloat(String(estimatedCost).replace(/[^0-9.]/g, '')) : null

    const updated = await query.get(
      `UPDATE repair_orders
       SET status = COALESCE($1, status),
           diagnosis = COALESCE($2, diagnosis),
           actual_cost = COALESCE($3, actual_cost),
           estimated_cost = COALESCE($4, estimated_cost),
           mechanic_id = COALESCE($5, mechanic_id),
           notes = COALESCE($6, notes),
           qa_checklist = CASE WHEN $7::text IS NOT NULL THEN $7::jsonb ELSE qa_checklist END,
           labor_minutes = COALESCE($8, labor_minutes),
           labor_rate = COALESCE($9, labor_rate),
           customer_approval = COALESCE($10, customer_approval),
           approved_amount = COALESCE($11, approved_amount),
           next_service_due_date = COALESCE($12, next_service_due_date),
           next_service_due_km = COALESCE($13, next_service_due_km),
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        status,
        diagnosis,
        actualNum,
        estNum,
        mechanicId,
        notes,
        qaChecklist ? JSON.stringify(qaChecklist) : null,
        laborMinutes !== undefined ? parseInt(laborMinutes, 10) : null,
        laborRate !== undefined ? parseFloat(laborRate) : null,
        customerApproval,
        approvedAmount !== undefined ? parseFloat(approvedAmount) : null,
        nextServiceDueDate,
        nextServiceDueKm !== undefined ? parseInt(nextServiceDueKm, 10) : null,
        req.params.id,
      ]
    )

    if (!updated) {
      return res.status(404).json({ error: 'Repair order not found' })
    }

    // If new service or parts are specified during update, auto stock-out
    if (serviceId || (Array.isArray(usedParts) && usedParts.length > 0)) {
      await autoStockOutForRepair(
        updated.id,
        updated.order_number,
        serviceId,
        usedParts,
        req.user?.id || null
      )
    }

    const customer = await query.get('SELECT full_name FROM customers WHERE id = $1', [updated.customer_id])
    const vehicle = await query.get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = $1', [updated.vehicle_id])
    const partsUsed = await query.all(
      `SELECT rp.*, sp.name, sp.part_code
       FROM repair_parts rp
       JOIN spare_parts sp ON rp.spare_part_id = sp.id
       WHERE rp.repair_order_id = $1`,
      [updated.id]
    )

    res.json({
      data: {
        id: updated.id,
        orderNumber: updated.order_number,
        customer: customer?.full_name || '',
        customerId: updated.customer_id,
        vehicle: vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '',
        vehicleId: updated.vehicle_id,
        plate: vehicle?.vehicle_number || '',
        mechanicId: updated.mechanic_id,
        problem: updated.problem_description,
        diagnosis: updated.diagnosis,
        estimatedCost: updated.estimated_cost ? `$${updated.estimated_cost}` : '',
        actualCost: updated.actual_cost ? `$${updated.actual_cost}` : '',
        status: updated.status,
        odometer: updated.odometer,
        fuelLevel: updated.fuel_level,
        intakeInspection: updated.intake_inspection,
        customerApproval: updated.customer_approval,
        approvedAmount: updated.approved_amount,
        qaChecklist: updated.qa_checklist,
        laborMinutes: updated.labor_minutes,
        laborRate: updated.labor_rate,
        nextServiceDueDate: updated.next_service_due_date,
        nextServiceDueKm: updated.next_service_due_km,
        createdAt: updated.created_at ? new Date(updated.created_at).toISOString().split('T')[0] : 'Today',
        partsUsed,
      },
    })
  } catch (err) {
    console.error('[API Repair Job Update Error]:', err)
    res.status(500).json({ error: 'Failed to update repair job', message: err.message })
  }
})

// DELETE repair job
router.delete('/:id', requirePermission('repair_jobs', 'delete'), async (req, res) => {
  try {
    const deleted = await query.get('DELETE FROM repair_orders WHERE id = $1 RETURNING id', [req.params.id])
    if (!deleted) {
      return res.status(404).json({ error: 'Repair order not found' })
    }
    res.json({ success: true, message: 'Repair order deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete repair job', message: err.message })
  }
})

export default router
