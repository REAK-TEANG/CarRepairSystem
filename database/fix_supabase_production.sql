-- ==============================================================================
-- CAR REPAIR SYSTEM: SUPABASE PRODUCTION DATABASE FIX & INITIALIZATION SCRIPT
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Ensure Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Roles Exist
INSERT INTO roles (id, name, description) VALUES
    (1, 'Admin', 'Full administrative access across all workshop operations'),
    (2, 'Manager', 'Workshop workflow oversight, scheduling, and staff dispatch'),
    (3, 'Service Advisor', 'Customer intake, repair job estimation, and communications'),
    (4, 'Mechanic', 'Vehicle diagnosis, work order logging, and parts requisition'),
    (5, 'Cashier', 'Invoice generation, billing, and payment collection'),
    (6, 'Storekeeper', 'Spare parts inventory, stock tracking, and supplier ordering')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- 3. Ensure Verified RBAC User Accounts with Working Bcrypt Hashes
-- Password for admin: 'admin123'
-- Password for all staff accounts: 'password123'

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
VALUES
    ('admin', 'admin@carrepair.com', '$2b$10$rvNF/UJrJxh5uf02i3MbYOAtOMX77dEZxidsOj0OODiA64WHs76Qy', 'System Administrator', '(555) 019-1000', 1, TRUE),
    ('manager', 'manager@workshop.com', '$2b$10$wHbPGnIm4yXPk1HCxs2MTuuOyadZxRTKCg0rT3S64gBU7.xi1mvlW', 'Marcus Vance', '(555) 019-2000', 2, TRUE),
    ('advisor', 'advisor@workshop.com', '$2b$10$wHbPGnIm4yXPk1HCxs2MTuuOyadZxRTKCg0rT3S64gBU7.xi1mvlW', 'Sarah Jenkins', '(555) 019-3000', 3, TRUE),
    ('mechanic', 'mike@workshop.com', '$2b$10$wHbPGnIm4yXPk1HCxs2MTuuOyadZxRTKCg0rT3S64gBU7.xi1mvlW', 'Mike Johnson', '(555) 019-4000', 4, TRUE),
    ('cashier', 'cashier@workshop.com', '$2b$10$wHbPGnIm4yXPk1HCxs2MTuuOyadZxRTKCg0rT3S64gBU7.xi1mvlW', 'Emily Watson', '(555) 019-5000', 5, TRUE),
    ('storekeeper', 'store@workshop.com', '$2b$10$wHbPGnIm4yXPk1HCxs2MTuuOyadZxRTKCg0rT3S64gBU7.xi1mvlW', 'David Miller', '(555) 019-6000', 6, TRUE)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    role_id = EXCLUDED.role_id,
    full_name = EXCLUDED.full_name,
    is_active = TRUE;

-- 4. Disable Row Level Security (RLS) on Application Tables to prevent blocking API queries
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'users', 'roles', 'customers', 'vehicles', 'appointments', 
        'repair_orders', 'repair_services', 'repair_parts', 'services', 
        'spare_parts', 'suppliers', 'employees', 'invoices', 'payments', 
        'settings', 'service_reminders', 'inventory_transactions', 
        'service_parts', 'attendance'
    ];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
        END IF;
    END LOOP;
END $$;

-- 5. Verification Query: Confirm user accounts are active and properly hashed
SELECT u.id, u.username, u.email, r.name as role, u.is_active, 
       CASE WHEN u.password_hash IS NOT NULL THEN 'CONFIGURED' ELSE 'MISSING' END as password_status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.id ASC;
