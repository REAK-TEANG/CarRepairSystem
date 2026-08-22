import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// GET reports overview & analytics
router.get('/', async (req, res) => {
  try {
    const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })
    const { count: vehCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true })
    const { count: jobCount } = await supabase.from('repair_orders').select('*', { count: 'exact', head: true })
    const { count: completedJobCount } = await supabase.from('repair_orders').select('*', { count: 'exact', head: true }).eq('status', 'Completed')
    const { count: partCount } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true })

    // Get invoice totals
    const { data: invRows } = await supabase.from('invoices').select('amount, paid_amount')
    const totalInvoiced = (invRows || []).reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalCollected = (invRows || []).reduce((sum, r) => sum + (r.paid_amount || 0), 0)

    // Get total stock units
    const { data: partRows } = await supabase.from('spare_parts').select('stock_quantity')
    const totalStockUnits = (partRows || []).reduce((sum, r) => sum + (r.stock_quantity || 0), 0)

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
          totalCustomers: custCount || 0,
          totalVehicles: vehCount || 0,
          totalRepairJobs: jobCount || 0,
          completedRepairs: completedJobCount || 0,
          totalRevenue: totalInvoiced,
          totalCollected: totalCollected,
          totalSpareParts: partCount || 0,
          totalStockUnits: totalStockUnits
        }
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
