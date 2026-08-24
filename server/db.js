import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'car_repair_db',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

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
