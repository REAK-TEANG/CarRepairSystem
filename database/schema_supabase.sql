-- ============================================================
-- AUTO REPAIR SHOP MANAGEMENT SYSTEM - PRODUCTION DATABASE SCHEMA
-- Database Engine: PostgreSQL 14+ / Supabase
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CUSTOM ENUM TYPES (Safe idempotent creation)
-- ============================================================

DO $$ BEGIN
    CREATE TYPE employment_status AS ENUM ('Active', 'On Leave', 'Terminated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Half Day', 'On Leave');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM ('Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE repair_status AS ENUM ('Pending', 'Diagnosing', 'In Progress', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM ('Draft', 'Ordered', 'Received', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('Draft', 'Issued', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled', 'Refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('Cash', 'Credit/Debit Card', 'Bank Transfer', 'Mobile Payment', 'QR Payment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_tx_type AS ENUM ('Stock In', 'Stock Out', 'Adjustment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('Appointment Reminder', 'Repair Completion', 'Low Stock Alert', 'Ready for Pickup', 'Next Service Reminder', 'General');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 2. HELPER FUNCTION: auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. CORE AUTH & RBAC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(100) NOT NULL UNIQUE,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        VARCHAR(255) NOT NULL,
    phone            VARCHAR(50),
    avatar_url       TEXT,
    role_id          INT NOT NULL REFERENCES roles(id),
    is_active        BOOLEAN DEFAULT TRUE,
    last_login       TIMESTAMPTZ,
    reset_token      TEXT,
    reset_expires_at TIMESTAMP,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS user_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. EMPLOYEES & WORK SCHEDULES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id                SERIAL PRIMARY KEY,
    user_id           INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code     VARCHAR(50) NOT NULL UNIQUE,
    position          VARCHAR(100),
    specialization    VARCHAR(255),
    experience_years  INT DEFAULT 0,
    hire_date         DATE,
    salary            DECIMAL(12,2) DEFAULT 0.00,
    employment_status employment_status DEFAULT 'Active',
    photo_url         TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS employee_attendance (
    id          SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    clock_in    TIME,
    clock_out   TIME,
    status      attendance_status DEFAULT 'Present',
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id, date)
);


CREATE TABLE IF NOT EXISTS employee_schedules (
    id          SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day         day_of_week NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_day_off  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (employee_id, day)
);

DO $$ BEGIN
    CREATE TRIGGER trg_employee_schedules_updated_at
        BEFORE UPDATE ON employee_schedules
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 5. CUSTOMERS & VEHICLES
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id                SERIAL PRIMARY KEY,
    customer_code     VARCHAR(50) NOT NULL UNIQUE,
    full_name         VARCHAR(255) NOT NULL,
    phone             VARCHAR(50),
    email             VARCHAR(255),
    address           TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    notes             TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);

