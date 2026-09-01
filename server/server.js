import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initializeDatabase, query } from './db.js'

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
import serviceReminderRoutes from './routes/serviceReminders.js'

const app = express()
const PORT = process.env.PORT || 5000

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows cross-origin assets (e.g. avatars, images)
    contentSecurityPolicy: false, // Disabled on API backend to prevent frontend script interference
  })
)

// 2. CORS Whitelist Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true)
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  })
)

// 3. Body parsers with payload size limits to prevent Denial of Service (DoS)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 4. Rate Limiting Protection
// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Max 2000 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP. Please try again later.',
  },
})

// Stricter rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyLoginAttempts',
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
})

app.use('/api/', generalLimiter)
app.use('/api/auth/login', authLimiter)

// Request logger for audit trail
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[API Audit] ${timestamp} | ${req.method} ${req.originalUrl} | IP: ${req.ip}`)
  next()
})

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚗 Car Repair Management Backend API is running successfully!',
    status: 'online',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  })
})

// Health check endpoint with live DB ping
app.get('/api/health', async (req, res) => {
  const start = Date.now()
  try {
    const ping = await query.get('SELECT NOW() as server_time, current_database() as db_name')
    res.json({
      status: 'ok',
      database: 'connected (PostgreSQL / pgAdmin)',
      databaseName: ping?.db_name || 'carrepair',
      latencyMs: Date.now() - start,
      serverTime: ping?.server_time,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    })
  }
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
app.use('/api/service-reminders', serviceReminderRoutes)

// Fallback 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Route not found: ${req.method} ${req.url}` })
})

// Centralized error handler (prevents leaking stack traces in production)
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack || err.message || err)
  const isDev = process.env.NODE_ENV !== 'production'
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected server error occurred.',
  })
})

// Initialize DB and start server
async function startServer() {
  try {
    await initializeDatabase()
    const server = app.listen(PORT, () => {
      console.log(`====================================================`)
      console.log(`🚗 Car Repair Backend Server running on http://localhost:${PORT}`)
      console.log(`📡 REST API Endpoints active at http://localhost:${PORT}/api/*`)
      console.log(`🛡️  Security enabled: Helmet, Rate-limiting, JWT & Dynamic RBAC`)
      console.log(`💾 PostgreSQL Database connected`)
      console.log(`====================================================`)
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  [Port Conflict] Port ${PORT} is already in use by another running instance.`)
        console.error(`   To free port ${PORT} in PowerShell, run:`)
        console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`)
      } else {
        console.error('Server error:', err)
      }
      process.exit(1)
    })
  } catch (err) {
    console.error('Failed to start backend server:', err)
    if (!process.env.VERCEL) {
      process.exit(1)
    }
  }
}

// Start standalone server unless running in serverless environment (like Vercel)
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer()
} else {
  // Lazily connect DB in serverless mode
  initializeDatabase().catch((err) => console.error('Serverless DB init error:', err))
}

export default app

