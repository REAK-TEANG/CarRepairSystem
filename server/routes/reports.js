import { Router } from 'express'
import { query } from '../db.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = Router()

// All reports and metrics routes require a valid authenticated JWT
router.use(authenticateToken)

// GET reports overview & analytics
router.get('/', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const custCount = await query.get('SELECT COUNT(*) AS cnt FROM customers')
    const vehCount = await query.get('SELECT COUNT(*) AS cnt FROM vehicles')
    const jobCount = await query.get('SELECT COUNT(*) AS cnt FROM repair_orders')
    const completedJobCount = await query.get("SELECT COUNT(*) AS cnt FROM repair_orders WHERE status = 'Completed'")
    const invStats = await query.get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices')
    const partStats = await query.get('SELECT COUNT(*) AS cnt, COALESCE(SUM(stock_quantity), 0) AS total_units FROM spare_parts')
    const empStats = await query.get('SELECT COUNT(*) AS total_staff FROM employees')

    const currentYear = new Date().getFullYear()
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

    const reportsList = [
      { id: 1, title: 'Monthly Revenue & Profit Breakdown', category: 'Financial', date: currentMonthName, format: 'PDF / Excel' },
      { id: 2, title: 'Mechanic Workload & Efficiency Report', category: 'Operations', date: currentMonthName, format: 'PDF' },
      { id: 3, title: 'Spare Parts Inventory Valuation & Stock Turnover', category: 'Inventory', date: `Q3 ${currentYear}`, format: 'Excel' },
      { id: 4, title: 'Customer Retention & Lifetime Value Analysis', category: 'Marketing', date: `${currentYear} YTD`, format: 'PDF' },
      { id: 5, title: 'Vehicle Service History & Warranty Summary', category: 'Service', date: 'Past 12 Months', format: 'PDF / Excel' },
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
          totalStockUnits: parseInt(partStats?.total_units, 10) || 0,
          totalEmployees: parseInt(empStats?.total_staff, 10) || 0,
        },
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate reports', message: err.message })
  }
})

// GET live dashboard metrics (supports /dashboard and /dashboard-metrics)
router.get(['/dashboard', '/dashboard-metrics'], async (req, res) => {
  try {
    const invStats = await query.get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices')
    const jobStats = await query.get("SELECT COUNT(*) AS total_jobs, COUNT(*) FILTER (WHERE status = 'Completed') AS completed_jobs FROM repair_orders")
    const custStats = await query.get('SELECT COUNT(*) AS total_customers FROM customers')

    const totalRev = parseFloat(invStats?.total_invoiced) || 0
    const totalColl = parseFloat(invStats?.total_collected) || 0
    const totalJobs = parseInt(jobStats?.total_jobs, 10) || 0
    const completedJobs = parseInt(jobStats?.completed_jobs, 10) || 0
    const totalCust = parseInt(custStats?.total_customers, 10) || 0

    res.json({
      data: {
        netRevenue: `$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalCollected: `$${totalColl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        activeOrders: totalJobs - completedJobs,
        totalCustomers: totalCust,
        completedRate: totalJobs > 0 ? `${Math.round((completedJobs / totalJobs) * 100)}%` : '100%',
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard metrics', message: err.message })
  }
})

export default router