DO $$ BEGIN
    CREATE TRIGGER trg_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS vehicles (
    id             SERIAL PRIMARY KEY,
    customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vin            VARCHAR(100),
    brand          VARCHAR(100),
    model          VARCHAR(100),
    year           INT,
    color          VARCHAR(50),
    engine_number  VARCHAR(100),
    fuel_type      fuel_type DEFAULT 'Gasoline',
    mileage        INT DEFAULT 0,
    photo_url      TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_customer ON vehicles(customer_id);

DO $$ BEGIN
    CREATE TRIGGER trg_vehicles_updated_at
        BEFORE UPDATE ON vehicles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 6. SERVICES CATALOG & BILL OF MATERIALS (BOM)
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    estimated_cost  DECIMAL(12,2) DEFAULT 0.00,
    estimated_hours DECIMAL(5,2) DEFAULT 0.00,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_name ON services(name);

DO $$ BEGIN
    CREATE TRIGGER trg_services_updated_at
        BEFORE UPDATE ON services
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 7. SUPPLIERS & SPARE PARTS INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL UNIQUE,
    contact_name VARCHAR(255),
    phone        VARCHAR(50),
    email        VARCHAR(255),
    address      TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_name ON suppliers(name);

DO $$ BEGIN
    CREATE TRIGGER trg_suppliers_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS spare_parts (
    id             SERIAL PRIMARY KEY,
    part_code      VARCHAR(100) NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    category       VARCHAR(100),
    brand          VARCHAR(100),
    unit_price     DECIMAL(12,2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    min_stock      INT DEFAULT 5,
    supplier_id    INT REFERENCES suppliers(id) ON DELETE SET NULL,
    location       VARCHAR(100),
    photo_url      TEXT,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_part_code ON spare_parts(part_code);
CREATE INDEX IF NOT EXISTS idx_part_name ON spare_parts(name);
CREATE INDEX IF NOT EXISTS idx_part_category ON spare_parts(category);

DO $$ BEGIN
    CREATE TRIGGER trg_spare_parts_updated_at
        BEFORE UPDATE ON spare_parts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS service_parts (
    id            SERIAL PRIMARY KEY,
    service_id    INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    spare_part_id INT NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
    quantity      INT NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, spare_part_id)
);


CREATE TABLE IF NOT EXISTS inventory_transactions (
    id             SERIAL PRIMARY KEY,
    spare_part_id  INT NOT NULL REFERENCES spare_parts(id),
    type           inventory_tx_type NOT NULL,
    quantity       INT NOT NULL,
    reference_id   INT,
    reference_type VARCHAR(50),
    notes          TEXT,
    performed_by   INT REFERENCES users(id),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS purchase_orders (
    id            SERIAL PRIMARY KEY,
    order_number  VARCHAR(50) NOT NULL UNIQUE,
    supplier_id   INT NOT NULL REFERENCES suppliers(id),
    total_amount  DECIMAL(12,2) DEFAULT 0.00,
    status        purchase_status DEFAULT 'Draft',
    ordered_by    INT REFERENCES users(id),
    order_date    DATE,
    received_date DATE,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_purchase_orders_updated_at
        BEFORE UPDATE ON purchase_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    spare_part_id     INT NOT NULL REFERENCES spare_parts(id),
    quantity          INT NOT NULL,
    unit_price        DECIMAL(12,2) NOT NULL,
    total_price       DECIMAL(12,2) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 8. APPOINTMENTS & REPAIR ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
    id               SERIAL PRIMARY KEY,
    appointment_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id      INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id       INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    mechanic_id      INT REFERENCES employees(id) ON DELETE SET NULL,
    scheduled_date   DATE NOT NULL,
    scheduled_time   TIME,
    status           appointment_status DEFAULT 'Scheduled',
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointments(status);

DO $$ BEGIN
    CREATE TRIGGER trg_appointments_updated_at
        BEFORE UPDATE ON appointments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS repair_orders (
    id                  SERIAL PRIMARY KEY,
    order_number        VARCHAR(50) NOT NULL UNIQUE,
    appointment_id      INT REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id         INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id          INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    mechanic_id         INT REFERENCES employees(id) ON DELETE SET NULL,
    problem_description TEXT,
    diagnosis           TEXT,
    estimated_cost      DECIMAL(12,2) DEFAULT 0.00,
    actual_cost         DECIMAL(12,2) DEFAULT 0.00,
    status              repair_status DEFAULT 'Pending',
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_order_number ON repair_orders(order_number);

DO $$ BEGIN
    CREATE TRIGGER trg_repair_orders_updated_at
        BEFORE UPDATE ON repair_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS repair_services (
    id              SERIAL PRIMARY KEY,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    service_id      INT NOT NULL REFERENCES services(id),
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    total_price     DECIMAL(12,2) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (repair_order_id, service_id)
);


CREATE TABLE IF NOT EXISTS repair_parts (
    id              SERIAL PRIMARY KEY,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    spare_part_id   INT NOT NULL REFERENCES spare_parts(id),
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    total_price     DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (repair_order_id, spare_part_id)
);


-- ============================================================
-- 9. INVOICES, PAYMENTS & REFUNDS
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    invoice_number  VARCHAR(50) NOT NULL UNIQUE,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    customer_id     INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subtotal        DECIMAL(12,2) DEFAULT 0.00,
    tax_rate        DECIMAL(5,2) DEFAULT 0.00,
    tax_amount      DECIMAL(12,2) DEFAULT 0.00,
    discount        DECIMAL(12,2) DEFAULT 0.00,
    total_amount    DECIMAL(12,2) DEFAULT 0.00,
    amount_paid     DECIMAL(12,2) DEFAULT 0.00,
    balance_due     DECIMAL(12,2) DEFAULT 0.00,
    status          invoice_status DEFAULT 'Draft',
    issued_date     DATE,
    due_date        DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);

DO $$ BEGIN
    CREATE TRIGGER trg_invoices_updated_at
        BEFORE UPDATE ON invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS payments (
    id             SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_id     INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount         DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date   DATE NOT NULL,
    reference_no   VARCHAR(100),
    received_by    INT REFERENCES users(id),
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(payment_date);


CREATE TABLE IF NOT EXISTS refunds (
    id            SERIAL PRIMARY KEY,
    payment_id    INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id    INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount        DECIMAL(12,2) NOT NULL,
    reason        TEXT,
    refund_method payment_method NOT NULL,
    refund_date   DATE NOT NULL,
    processed_by  INT REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 10. MAINTENANCE HISTORY & SERVICE REMINDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_history (
    id                       SERIAL PRIMARY KEY,
    vehicle_id               INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    repair_order_id          INT REFERENCES repair_orders(id) ON DELETE SET NULL,
    service_date             DATE NOT NULL,
    description              TEXT,
    parts_replaced           TEXT,
    repair_cost              DECIMAL(12,2) DEFAULT 0.00,
    mileage_at_service       INT,
    next_service_date        DATE,
    next_service_mileage     INT,
    next_service_description TEXT,
    warranty_expiry_date     DATE,
    warranty_notes           TEXT,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_history(vehicle_id);

DO $$ BEGIN
    CREATE TRIGGER trg_maintenance_history_updated_at
        BEFORE UPDATE ON maintenance_history
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


CREATE TABLE IF NOT EXISTS service_reminders (
    id               SERIAL PRIMARY KEY,
    customer_id      INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id       INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    repair_order_id  INT REFERENCES repair_orders(id) ON DELETE SET NULL,
    service_type     VARCHAR(255) NOT NULL,
    due_date         DATE,
    due_odometer     INT,
    notes            TEXT,
    status           VARCHAR(50) DEFAULT 'Pending',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, vehicle_id, service_type)
);

DO $$ BEGIN
    CREATE TRIGGER trg_service_reminders_updated_at
        BEFORE UPDATE ON service_reminders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 11. NOTIFICATIONS & WORKSHOP SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id             SERIAL PRIMARY KEY,
    user_id        INT REFERENCES users(id) ON DELETE CASCADE,
    type           notification_type NOT NULL,
    title          VARCHAR(255) NOT NULL,
    message        TEXT NOT NULL,
    is_read        BOOLEAN DEFAULT FALSE,
    reference_id   INT,
    reference_type VARCHAR(50),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(is_read);


CREATE TABLE IF NOT EXISTS settings (
    id            SERIAL PRIMARY KEY,
    setting_key   VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    category      VARCHAR(50),
    description   VARCHAR(255),
    updated_by    INT REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TRIGGER trg_settings_updated_at
        BEFORE UPDATE ON settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================
-- 12. COMPREHENSIVE SEED DATA (Dynamic Foreign Keys & Bcrypt Hashes)
-- ============================================================

-- 1. Roles
INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access, audit logs, and master settings'),
    ('Manager', 'Manage workshop operations, staff, reports, and invoices'),
    ('Service Advisor', 'Customer intake, vehicle diagnostics, appointments, and job dispatch'),
    ('Mechanic', 'Perform vehicle repairs, inspection checklists, and parts requests'),
    ('Cashier', 'Process billing, invoices, customer payments, and receipts'),
    ('Storekeeper', 'Manage parts inventory, supplier purchases, and stock alerts')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;


-- 2. Core RBAC Accounts (Bcrypt password for admin: 'admin123' | for all others: 'password123')
INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'admin', 'admin@carrepair.com', '$2b$10$zkJwffuqX3ZcLrW8e.Vmru4cK2qMv3BsIG5bFcGNpCk8Ub6qcUhDC', 'System Administrator', '(555) 019-1000', id, TRUE FROM roles WHERE name = 'Admin'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'manager', 'manager@workshop.com', '$2b$10$3BFisDQ2hJI/KwK48O/m4uVmX4MLPWbLJ2P3yqx07dp8lxOI8SyWm', 'Marcus Vance', '(555) 019-2000', id, TRUE FROM roles WHERE name = 'Manager'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'advisor', 'advisor@workshop.com', '$2b$10$3BFisDQ2hJI/KwK48O/m4uVmX4MLPWbLJ2P3yqx07dp8lxOI8SyWm', 'Sarah Jenkins', '(555) 019-3000', id, TRUE FROM roles WHERE name = 'Service Advisor'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'mechanic', 'mike@workshop.com', '$2b$10$3BFisDQ2hJI/KwK48O/m4uVmX4MLPWbLJ2P3yqx07dp8lxOI8SyWm', 'Mike Johnson', '(555) 019-4000', id, TRUE FROM roles WHERE name = 'Mechanic'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'cashier', 'cashier@workshop.com', '$2b$10$3BFisDQ2hJI/KwK48O/m4uVmX4MLPWbLJ2P3yqx07dp8lxOI8SyWm', 'Emily Watson', '(555) 019-5000', id, TRUE FROM roles WHERE name = 'Cashier'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
SELECT 'storekeeper', 'store@workshop.com', '$2b$10$3BFisDQ2hJI/KwK48O/m4uVmX4MLPWbLJ2P3yqx07dp8lxOI8SyWm', 'David Miller', '(555) 019-6000', id, TRUE FROM roles WHERE name = 'Storekeeper'
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, full_name = EXCLUDED.full_name;


-- 3. Mechanics and Staff Records
INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status)
SELECT id, 'EMP-001', 'Mechanic', 'Engine & Transmission Specialist', 8, 4800.00, 'Active' FROM users WHERE username = 'mechanic'
ON CONFLICT (employee_code) DO NOTHING;

INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status)
SELECT id, 'EMP-002', 'Manager', 'Workshop Operations', 12, 6000.00, 'Active' FROM users WHERE username = 'manager'
ON CONFLICT (employee_code) DO NOTHING;

INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status)
SELECT id, 'EMP-003', 'Service Advisor', 'Customer Intake & Estimations', 5, 4200.00, 'Active' FROM users WHERE username = 'advisor'
ON CONFLICT (employee_code) DO NOTHING;


-- 4. Customers
INSERT INTO customers (customer_code, full_name, phone, email, address, notes) VALUES
    ('CUST-001', 'Alex Morgan', '(555) 234-5678', 'alex.m@example.com', '124 Maple Dr, Tech City', 'VIP customer, prefers OEM parts only.'),
    ('CUST-002', 'Sarah Jenkins', '(555) 876-5432', 'sarah.j@example.com', '789 Oak Ave, Springfield', 'Corporate fleet manager.'),
    ('CUST-003', 'David Chen', '(555) 345-6789', 'd.chen@example.com', '45 Pine St, Metropolis', 'Regular maintenance contract.'),
    ('CUST-004', 'Emily Watson', '(555) 987-6543', 'emily.w@example.com', '321 Elm Blvd, Riverdale', 'Referred by David Chen.'),
    ('CUST-005', 'Marcus Vance', '(555) 456-7890', 'm.vance@example.com', '56 Cedar Ln, Gotham', 'Track day enthusiast.'),
    ('CUST-006', 'Jessica Alba', '(555) 654-3210', 'jessica.a@example.com', '88 Sunset Blvd, Los Angeles', 'Executive vehicle servicing.')
ON CONFLICT (customer_code) DO NOTHING;


-- 5. Vehicles (Dynamic Customer Foreign Key)
INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
SELECT id, 'ABC-1234', '1HGCR2F83HA001234', 'Toyota', 'Camry', 2022, 'Midnight Blue', 'Gasoline'::fuel_type, 34500, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80', 'Regular 5k mile service schedule.' FROM customers WHERE customer_code = 'CUST-001'
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
SELECT id, 'XYZ-5678', 'WBA3A5C58DF105678', 'BMW', '330i', 2021, 'Alpine White', 'Gasoline'::fuel_type, 28000, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80', 'Requires synthetic 0W-20 oil.' FROM customers WHERE customer_code = 'CUST-002'
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
SELECT id, 'DEF-9012', '1FADP5CU8GA009012', 'Ford', 'F-150', 2020, 'Shadow Black', 'Gasoline'::fuel_type, 62000, 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80', 'Heavy duty towing package.' FROM customers WHERE customer_code = 'CUST-003'
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
SELECT id, 'GHI-3456', 'JH4CU2F68CC003456', 'Honda', 'Civic', 2023, 'Sonic Gray', 'Gasoline'::fuel_type, 15200, 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&auto=format&fit=crop&q=80', 'New tires installed last month.' FROM customers WHERE customer_code = 'CUST-004'
ON CONFLICT (vehicle_number) DO NOTHING;


-- 6. Services Catalog
INSERT INTO services (name, description, estimated_cost, estimated_hours) VALUES
    ('Full Synthetic Oil & Filter Service', 'Drain and refill with premium synthetic motor oil, replace OEM filter with multi-point inspection.', 89.99, 1.0),
    ('Front & Rear Brake Pad Replacement', 'Install premium ceramic brake pads and inspect brake calipers, rotors, and brake fluid lines.', 249.99, 2.5),
    ('Comprehensive Multi-Point Inspection', 'Complete computerized diagnostics on engine, transmission, suspension, battery, and safety systems.', 59.99, 1.0),
    ('Wheel Alignment & High-Speed Balancing', 'Computerized 4-wheel laser alignment and high-speed tire balancing for smooth highway ride.', 119.99, 1.5),
    ('Automatic Transmission Fluid Flush', 'Complete transmission fluid evacuation, pan cleaning, filter replacement, and fluid refill.', 289.99, 2.0),
    ('Air Conditioning System Recharge', 'Refrigerant recovery, vacuum leak test, and R134a/R1234yf recharge with UV dye inspection.', 169.99, 1.5)
ON CONFLICT (name) DO UPDATE SET estimated_cost = EXCLUDED.estimated_cost, estimated_hours = EXCLUDED.estimated_hours;


-- 7. Suppliers
INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES
    ('Brembo OEM Distribution', 'Marco Rossi', '(555) 999-0011', 'orders@brembo-supply.com', '88 Performance Way, Los Angeles, CA'),
    ('Global Lubricants Corp', 'Tom Hardy', '(555) 888-9900', 'sales@globallube.com', '45 Refinery Way, Houston, TX'),
    ('AutoParts Direct Wholesale', 'Rachel Green', '(555) 777-8899', 'orders@autopartsdirect.com', '100 Industrial Blvd, Detroit, MI'),
    ('Bosch Automotive Aftermarket', 'Hans Gruber', '(555) 333-2211', 'dealer-support@bosch-auto.com', '200 Technology Dr, Chicago, IL')
ON CONFLICT (name) DO NOTHING;


-- 8. Spare Parts Inventory
INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location)
SELECT 'BP-7821', 'Ceramic Front Brake Pads', 'Brakes', 'Brembo', 64.99, 24, 8, id, 'Shelf A-01' FROM suppliers WHERE name = 'Brembo OEM Distribution'
ON CONFLICT (part_code) DO NOTHING;

INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location)
SELECT 'BR-3321', 'Vented Brake Rotors (Pair)', 'Brakes', 'Brembo', 145.00, 12, 6, id, 'Shelf A-04' FROM suppliers WHERE name = 'Brembo OEM Distribution'
ON CONFLICT (part_code) DO NOTHING;

INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location)
SELECT 'OF-1044', 'Synthetic Oil Filter Cartridge', 'Filters', 'Mobil 1', 12.50, 48, 15, id, 'Shelf B-03' FROM suppliers WHERE name = 'Global Lubricants Corp'
ON CONFLICT (part_code) DO NOTHING;

INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location)
SELECT 'FL-5020', 'Full Synthetic 5W-30 (5 Quart)', 'Fluids', 'Mobil 1', 38.99, 35, 12, id, 'Rack D-01' FROM suppliers WHERE name = 'Global Lubricants Corp'
ON CONFLICT (part_code) DO NOTHING;


