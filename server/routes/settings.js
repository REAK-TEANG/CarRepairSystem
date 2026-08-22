import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

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
      autoBackupDaily: true
    }

    rows.forEach((r) => {
      if (r.setting_key === 'shop_name' || r.setting_key === 'workshop_name') settingsObj.shopName = r.setting_value
      if (r.setting_key === 'tax_rate') settingsObj.taxRate = parseFloat(r.setting_value) || 0
      if (r.setting_key === 'currency') settingsObj.currency = r.setting_value
      if (r.setting_key === 'business_hours') settingsObj.businessHours = r.setting_value
      if (r.setting_key === 'contact_phone' || r.setting_key === 'workshop_phone') settingsObj.contactPhone = r.setting_value
      if (r.setting_key === 'contact_email' || r.setting_key === 'workshop_email') settingsObj.contactEmail = r.setting_value
      if (r.setting_key === 'address' || r.setting_key === 'workshop_address') settingsObj.address = r.setting_value
    })

    res.json({ data: settingsObj })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const { shopName, taxRate, currency, businessHours, contactPhone, contactEmail, address } = req.body

    const updates = [
      ['shop_name', shopName],
      ['tax_rate', String(taxRate)],
      ['currency', currency],
      ['business_hours', businessHours],
      ['contact_phone', contactPhone],
      ['contact_email', contactEmail],
      ['address', address]
    ]

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
