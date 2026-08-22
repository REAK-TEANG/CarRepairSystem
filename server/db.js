import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.resolve(__dirname, '../database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.resolve(dbDir, 'carrepair.db')
const sqlite = sqlite3.verbose()
const db = new sqlite.Database(dbPath)

// Promisified helper functions
export const query = {
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  }),
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  }),
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  }),
  exec: (sql) => new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function initializeDatabase() {
  console.log(`[DB] Initializing SQLite database at: ${dbPath}`)

  await query.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role_id INTEGER NOT NULL REFERENCES roles(id),
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      employee_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      position TEXT,
      department TEXT DEFAULT 'Workshop',
      specialization TEXT,
      experience_years INTEGER DEFAULT 0,
      phone TEXT,
      email TEXT,
      hire_date DATE,
      salary TEXT DEFAULT '$3,500/mo',
      attendance_today TEXT DEFAULT 'Present',
      employment_status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      avatar_url TEXT,
      total_spent TEXT DEFAULT '$0.00',
      registration_date DATE DEFAULT (DATE('now')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      vehicle_number TEXT NOT NULL UNIQUE,
      vin TEXT,
      brand TEXT,
      model TEXT,
      year INTEGER,
      color TEXT,
      engine_number TEXT,
      fuel_type TEXT DEFAULT 'Gasoline',
      mileage INTEGER DEFAULT 0,
      owner TEXT,
      photo_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Maintenance',
      description TEXT,
      estimated_cost REAL DEFAULT 0.00,
      estimated_hours REAL DEFAULT 1.0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mechanics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mechanic_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      specialization TEXT,
      experience_years INTEGER DEFAULT 5,
      rating REAL DEFAULT 4.9,
      active_jobs INTEGER DEFAULT 0,
      completed_jobs INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_code TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id),
      customer TEXT,
      vehicle_id INTEGER REFERENCES vehicles(id),
      vehicle TEXT,
      plate TEXT,
      mechanic_id INTEGER REFERENCES mechanics(id),
      mechanic TEXT,
      service TEXT,
      scheduled_date DATE NOT NULL,
      scheduled_time TEXT,
      status TEXT DEFAULT 'Scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repair_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id),
      customer TEXT,
      vehicle_id INTEGER REFERENCES vehicles(id),
      vehicle TEXT,
      plate TEXT,
      mechanic_id INTEGER REFERENCES mechanics(id),
      mechanic TEXT,
      problem_description TEXT,
      diagnosis TEXT,
      estimated_cost TEXT DEFAULT '$350',
      actual_cost TEXT,
      status TEXT DEFAULT 'Pending',
      started_at DATETIME,
      completed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      categories TEXT,
      rating REAL DEFAULT 4.8,
      active_orders INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      brand TEXT,
      unit_price REAL DEFAULT 0.00,
      stock_quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      supplier TEXT,
      location TEXT,
      status TEXT DEFAULT 'In Stock',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spare_part_id INTEGER NOT NULL REFERENCES spare_parts(id),
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      repair_order_id INTEGER REFERENCES repair_orders(id),
      order_number TEXT,
      customer_id INTEGER REFERENCES customers(id),
      customer TEXT,
      amount REAL DEFAULT 0.00,
      paid_amount REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Issued',
      payment_method TEXT DEFAULT 'Credit Card',
      issue_date DATE DEFAULT (DATE('now')),
      due_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT,
      category TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await seedDatabaseIfEmpty()
}