-- 9. Service Parts (Bill of Materials)
INSERT INTO service_parts (service_id, spare_part_id, quantity)
SELECT s.id, p.id, 1 FROM services s, spare_parts p WHERE s.name = 'Full Synthetic Oil & Filter Service' AND p.part_code = 'OF-1044'
ON CONFLICT (service_id, spare_part_id) DO NOTHING;

INSERT INTO service_parts (service_id, spare_part_id, quantity)
SELECT s.id, p.id, 1 FROM services s, spare_parts p WHERE s.name = 'Full Synthetic Oil & Filter Service' AND p.part_code = 'FL-5020'
ON CONFLICT (service_id, spare_part_id) DO NOTHING;

INSERT INTO service_parts (service_id, spare_part_id, quantity)
SELECT s.id, p.id, 1 FROM services s, spare_parts p WHERE s.name = 'Front & Rear Brake Pad Replacement' AND p.part_code = 'BP-7821'
ON CONFLICT (service_id, spare_part_id) DO NOTHING;


-- 10. Appointments
INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
SELECT 'APT-2026-001', c.id, v.id, e.id, CURRENT_DATE, '09:00', 'Confirmed'::appointment_status, 'Customer requested multi-point safety inspection before road trip.'
FROM customers c, vehicles v, employees e
WHERE c.customer_code = 'CUST-001' AND v.vehicle_number = 'ABC-1234' AND e.employee_code = 'EMP-001'
ON CONFLICT (appointment_code) DO NOTHING;


