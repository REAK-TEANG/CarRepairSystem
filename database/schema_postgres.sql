-- ============================================================
-- AUTO REPAIR SHOP MANAGEMENT SYSTEM - LOCAL POSTGRESQL SCHEMA
-- For use with local PostgreSQL & pgAdmin
-- ============================================================

-- CUSTOM ENUM TYPES
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
    CREATE TYPE repair_status AS ENUM ('Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed');
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

-- HELPER FUNCTION: auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLES
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    VARCHAR(500),
    role_id       INT NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id                SERIAL PRIMARY KEY,
    user_id           INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code     VARCHAR(20) NOT NULL UNIQUE,
    position          VARCHAR(100),
    specialization    VARCHAR(255),
    experience_years  INT DEFAULT 0,
    hire_date         DATE,
    salary            DECIMAL(12,2) DEFAULT 0.00,
    employment_status employment_status DEFAULT 'Active',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id                SERIAL PRIMARY KEY,
    customer_code     VARCHAR(20) NOT NULL UNIQUE,
    full_name         VARCHAR(255) NOT NULL,
    phone             VARCHAR(20),
    email             VARCHAR(255),
    address           TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    notes             TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id             SERIAL PRIMARY KEY,
    customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vin            VARCHAR(50),
    brand          VARCHAR(100),
    model          VARCHAR(100),
    year           INT,
    color          VARCHAR(50),
    engine_number  VARCHAR(100),
    fuel_type      fuel_type DEFAULT 'Gasoline',
    mileage        INT DEFAULT 0,
    photo_url      VARCHAR(500),
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    estimated_cost  DECIMAL(12,2) DEFAULT 0.00,
    estimated_hours DECIMAL(5,2) DEFAULT 0.00,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id               SERIAL PRIMARY KEY,
    appointment_code VARCHAR(20) NOT NULL UNIQUE,
    customer_id      INT NOT NULL REFERENCES customers(id),
    vehicle_id       INT NOT NULL REFERENCES vehicles(id),
    mechanic_id      INT REFERENCES employees(id),
    scheduled_date   DATE NOT NULL,
    scheduled_time   TIME,
    status           appointment_status DEFAULT 'Scheduled',
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_orders (
    id                  SERIAL PRIMARY KEY,
    order_number        VARCHAR(20) NOT NULL UNIQUE,
    appointment_id      INT REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id         INT NOT NULL REFERENCES customers(id),
    vehicle_id          INT NOT NULL REFERENCES vehicles(id),
    mechanic_id         INT REFERENCES employees(id),
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

CREATE TABLE IF NOT EXISTS suppliers (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone        VARCHAR(20),
    email        VARCHAR(255),
    address      TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spare_parts (
    id             SERIAL PRIMARY KEY,
    part_code      VARCHAR(50) NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    category       VARCHAR(100),
    brand          VARCHAR(100),
    unit_price     DECIMAL(12,2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    min_stock      INT DEFAULT 5,
    supplier_id    INT REFERENCES suppliers(id) ON DELETE SET NULL,
    location       VARCHAR(100),
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    invoice_number  VARCHAR(20) NOT NULL UNIQUE,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id),
    customer_id     INT NOT NULL REFERENCES customers(id),
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

CREATE TABLE IF NOT EXISTS settings (
    id            SERIAL PRIMARY KEY,
    setting_key   VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    category      VARCHAR(50),
    description   VARCHAR(255),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA
INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access and configuration'),
    ('Manager', 'Manage operations, employees, and reports'),
    ('Service Advisor', 'Handle customers, appointments, and repair orders'),
    ('Mechanic', 'View and update assigned repair jobs'),
    ('Cashier', 'Manage invoices and payments'),
    ('Storekeeper', 'Manage spare parts inventory and suppliers')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
    ('admin', 'admin@carrepair.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 1)
ON CONFLICT (username) DO NOTHING;

INSERT INTO settings (setting_key, setting_value, category, description) VALUES
    ('workshop_name', 'Auto Repair Shop', 'Workshop', 'Name of the workshop'),
    ('tax_rate', '7', 'Tax', 'Default tax percentage'),
    ('currency', 'USD', 'Currency', 'Default currency code'),
    ('currency_symbol', '$', 'Currency', 'Currency symbol'),
    ('business_hours_open', '08:00', 'Business Hours', 'Opening time'),
    ('business_hours_close', '18:00', 'Business Hours', 'Closing time')
ON CONFLICT (setting_key) DO NOTHING;
