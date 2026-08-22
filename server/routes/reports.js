import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET reports overview & analytics
router.get('/', async (req, res) => {
  try {
    const custCount = await query.get('SELECT COUNT(*) AS cnt FROM customers')
    const vehCount = await query.get('SELECT COUNT(*) AS cnt FROM vehicles')
    const jobCount = await query.get('SELECT COUNT(*) AS cnt FROM repair_orders')
    const completedJobCount = await query.get("SELECT COUNT(*) AS cnt FROM repair_orders WHERE status = 'Completed'")
    const invStats = await query.get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices')
    const partStats = await query.get('SELECT COUNT(*) AS cnt, COALESCE(SUM(stock_quantity), 0) AS total_units FROM spare_parts')

    const reportsList = [
      { id: 1, title: 'Monthly Revenue & Profit Breakdown', category: 'Financial', date: 'August 2026', format: 'PDF / Excel' },
      { id: 2, title: 'Mechanic Workload & Efficiency Report', category: 'Operations', date: 'August 2026', format: 'PDF' },
      { id: 3, title: 'Spare Parts Inventory Valuation & Stock Turnover', category: 'Inventory', date: 'Q3 2026', format: 'Excel' },
      { id: 4, title: 'Customer Retention & Lifetime Value Analysis', category: 'Marketing', date: '2026 YTD', format: 'PDF' },
      { id: 5, title: 'Vehicle Service History & Warranty Summary', category: 'Service', date: 'Past 12 Months', format: 'PDF / Excel' }
    ]

    res.json({
      data: {
        reports: reportsList,
        metrics: {
          totalCustomers: parseInt(custCount?.cnt, 10) || 0,
          totalVehicles: parseInt(vehCount?.cnt, 10) || 0,
          totalRepairJobs: parseInt(jobCount?.cnt, 10) || 0,
          completedRepairs: parseInt(completedJobCount?.cnt, 10) || 0,
          totalRevenue: parseFloat(invStats?.total_invoiced) || 0,
          totalCollected: parseFloat(invStats?.total_collected) || 0,
          totalSpareParts: parseInt(partStats?.cnt, 10) || 0,
          totalStockUnits: parseInt(partStats?.total_units, 10) || 0
        }
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
