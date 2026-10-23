-- ============================================================
-- Migration 004: Enable PostgreSQL Row Level Security (RLS)
-- Enables RLS on all system tables and defines security policies
-- ============================================================

-- 1. Enable Row Level Security on all core application tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Drop any pre-existing policies to allow idempotent execution
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. Define Row Level Security Policies

-- ROLES: Readable by all, manageable by Admin
CREATE POLICY roles_select_policy ON roles FOR SELECT USING (true);
CREATE POLICY roles_write_policy ON roles FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) = 'admin'
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) = 'admin'
);

-- USERS: Readable by authenticated, self or Admin/Manager; modifiable by self or Admin
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager') OR
    current_setting('app.current_user_role', true) = 'public'
);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager') OR
    id::text = current_setting('app.current_user_id', true)
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager') OR
    id::text = current_setting('app.current_user_id', true)
);
CREATE POLICY users_delete_policy ON users FOR DELETE USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) = 'admin'
);

-- EMPLOYEES: Full access for Admin/Manager, viewable by staff
CREATE POLICY employees_policy ON employees FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager') OR
    user_id::text = current_setting('app.current_user_id', true) OR
    current_setting('app.current_user_role', true) IN ('service_advisor', 'mechanic', 'cashier', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager')
);

-- CUSTOMERS & VEHICLES: Admin, Manager, Service Advisor, Mechanic
CREATE POLICY customers_policy ON customers FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor')
);

CREATE POLICY vehicles_policy ON vehicles FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor')
);

-- APPOINTMENTS: Admin, Manager, Service Advisor, Mechanic
CREATE POLICY appointments_policy ON appointments FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor')
);

-- REPAIR ORDERS, SERVICES, PARTS:
CREATE POLICY repair_orders_policy ON repair_orders FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'cashier', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic')
);

CREATE POLICY repair_services_policy ON repair_services FOR ALL USING (true) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic')
);

CREATE POLICY repair_parts_policy ON repair_parts FOR ALL USING (true) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'storekeeper')
);

CREATE POLICY service_parts_policy ON service_parts FOR ALL USING (true) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'service_advisor', 'mechanic', 'storekeeper')
);

CREATE POLICY services_policy ON services FOR ALL USING (true) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager')
);

-- INVENTORY & SPARE PARTS: Storekeeper, Admin, Manager, Mechanic (read)
CREATE POLICY spare_parts_policy ON spare_parts FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper', 'mechanic', 'service_advisor', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
);

CREATE POLICY suppliers_policy ON suppliers FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
);

CREATE POLICY inventory_transactions_policy ON inventory_transactions FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
);

CREATE POLICY purchase_orders_policy ON purchase_orders FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
);

CREATE POLICY purchase_order_items_policy ON purchase_order_items FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'storekeeper')
);

-- INVOICES & PAYMENTS: Cashier, Admin, Manager, Service Advisor
CREATE POLICY invoices_policy ON invoices FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier', 'service_advisor')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier', 'service_advisor')
);

CREATE POLICY payments_policy ON payments FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier')
);

CREATE POLICY refunds_policy ON refunds FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier')
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) IN ('admin', 'manager', 'cashier')
);

-- SETTINGS: Viewable by authenticated users, modifiable by Admin
CREATE POLICY settings_select_policy ON settings FOR SELECT USING (true);
CREATE POLICY settings_write_policy ON settings FOR ALL USING (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) = 'admin'
) WITH CHECK (
    current_setting('app.current_user_role', true) IS NULL OR
    current_setting('app.current_user_role', true) = 'admin'
);

-- SYSTEM, SESSIONS, NOTIFICATIONS, AUDIT & ATTENDANCE
CREATE POLICY notifications_policy ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY maintenance_history_policy ON maintenance_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY system_events_policy ON system_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_reminders_policy ON service_reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY user_sessions_policy ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY login_attempts_policy ON login_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY employee_attendance_policy ON employee_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY employee_schedules_policy ON employee_schedules FOR ALL USING (true) WITH CHECK (true);
