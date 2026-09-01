import { Router } from 'express'
import { query } from '../db.js'
import {
  authenticateToken,
  requirePermission,
  requireRole,
  DEFAULT_PERMISSIONS_MATRIX,
  invalidatePermissionsCache,
} from '../middleware/auth.js'

const router = Router()

// GET permissions matrix (Available for bootstrapping RBAC state)
router.get('/permissions', async (req, res) => {
  try {
    const row = await query.get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'")
    if (row && row.setting_value) {
      try {
        const matrix = JSON.parse(row.setting_value)
        return res.json({ data: matrix })
      } catch {
        // fallback
      }
    }
    res.json({ data: DEFAULT_PERMISSIONS_MATRIX })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions', message: err.message })
  }
})

// All other settings routes require a valid authenticated JWT
router.use(authenticateToken)

// GET all settings
router.get('/', requirePermission('settings', 'read'), async (req, res) => {
  try {
    const rows = await query.all('SELECT * FROM settings')

    const settingsObj = {
      shopName: 'ProTech Auto Repair Workshop',
      taxRate: 7.5,
      currency: 'USD ($)',
      businessHours: 'Mon - Sat: 08:00 AM - 06:00 PM',
      contactPhone: '+1 (555) 019-4820',
      contactEmail: 'service@protech-autorepair.com',
      address: '4582 Industrial Parkway, Suite 100, Motor City, MI',
      autoBackupDaily: true,
      permissionsMatrix: DEFAULT_PERMISSIONS_MATRIX,
    }

    rows.forEach((r) => {
      if (r.setting_key === 'shop_name' || r.setting_key === 'workshop_name') settingsObj.shopName = r.setting_value
      if (r.setting_key === 'tax_rate') settingsObj.taxRate = parseFloat(r.setting_value) || 0
      if (r.setting_key === 'currency') settingsObj.currency = r.setting_value
      if (r.setting_key === 'business_hours') settingsObj.businessHours = r.setting_value
      if (r.setting_key === 'contact_phone' || r.setting_key === 'workshop_phone') settingsObj.contactPhone = r.setting_value
      if (r.setting_key === 'contact_email' || r.setting_key === 'workshop_email') settingsObj.contactEmail = r.setting_value
      if (r.setting_key === 'address' || r.setting_key === 'workshop_address') settingsObj.address = r.setting_value
      if (r.setting_key === 'roles_permissions_matrix') {
        try {
          settingsObj.permissionsMatrix = JSON.parse(r.setting_value)
        } catch {
          // fallback to default
        }
      }
    })

    res.json({ data: settingsObj })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings', message: err.message })
  }
})

// PUT update permissions matrix (Strictly locked to Admin role only)
router.put('/permissions', requireRole('admin'), async (req, res) => {
  try {
    const rawMatrix = req.body
    if (!rawMatrix || typeof rawMatrix !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions matrix payload' })
    }

    const matrix = { ...DEFAULT_PERMISSIONS_MATRIX, ...rawMatrix }

    // Ensure admin permanently retains full control on all modules
    Object.keys(matrix).forEach((mod) => {
      if (!matrix[mod]) matrix[mod] = {}
      matrix[mod].admin = ['create', 'read', 'update', 'delete', 'export']
    })

    await query.run(
      `INSERT INTO settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
      ['roles_permissions_matrix', JSON.stringify(matrix)]
    )

    // Clear backend in-memory cache
    invalidatePermissionsCache()

    res.json({ success: true, message: 'Role permissions matrix updated successfully', data: matrix })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permissions matrix', message: err.message })
  }
})

// PUT update general settings
router.put('/', requirePermission('settings', 'update'), async (req, res) => {
  try {
    const { shopName, taxRate, currency, businessHours, contactPhone, contactEmail, address, permissionsMatrix } = req.body

    const updates = [
      ['shop_name', shopName],
      ['tax_rate', String(taxRate)],
      ['currency', currency],
      ['business_hours', businessHours],
      ['contact_phone', contactPhone],
      ['contact_email', contactEmail],
      ['address', address],
      permissionsMatrix ? ['roles_permissions_matrix', JSON.stringify(permissionsMatrix)] : null,
    ].filter(Boolean)

    for (const [k, v] of updates) {
      if (v !== undefined) {
        await query.run(
          `INSERT INTO settings (setting_key, setting_value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [k, v]
        )
      }
    }

    invalidatePermissionsCache()

    res.json({ success: true, message: 'Settings saved successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings', message: err.message })
  }
})

export default router
