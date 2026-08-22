import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[DB Warning] Missing Supabase URL or Key in .env file!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initializeDatabase() {
  console.log(`[DB] Initializing Supabase Connection to: ${supabaseUrl}`);
  // We can do a quick health check here if we wanted
  const { data, error } = await supabase.from('settings').select('setting_key').limit(1);
  if (error) {
    console.error('[DB Error] Failed to connect to Supabase:', error.message);
  } else {
    console.log('[DB] Successfully connected to Supabase PostgreSQL database.');
  }
}

export default supabase;
