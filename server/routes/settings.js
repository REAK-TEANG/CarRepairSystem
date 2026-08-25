import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// Default fallback permissions matrix
export const DEFAULT_PERMISSIONS_MATRIX = {
  customers: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  vehicles: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  appointments: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read', 'update', 'delete'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  repair_jobs: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read', 'update'],
    mechanic: ['read', 'update'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  services: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: [],
  },
  mechanics: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: [],
    storekeeper: [],
  },
  inventory: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: [],
    storekeeper: ['create', 'read', 'update', 'delete'],
  },
  suppliers: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    service_advisor: [],
    mechanic: [],
    cashier: [],
    storekeeper: ['create', 'read', 'update', 'delete'],
  },
  invoices: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['create', 'read'],
    mechanic: [],
    cashier: ['create', 'read', 'update'],
    storekeeper: [],
  },
  employees: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update', 'delete'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  reports: {
    admin: ['read', 'export'],
    manager: ['read', 'export'],
    service_advisor: ['read'],
    mechanic: ['read'],
    cashier: ['read'],
    storekeeper: ['read'],
  },
  settings: {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['read'],
    service_advisor: [],
    mechanic: [],
    cashier: [],
    storekeeper: [],
  },
}

// GET all settings
router.get('/', async (req, res) => {
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
      permissionsMatrix: DEFAULT_PERMISSIONS_MATRIX
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
    res.status(500).json({ error: err.message })
  }
})

// GET permissions matrix
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
    res.status(500).json({ error: err.message })
  }
})

// PUT update permissions matrix
router.put('/permissions', async (req, res) => {
  try {
    const matrix = req.body
    if (!matrix || typeof matrix !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions matrix payload' })
    }

    // Ensure admin always retains full control
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

    res.json({ success: true, message: 'Role permissions matrix updated successfully', data: matrix })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update settings
router.put('/', async (req, res) => {
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
      permissionsMatrix ? ['roles_permissions_matrix', JSON.stringify(permissionsMatrix)] : null
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

    res.json({ success: true, message: 'Settings saved successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