-- 11. Repair Orders
INSERT INTO repair_orders (order_number, appointment_id, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis, estimated_cost, actual_cost, status, started_at, notes)
SELECT 'RO-2026-001', a.id, c.id, v.id, e.id, 'Oil service due and brake inspection', 'Oil degraded; front pads at 20% life remaining.', 339.98, 339.98, 'In Progress'::repair_status, NOW() - INTERVAL '2 hours', 'Customer authorized ceramic pad replacement.'
FROM appointments a, customers c, vehicles v, employees e
WHERE a.appointment_code = 'APT-2026-001' AND c.customer_code = 'CUST-001' AND v.vehicle_number = 'ABC-1234' AND e.employee_code = 'EMP-001'
ON CONFLICT (order_number) DO NOTHING;


-- 12. Repair Services & Parts
INSERT INTO repair_services (repair_order_id, service_id, quantity, unit_price, total_price)
SELECT ro.id, s.id, 1, s.estimated_cost, s.estimated_cost
FROM repair_orders ro, services s
WHERE ro.order_number = 'RO-2026-001' AND s.name = 'Full Synthetic Oil & Filter Service'
ON CONFLICT (repair_order_id, service_id) DO NOTHING;


-- 13. Invoices
INSERT INTO invoices (invoice_number, repair_order_id, customer_id, subtotal, tax_rate, tax_amount, discount, total_amount, amount_paid, balance_due, status, issued_date, due_date)
SELECT 'INV-2026-001', ro.id, c.id, 339.98, 10.00, 34.00, 0.00, 373.98, 373.98, 0.00, 'Paid'::invoice_status, CURRENT_DATE, CURRENT_DATE
FROM repair_orders ro, customers c
WHERE ro.order_number = 'RO-2026-001' AND c.customer_code = 'CUST-001'
ON CONFLICT (invoice_number) DO NOTHING;