async function seedDatabaseIfEmpty() {
  const roleCount = await query.get('SELECT COUNT(*) as cnt FROM roles')
  if (roleCount.cnt === 0) {
    console.log('[DB] Seeding roles...')
    const roles = [
      ['admin', 'Full system access and configuration'],
      ['manager', 'Manage operations, employees, and reports'],
      ['service_advisor', 'Handle customers, appointments, and repair orders'],
      ['mechanic', 'View and update assigned repair jobs'],
      ['cashier', 'Manage invoices and payments'],
      ['storekeeper', 'Manage spare parts inventory and suppliers']
    ]
    for (const r of roles) {
      await query.run('INSERT INTO roles (name, description) VALUES (?, ?)', r)
    }
  }

  const custCount = await query.get('SELECT COUNT(*) as cnt FROM customers')
  if (custCount.cnt === 0) {
    console.log('[DB] Seeding initial mock data to real SQLite tables...')

    // Seed Customers
    const customers = [
      ['CUST-001', 'Alex Morgan', '(555) 234-5678', 'alex.m@example.com', '124 Maple Dr, Tech City', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '$4,280.00'],
      ['CUST-002', 'Sarah Jenkins', '(555) 876-5432', 'sarah.j@example.com', '789 Oak Ave, Springfield', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '$1,890.50'],
      ['CUST-003', 'David Chen', '(555) 345-6789', 'd.chen@example.com', '45 Pine St, Metropolis', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '$6,420.00'],
      ['CUST-004', 'Emily Watson', '(555) 987-6543', 'emily.w@example.com', '321 Elm Blvd, Riverdale', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '$950.00'],
      ['CUST-005', 'Marcus Vance', '(555) 456-7890', 'm.vance@example.com', '56 Cedar Ln, Gotham', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '$3,100.00']
    ]
    for (const c of customers) {
      await query.run(
        'INSERT INTO customers (customer_code, full_name, phone, email, address, avatar_url, total_spent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        c
      )
    }

    // Seed Vehicles
    const vehicles = [
      [1, 'ABC-1234', '1HGCR2F83HA001234', 'Toyota', 'Camry', 2022, 'Midnight Blue', 'Gasoline', 34500, 'Alex Morgan'],
      [2, 'XYZ-5678', 'WBA3A5C58DF105678', 'BMW', '330i', 2021, 'Alpine White', 'Gasoline', 28000, 'Sarah Jenkins'],
      [3, 'DEF-9012', '1FADP5CU8GA009012', 'Ford', 'F-150', 2020, 'Shadow Black', 'Gasoline', 62000, 'David Chen'],
      [4, 'GHI-3456', 'JH4CU2F68CC003456', 'Honda', 'Civic', 2023, 'Sonic Gray', 'Gasoline', 15200, 'Emily Watson'],
      [5, 'JKL-7890', 'WAUZZZF27HA007890', 'Audi', 'A4', 2022, 'Ibis White', 'Gasoline', 24100, 'Marcus Vance']
    ]
    for (const v of vehicles) {
      await query.run(
        'INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        v
      )
    }

    // Seed Services
    const services = [
      ['Full Synthetic Oil & Filter Service', 'Maintenance', 'Drain and refill with premium synthetic motor oil, replace OEM oil filter.', 89.99, 1.0],
      ['Front & Rear Brake Pad Replacement', 'Brakes', 'Install premium ceramic brake pads and inspect brake calipers & rotors.', 249.99, 2.5],
      ['Comprehensive Multi-Point Inspection', 'Diagnostics', 'Inspection of engine, transmission, steering, suspension, fluids, and battery.', 59.99, 1.0],
      ['Wheel Alignment & Balancing', 'Tires', 'Computerized 4-wheel alignment and high-speed tire balancing.', 119.99, 1.5],
      ['Transmission Fluid Flush & Service', 'Transmission', 'Complete transmission fluid replacement and filter overhaul.', 289.99, 2.0],
      ['Air Conditioning System Recharge', 'Electrical', 'Refrigerant evac and recharge with leak check diagnosis.', 169.99, 1.5]
    ]
    for (const s of services) {
      await query.run(
        'INSERT INTO services (name, category, description, estimated_cost, estimated_hours) VALUES (?, ?, ?, ?, ?)',
        s
      )
    }

    // Seed Mechanics
    const mechanics = [
      ['MEC-01', 'Jordan Hayes', '(555) 111-2233', 'jordan.h@workshop.com', 'Engine & Transmission', 8, 4.9, 2, 142],
      ['MEC-02', 'Elena Rostova', '(555) 222-3344', 'elena.r@workshop.com', 'Electrical & Diagnostics', 6, 4.8, 1, 98],
      ['MEC-03', 'Carlos Mendez', '(555) 333-4455', 'carlos.m@workshop.com', 'Brakes & Suspension', 10, 5.0, 3, 215],
      ['MEC-04', 'Liam Vance', '(555) 444-5566', 'liam.v@workshop.com', 'General Maintenance & Fluids', 4, 4.7, 1, 76]
    ]
    for (const m of mechanics) {
      await query.run(
        'INSERT INTO mechanics (mechanic_code, name, phone, email, specialization, experience_years, rating, active_jobs, completed_jobs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        m
      )
    }

    // Seed Suppliers
    const suppliers = [
      ['AutoParts Direct', 'Rachel Green', '(555) 777-8899', 'orders@autopartsdirect.com', '100 Industrial Blvd, Detroit', 'Brakes, Filters, Belts', 4.9, 2],
      ['Global Lubricants Corp', 'Tom Hardy', '(555) 888-9900', 'sales@globallube.com', '45 Refinery Way, Houston', 'Engine Oil, Transmission Fluids', 4.8, 1],
      ['Brembo OEM Supply', 'Marco Rossi', '(555) 999-0011', 'northamerica@brembo-supply.com', '88 Performance Way, Los Angeles', 'Brake Pads, Calipers, Rotors', 5.0, 3]
    ]
    for (const sup of suppliers) {
      await query.run(
        'INSERT INTO suppliers (name, contact_person, phone, email, address, categories, rating, active_orders) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        sup
      )
    }

    // Seed Spare Parts
    const parts = [
      ['BP-7821', 'Ceramic Front Brake Pads', 'Brakes', 'Brembo', 64.99, 24, 8, 3, 'Brembo OEM Supply', 'Shelf A-01', 'In Stock'],
      ['OF-1044', 'Synthetic Oil Filter Cartridge', 'Filters', 'Mobil 1', 12.50, 48, 15, 1, 'AutoParts Direct', 'Shelf B-03', 'In Stock'],
      ['SP-9920', 'Iridium Spark Plug Set (x4)', 'Ignition', 'NGK', 45.00, 3, 10, 1, 'AutoParts Direct', 'Shelf C-02', 'Low Stock'],
      ['FL-5020', 'Full Synthetic 5W-30 (5 Quart)', 'Fluids', 'Mobil 1', 38.99, 18, 10, 2, 'Global Lubricants Corp', 'Rack D-01', 'In Stock'],
      ['BR-3321', 'Vented Brake Rotors (Pair)', 'Brakes', 'Brembo', 145.00, 6, 6, 3, 'Brembo OEM Supply', 'Shelf A-04', 'In Stock']
    ]
    for (const p of parts) {
      await query.run(
        'INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, supplier, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      )
    }

    // Seed Appointments
    const appointments = [
      ['APT-2026-001', 1, 'Alex Morgan', 1, 'Toyota Camry', 'ABC-1234', 1, 'Jordan Hayes', 'Full Synthetic Oil & Filter Service', '2026-08-23', '09:00', 'Confirmed', 'Customer requested multi-point inspection.'],
      ['APT-2026-002', 2, 'Sarah Jenkins', 2, 'BMW 330i', 'XYZ-5678', 3, 'Carlos Mendez', 'Front & Rear Brake Pad Replacement', '2026-08-23', '11:00', 'Scheduled', 'Squeaking sound when slowing down.'],
      ['APT-2026-003', 3, 'David Chen', 3, 'Ford F-150', 'DEF-9012', 2, 'Elena Rostova', 'Air Conditioning System Recharge', '2026-08-24', '14:00', 'Scheduled', 'AC blowing warm air.'],
      ['APT-2026-004', 4, 'Emily Watson', 4, 'Honda Civic', 'GHI-3456', 4, 'Liam Vance', 'Wheel Alignment & Balancing', '2026-08-25', '10:30', 'Confirmed', 'Vehicle pulling to the right.']
    ]
    for (const a of appointments) {
      await query.run(
        'INSERT INTO appointments (appointment_code, customer_id, customer, vehicle_id, vehicle, plate, mechanic_id, mechanic, service, scheduled_date, scheduled_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        a
      )
    }

    // Seed Repair Orders
    const orders = [
      ['RO-2026-0041', 1, 'Alex Morgan', 1, 'Toyota Camry', 'ABC-1234', 1, 'Jordan Hayes', 'Engine knocking at idle', 'Diagnosed: Worn serpentine belt tensioner and misfire in cylinder 2.', '$420.00', '', 'Repairing'],
      ['RO-2026-0042', 2, 'Sarah Jenkins', 2, 'BMW 330i', 'XYZ-5678', 3, 'Carlos Mendez', 'Brake squeal and vibration', 'Diagnosed: Front rotors warped, pads worn to 2mm.', '$380.00', '', 'Waiting for Parts'],
      ['RO-2026-0043', 3, 'David Chen', 3, 'Ford F-150', 'DEF-9012', 2, 'Elena Rostova', 'Transmission slips between 2nd and 3rd gear', 'Diagnosed: Low fluid level and solenoid circuit fault.', '$650.00', '', 'Diagnosing'],
      ['RO-2026-0044', 4, 'Emily Watson', 4, 'Honda Civic', 'GHI-3456', 4, 'Liam Vance', 'Check engine light code P0420', 'Diagnosed: Downstream O2 sensor faulty.', '$220.00', '$220.00', 'Completed']
    ]
    for (const ro of orders) {
      await query.run(
        'INSERT INTO repair_orders (order_number, customer_id, customer, vehicle_id, vehicle, plate, mechanic_id, mechanic, problem_description, diagnosis, estimated_cost, actual_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ro
      )
    }

    // Seed Invoices
    const invoices = [
      ['INV-2026-001', 1, 'RO-2026-0041', 1, 'Alex Morgan', 420.00, 0.00, 'Issued', 'Credit Card', '2026-08-22', '2026-08-29'],
      ['INV-2026-002', 2, 'RO-2026-0042', 2, 'Sarah Jenkins', 380.00, 380.00, 'Paid', 'Credit Card', '2026-08-20', '2026-08-27'],
      ['INV-2026-003', 3, 'RO-2026-0043', 3, 'David Chen', 650.00, 300.00, 'Partially Paid', 'Bank Transfer', '2026-08-21', '2026-08-28'],
      ['INV-2026-004', 4, 'RO-2026-0044', 4, 'Emily Watson', 220.00, 220.00, 'Paid', 'Cash', '2026-08-19', '2026-08-26']
    ]
    for (const inv of invoices) {
      await query.run(
        'INSERT INTO invoices (invoice_number, repair_order_id, order_number, customer_id, customer, amount, paid_amount, status, payment_method, issue_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        inv
      )
    }

    // Seed Employees
    const employees = [
      ['EMP-001', 'Daniel Craig', 'Workshop Manager', 'Management', '(555) 019-2001', 'daniel.c@workshop.com', '$5,800/mo', 'Present', 'Active'],
      ['EMP-002', 'Kate Morrison', 'Service Advisor', 'Front Desk', '(555) 019-2002', 'kate.m@workshop.com', '$4,200/mo', 'Present', 'Active'],
      ['EMP-003', 'Jordan Hayes', 'Master Technician', 'Workshop', '(555) 111-2233', 'jordan.h@workshop.com', '$4,500/mo', 'Present', 'Active'],
      ['EMP-004', 'Elena Rostova', 'Diagnostic Specialist', 'Workshop', '(555) 222-3344', 'elena.r@workshop.com', '$4,400/mo', 'Present', 'Active'],
      ['EMP-005', 'Carlos Mendez', 'Brake & Chassis Specialist', 'Workshop', '(555) 333-4455', 'carlos.m@workshop.com', '$4,300/mo', 'Present', 'Active'],
      ['EMP-006', 'Liam Vance', 'Junior Technician', 'Workshop', '(555) 444-5566', 'liam.v@workshop.com', '$3,200/mo', 'On Leave', 'Active']
    ]
    for (const emp of employees) {
      await query.run(
        'INSERT INTO employees (employee_code, name, position, department, phone, email, salary, attendance_today, employment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        emp
      )
    }

    // Seed Settings
    const settings = [
      ['shop_name', 'ProTech Auto Repair Workshop', 'General', 'Workshop display name'],
      ['tax_rate', '7.5', 'Finance', 'Default sales and labor tax rate'],
      ['currency', 'USD ($)', 'Finance', 'Currency symbol and code'],
      ['business_hours', 'Mon - Sat: 08:00 AM - 06:00 PM', 'General', 'Operating hours'],
      ['contact_phone', '+1 (555) 019-4820', 'General', 'Public customer support phone'],
      ['contact_email', 'service@protech-autorepair.com', 'General', 'Support and booking email'],
      ['address', '4582 Industrial Parkway, Suite 100, Motor City, MI', 'General', 'Physical workshop address']
    ]
    for (const s of settings) {
      await query.run(
        'INSERT INTO settings (setting_key, setting_value, category, description) VALUES (?, ?, ?, ?)',
        s
      )
    }

    console.log('[DB] Database seeded successfully with full initial dataset!')
  }
}

export default db
