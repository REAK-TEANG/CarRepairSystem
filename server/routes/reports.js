import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// GET reports overview & analytics
router.get('/', async (req, res) => {
  try {
    const custCount = await query.get('SELECT COUNT(*) as cnt FROM customers')
    const vehCount = await query.get('SELECT COUNT(*) as cnt FROM vehicles')
    const jobCount = await query.get('SELECT COUNT(*) as cnt FROM repair_orders')
    const completedJobCount = await query.get('SELECT COUNT(*) as cnt FROM repair_orders WHERE status = "Completed"')
    const invStats = await query.get('SELECT SUM(amount) as totalInvoiced, SUM(paid_amount) as totalCollected FROM invoices')
    const partCount = await query.get('SELECT COUNT(*) as cnt, SUM(stock_quantity) as totalUnits FROM spare_parts')

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
          totalCustomers: custCount?.cnt || 0,
          totalVehicles: vehCount?.cnt || 0,
          totalRepairJobs: jobCount?.cnt || 0,
          completedRepairs: completedJobCount?.cnt || 0,
          totalRevenue: invStats?.totalInvoiced || 0,
          totalCollected: invStats?.totalCollected || 0,
          totalSpareParts: partCount?.cnt || 0,
          totalStockUnits: partCount?.totalUnits || 0
        }
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
