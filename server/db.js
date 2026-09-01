import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const { Pool } = pg;

const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1'));

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'car_repair_db',
        user: process.env.DB_USER || 'postgres',
        password: String(process.env.DB_PASSWORD || 'postgres'),
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

// Helper functions for easy querying
export const query = {
  all: async (text, params = []) => {
    const res = await pool.query(text, params);
    return res.rows;
  },
  get: async (text, params = []) => {
    const res = await pool.query(text, params);
    return res.rows[0] || null;
  },
  run: async (text, params = []) => {
    const res = await pool.query(text, params);
    return {
      rowCount: res.rowCount,
      rows: res.rows,
      lastID: res.rows[0]?.id || null,
    };
  },
  exec: async (text) => {
    return await pool.query(text);
  },
};

export async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'car_repair_db';
  console.log(`[DB] Connecting to PostgreSQL database '${dbName}' on ${host}...`);

  try {
    const client = await pool.connect();
    console.log(`[DB] Successfully connected to PostgreSQL (pgAdmin).`);

    // Check if tables exist, if not execute schema_supabase.sql
    const checkTable = await client.query(`
      SELECT to_regclass('public.customers') AS exists;
    `);

    if (!checkTable.rows[0]?.exists) {
      console.log(`[DB] Tables not found. Initializing schema from schema_supabase.sql...`);
      const schemaPath = path.resolve(__dirname, '../database/schema_supabase.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(sql);
        console.log(`[DB] Database schema and initial seed data created successfully!`);
      }
    } else {
      console.log(`[DB] PostgreSQL database tables verified.`);
      // Ensure photo_url column exists and is TEXT in vehicles table
      try {
        await client.query(`
          ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT;
          ALTER TABLE vehicles ALTER COLUMN photo_url TYPE TEXT;
        `);
      } catch (err) {
        console.log(`[DB] Note: Could not auto-migrate photo_url on vehicles table: ${err.message}`);
      }
      
      // Ensure photo_url column exists and is TEXT in employees table
      try {
        await client.query(`
          ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
          ALTER TABLE employees ALTER COLUMN photo_url TYPE TEXT;
        `);
      } catch (err) {
        console.log(`[DB] Note: Could not auto-migrate photo_url on employees table: ${err.message}`);
      }

      // Ensure photo_url column exists and is TEXT in spare_parts table
      try {
        await client.query(`
          ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;
          ALTER TABLE spare_parts ALTER COLUMN photo_url TYPE TEXT;
        `);
      } catch (err) {
        console.log(`[DB] Note: Could not auto-migrate photo_url on spare_parts table: ${err.message}`);
      }

      // Ensure reset_token and reset_expires_at columns exist in users table for forgot password
      try {
        await client.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP;
        `);
      } catch (err) {
        console.log(`[DB] Note: Could not auto-migrate reset_token on users table: ${err.message}`);
      }

      // Ensure service_parts (Bill of Materials) table exists for auto stock-out
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS service_parts (
            id SERIAL PRIMARY KEY,
            service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            spare_part_id INT NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(service_id, spare_part_id)
          );
        `);

        const spCount = await client.query('SELECT COUNT(*) AS cnt FROM service_parts');
        if (parseInt(spCount.rows[0]?.cnt, 10) === 0) {
          await client.query(`
            INSERT INTO service_parts (service_id, spare_part_id, quantity)
            SELECT s.id, p.id, CASE WHEN p.part_code = 'AC-134A' THEN 2 ELSE 1 END
            FROM services s, spare_parts p 
            WHERE (s.name ILIKE '%Oil%' AND p.part_code IN ('OF-1044', 'FL-5020'))
               OR (s.name ILIKE '%Brake%' AND p.part_code IN ('BP-7821', 'BR-3321'))
               OR (s.name ILIKE '%Battery%' AND p.part_code = 'BT-1200')
               OR (s.name ILIKE '%Air Conditioning%' AND p.part_code = 'AC-134A')
               OR (s.name ILIKE '%Tune%' AND p.part_code IN ('SP-9920', 'AF-2088'))
            ON CONFLICT (service_id, spare_part_id) DO NOTHING;
          `);
        }
      } catch (err) {
        console.log(`[DB] Note on service_parts table migration: ${err.message}`);
      }

      // Ensure extended repair_orders columns exist (DVI, QA, Labor Tracking, Reminders)
      try {
        await client.query(`
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS odometer INT DEFAULT 0;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS fuel_level VARCHAR(50);
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS intake_inspection JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS customer_approval VARCHAR(50) DEFAULT 'Approved';
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS approved_amount NUMERIC(12,2) DEFAULT 0.00;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS qa_checklist JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS labor_minutes INT DEFAULT 0;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS labor_rate NUMERIC(12,2) DEFAULT 45.00;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS next_service_due_date DATE;
          ALTER TABLE repair_orders ADD COLUMN IF NOT EXISTS next_service_due_km INT;
        `);
      } catch (err) {
        console.log(`[DB] Note on repair_orders extended columns: ${err.message}`);
      }

      // Ensure service_reminders table exists
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS service_reminders (
            id SERIAL PRIMARY KEY,
            customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            repair_order_id INT REFERENCES repair_orders(id) ON DELETE SET NULL,
            service_type VARCHAR(100) NOT NULL,
            due_date DATE,
            due_odometer INT,
            status VARCHAR(50) DEFAULT 'Pending',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } catch (err) {
        console.log(`[DB] Note on service_reminders migration: ${err.message}`);
      }

      // Ensure purchase_orders table exists
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS purchase_orders (
            id SERIAL PRIMARY KEY,
            po_number VARCHAR(50) UNIQUE NOT NULL,
            supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
            status VARCHAR(50) DEFAULT 'Draft',
            total_amount NUMERIC(12,2) DEFAULT 0.00,
            order_date DATE DEFAULT CURRENT_DATE,
            expected_date DATE,
            items JSONB DEFAULT '[]'::jsonb,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } catch (err) {
        console.log(`[DB] Note on purchase_orders migration: ${err.message}`);
      }
    }

    client.release();
  } catch (err) {
    console.error(`\n====================================================`);
    console.error(`❌ [DB Connection Error]: Could not connect to PostgreSQL.`);
    console.error(`   Make sure:`);
    console.error(`   1. PostgreSQL / pgAdmin is running on your machine.`);
    console.error(`   2. The database '${dbName}' exists (create it in pgAdmin).`);
    console.error(`   3. The username and password in server/.env are correct.`);
    console.error(`   Details: ${err.message}`);
    console.error(`====================================================\n`);
  }
}

export default pool;
