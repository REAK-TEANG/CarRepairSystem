import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './db.js'

import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customers.js'
import vehicleRoutes from './routes/vehicles.js'
import appointmentRoutes from './routes/appointments.js'
import repairJobRoutes from './routes/repairJobs.js'
import inventoryRoutes from './routes/inventory.js'
import supplierRoutes from './routes/suppliers.js'
import invoiceRoutes from './routes/invoices.js'
import employeeRoutes from './routes/employees.js'
import serviceRoutes from './routes/services.js'
import mechanicRoutes from './routes/mechanics.js'
import settingRoutes from './routes/settings.js'
import reportRoutes from './routes/reports.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({ origin: '*' }))
app.use(express.json())

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`)
  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected (supabase/postgresql)', timestamp: new Date().toISOString() })
})

// Mount REST API routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/repair-jobs', repairJobRoutes)
app.use('/api/repair-orders', repairJobRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/spare-parts', inventoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/mechanics', mechanicRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/reports', reportRoutes)

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err)
  res.status(500).json({ error: 'Internal Server Error', message: err.message })
})

// Initialize DB and start server
async function startServer() {
  try {
    await initializeDatabase()
    app.listen(PORT, () => {
      console.log(`====================================================`)
      console.log(`🚗 Car Repair Backend Server running on http://localhost:${PORT}`)
      console.log(`📡 REST API Endpoints active at http://localhost:${PORT}/api/*`)
      console.log(`💾 Local PostgreSQL (pgAdmin) Database connected`)
      console.log(`====================================================`)
    })
  } catch (err) {
    console.error('Failed to start backend server:', err)
    process.exit(1)
  }
}

startServer()
