import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All service catalog routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all services (including linked Bill of Materials / required spare parts)
router.get('/', requirePermission('services', 'read'), async (req, res) => {
  try {
    const rows = await query.all(`
      SELECT s.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', sp.id,
                   'sparePartId', p.id,
                   'partCode', p.part_code,
                   'name', p.name,
                   'brand', p.brand,
                   'unitPrice', p.unit_price,
                   'stockQuantity', p.stock_quantity,
                   'quantity', sp.quantity
                 )
               ) FILTER (WHERE sp.id IS NOT NULL),
               '[]'
             ) AS required_parts
      FROM services s
      LEFT JOIN service_parts sp ON sp.service_id = s.id
      LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
      GROUP BY s.id
      ORDER BY s.id ASC
    `)

    const services = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: 'Maintenance',
      description: r.description || '',
      estimatedCost: parseFloat(r.estimated_cost) || 0,
      laborHours: parseFloat(r.estimated_hours) || 1.0,
      isActive: Boolean(r.is_active),
      requiredParts: Array.isArray(r.required_parts) ? r.required_parts : [],
    }))

    res.json({ data: services })
  } catch (err) {
    console.error('[API Services Fetch Error]:', err)
    res.status(500).json({ error: 'Failed to fetch services', message: err.message })
  }
})

// GET single service by ID
router.get('/:id', requirePermission('services', 'read'), async (req, res) => {
  try {
    const r = await query.get(
      `SELECT s.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', sp.id,
                    'sparePartId', p.id,
                    'partCode', p.part_code,
                    'name', p.name,
                    'brand', p.brand,
                    'unitPrice', p.unit_price,
                    'stockQuantity', p.stock_quantity,
                    'quantity', sp.quantity
                  )
                ) FILTER (WHERE sp.id IS NOT NULL),
                '[]'
              ) AS required_parts
       FROM services s
       LEFT JOIN service_parts sp ON sp.service_id = s.id
       LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [req.params.id]
    )

    if (!r) {
      return res.status(404).json({ error: 'Service not found' })
    }

    res.json({
      data: {
        id: r.id,
        name: r.name,
        category: 'Maintenance',
        description: r.description || '',
        estimatedCost: parseFloat(r.estimated_cost) || 0,
        laborHours: parseFloat(r.estimated_hours) || 1.0,
        isActive: Boolean(r.is_active),
        requiredParts: Array.isArray(r.required_parts) ? r.required_parts : [],
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service', message: err.message })
  }
})

// POST create service (with optional required spare parts / BOM)
router.post('/', requirePermission('services', 'create'), async (req, res) => {
  try {
    const { name, description, estimatedCost, laborHours, isActive, requiredParts } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Service name is required' })
    }

    const inserted = await query.get(
      `INSERT INTO services (name, description, estimated_cost, estimated_hours, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name.trim(),
        description || null,
        parseFloat(estimatedCost) || 0,
        parseFloat(laborHours) || 1.0,
        isActive !== false,
      ]
    )

    const savedParts = []
    if (Array.isArray(requiredParts) && requiredParts.length > 0) {
      for (const item of requiredParts) {
        const sparePartId = item.sparePartId || item.id
        const qty = parseInt(item.quantity, 10) || 1
        if (sparePartId) {
          await query.run(
            `INSERT INTO service_parts (service_id, spare_part_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (service_id, spare_part_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
            [inserted.id, sparePartId, qty]
          )
        }
      }

      const pRows = await query.all(
        `SELECT sp.id, sp.quantity, p.id AS "sparePartId", p.part_code AS "partCode", p.name, p.brand, p.unit_price AS "unitPrice", p.stock_quantity AS "stockQuantity"
         FROM service_parts sp
         JOIN spare_parts p ON sp.spare_part_id = p.id
         WHERE sp.service_id = $1`,
        [inserted.id]
      )
      savedParts.push(...pRows)
    }

    res.status(201).json({
      data: {
        id: inserted.id,
        name: inserted.name,
        category: 'Maintenance',
        description: inserted.description || '',
        estimatedCost: parseFloat(inserted.estimated_cost) || 0,
        laborHours: parseFloat(inserted.estimated_hours) || 1.0,
        isActive: Boolean(inserted.is_active),
        requiredParts: savedParts,
      },
    })
  } catch (err) {
    console.error('[API Service Create Error]:', err)
    res.status(500).json({ error: 'Failed to create service', message: err.message })
  }
})

// PUT update service (and synchronize required parts)
router.put('/:id', requirePermission('services', 'update'), async (req, res) => {
  try {
    const { name, description, estimatedCost, laborHours, isActive, requiredParts } = req.body

    const updated = await query.get(
      `UPDATE services
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           estimated_cost = COALESCE($3, estimated_cost),
           estimated_hours = COALESCE($4, estimated_hours),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        name,
        description,
        estimatedCost !== undefined ? parseFloat(estimatedCost) : null,
        laborHours !== undefined ? parseFloat(laborHours) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        req.params.id,
      ]
    )

    if (!updated) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (Array.isArray(requiredParts)) {
      // Sync service parts
      await query.run('DELETE FROM service_parts WHERE service_id = $1', [updated.id])
      for (const item of requiredParts) {
        const sparePartId = item.sparePartId || item.id
        const qty = parseInt(item.quantity, 10) || 1
        if (sparePartId) {
          await query.run(
            `INSERT INTO service_parts (service_id, spare_part_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (service_id, spare_part_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
            [updated.id, sparePartId, qty]
          )
        }
      }
    }

    const pRows = await query.all(
      `SELECT sp.id, sp.quantity, p.id AS "sparePartId", p.part_code AS "partCode", p.name, p.brand, p.unit_price AS "unitPrice", p.stock_quantity AS "stockQuantity"
       FROM service_parts sp
       JOIN spare_parts p ON sp.spare_part_id = p.id
       WHERE sp.service_id = $1`,
      [updated.id]
    )

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        category: 'Maintenance',
        description: updated.description || '',
        estimatedCost: parseFloat(updated.estimated_cost) || 0,
        laborHours: parseFloat(updated.estimated_hours) || 1.0,
        isActive: Boolean(updated.is_active),
        requiredParts: pRows,
      },
    })
  } catch (err) {
    console.error('[API Service Update Error]:', err)
    res.status(500).json({ error: 'Failed to update service', message: err.message })
  }
})

// DELETE service
router.delete('/:id', requirePermission('services', 'delete'), async (req, res) => {
  try {
    const exists = await query.get('SELECT id FROM services WHERE id = $1', [req.params.id])
    if (!exists) {
      return res.status(404).json({ error: 'Service not found' })
    }

    await query.run('DELETE FROM services WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Service removed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service', message: err.message })
  }
})

export default router