-- 14. Service Reminders
INSERT INTO service_reminders (customer_id, vehicle_id, service_type, due_date, due_odometer, notes, status)
SELECT c.id, v.id, 'Next Synthetic Oil Change (5,000 miles)', CURRENT_DATE + INTERVAL '90 days', 39500, 'Recommended for optimum engine longevity', 'Pending'
FROM customers c, vehicles v
WHERE c.customer_code = 'CUST-001' AND v.vehicle_number = 'ABC-1234'
ON CONFLICT (customer_id, vehicle_id, service_type) DO NOTHING;


-- 15. Workshop Settings
INSERT INTO settings (setting_key, setting_value, category, description) VALUES
    ('workshop_name', 'Pro Auto Repair & Diagnostics Hub', 'Workshop', 'Official name of the workshop'),
    ('workshop_address', '100 Automotive Blvd, Suite 400', 'Workshop', 'Workshop physical address'),
    ('workshop_phone', '(555) 019-9000', 'Workshop', 'Customer service hotline'),
    ('workshop_email', 'service@carrepair.com', 'Workshop', 'Official contact email'),
    ('tax_rate', '10', 'Tax', 'Default sales and service tax percentage (%)'),
    ('currency', 'USD', 'Currency', 'Default accounting currency'),
    ('currency_symbol', '$', 'Currency', 'Currency symbol used on invoices and receipts'),
    ('business_hours_open', '08:00', 'Business Hours', 'Daily opening time'),
    ('business_hours_close', '18:00', 'Business Hours', 'Daily closing time'),
    ('business_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Business Hours', 'Operating days'),
    ('low_stock_threshold', '5', 'Inventory', 'Threshold for low inventory warnings')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description;
