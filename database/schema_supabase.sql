-- ============================================================
-- AUTO REPAIR SHOP MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Database Engine: PostgreSQL (Supabase)
-- Generated from: system_requirements.md
-- ============================================================


-- ============================================================
-- CUSTOM ENUM TYPES
-- ============================================================

CREATE TYPE employment_status AS ENUM ('Active', 'On Leave', 'Terminated');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Half Day', 'On Leave');
CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE fuel_type AS ENUM ('Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE repair_status AS ENUM ('Pending', 'Diagnosing', 'Repairing', 'Waiting for Parts', 'Ready for Pickup', 'Completed');
CREATE TYPE purchase_status AS ENUM ('Draft', 'Ordered', 'Received', 'Cancelled');
CREATE TYPE invoice_status AS ENUM ('Draft', 'Issued', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled', 'Refunded');
CREATE TYPE payment_method AS ENUM ('Cash', 'Credit/Debit Card', 'Bank Transfer', 'Mobile Payment', 'QR Payment');
CREATE TYPE inventory_tx_type AS ENUM ('Stock In', 'Stock Out', 'Adjustment');
CREATE TYPE notification_type AS ENUM ('Appointment Reminder', 'Repair Completion', 'Low Stock Alert', 'Ready for Pickup', 'Next Service Reminder', 'General');


-- ============================================================
-- HELPER FUNCTION: auto-update updated_at column
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- REQUIREMENT 1 & 12: USERS / EMPLOYEES / AUTHENTICATION
-- ============================================================

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE users (
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

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Tracks active sessions for token-based auth
CREATE TABLE user_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- REQUIREMENT 12: Employee-specific details (extends users)
CREATE TABLE employees (
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

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- REQUIREMENT 12: Employee Attendance
CREATE TABLE employee_attendance (
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


-- REQUIREMENT 12: Employee Work Schedule
CREATE TABLE employee_schedules (
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

CREATE TRIGGER trg_employee_schedules_updated_at
    BEFORE UPDATE ON employee_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 3: CUSTOMER MANAGEMENT
-- ============================================================

CREATE TABLE customers (
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

CREATE INDEX idx_customer_name ON customers(full_name);
CREATE INDEX idx_customer_phone ON customers(phone);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 4: VEHICLE MANAGEMENT
-- ============================================================

CREATE TABLE vehicles (
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
    photo_url      TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_number ON vehicles(vehicle_number);
CREATE INDEX idx_vehicle_vin ON vehicles(vin);

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 7: SERVICE MANAGEMENT
-- ============================================================

CREATE TABLE services (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    estimated_cost  DECIMAL(12,2) DEFAULT 0.00,
    estimated_hours DECIMAL(5,2) DEFAULT 0.00,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_name ON services(name);

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 5: APPOINTMENT MANAGEMENT
-- ============================================================

CREATE TABLE appointments (
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

CREATE INDEX idx_appointment_date ON appointments(scheduled_date);
CREATE INDEX idx_appointment_status ON appointments(status);

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 6: REPAIR JOB MANAGEMENT
-- ============================================================

CREATE TABLE repair_orders (
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

CREATE INDEX idx_repair_status ON repair_orders(status);
CREATE INDEX idx_repair_order_number ON repair_orders(order_number);

CREATE TRIGGER trg_repair_orders_updated_at
    BEFORE UPDATE ON repair_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Links repair orders to services performed
CREATE TABLE repair_services (
    id              SERIAL PRIMARY KEY,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    service_id      INT NOT NULL REFERENCES services(id),
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    total_price     DECIMAL(12,2) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- REQUIREMENT 10: SUPPLIER MANAGEMENT
-- ============================================================

CREATE TABLE suppliers (
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

CREATE INDEX idx_supplier_name ON suppliers(name);

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 9: SPARE PARTS INVENTORY MANAGEMENT
-- ============================================================

CREATE TABLE spare_parts (
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

CREATE INDEX idx_part_code ON spare_parts(part_code);
CREATE INDEX idx_part_name ON spare_parts(name);
CREATE INDEX idx_part_category ON spare_parts(category);

CREATE TRIGGER trg_spare_parts_updated_at
    BEFORE UPDATE ON spare_parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Tracks every stock movement (in, out, adjustment)
CREATE TABLE inventory_transactions (
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


-- Parts used in a specific repair order
CREATE TABLE repair_parts (
    id              SERIAL PRIMARY KEY,
    repair_order_id INT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    spare_part_id   INT NOT NULL REFERENCES spare_parts(id),
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    total_price     DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- REQUIREMENT 10: PURCHASE ORDERS (Supplier Purchases)
-- ============================================================

CREATE TABLE purchase_orders (
    id            SERIAL PRIMARY KEY,
    order_number  VARCHAR(20) NOT NULL UNIQUE,
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

CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE purchase_order_items (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    spare_part_id     INT NOT NULL REFERENCES spare_parts(id),
    quantity          INT NOT NULL,
    unit_price        DECIMAL(12,2) NOT NULL,
    total_price       DECIMAL(12,2) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- REQUIREMENT 11: INVOICE & PAYMENT MANAGEMENT
-- ============================================================

CREATE TABLE invoices (
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

CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_status ON invoices(status);

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE payments (
    id             SERIAL PRIMARY KEY,
    payment_number VARCHAR(20) NOT NULL UNIQUE,
    invoice_id     INT NOT NULL REFERENCES invoices(id),
    amount         DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date   DATE NOT NULL,
    reference_no   VARCHAR(100),
    received_by    INT REFERENCES users(id),
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_date ON payments(payment_date);


-- REQUIREMENT 11: Refund Management
CREATE TABLE refunds (
    id            SERIAL PRIMARY KEY,
    payment_id    INT NOT NULL REFERENCES payments(id),
    invoice_id    INT NOT NULL REFERENCES invoices(id),
    amount        DECIMAL(12,2) NOT NULL,
    reason        TEXT,
    refund_method payment_method NOT NULL,
    refund_date   DATE NOT NULL,
    processed_by  INT REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- REQUIREMENT 13: MAINTENANCE HISTORY MANAGEMENT
-- ============================================================

CREATE TABLE maintenance_history (
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

CREATE INDEX idx_maintenance_vehicle ON maintenance_history(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_history(service_date);

CREATE TRIGGER trg_maintenance_history_updated_at
    BEFORE UPDATE ON maintenance_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- REQUIREMENT 15: NOTIFICATION SYSTEM
-- ============================================================

CREATE TABLE notifications (
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

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);


-- ============================================================
-- REQUIREMENT 16: SETTINGS
-- ============================================================

CREATE TABLE settings (
    id            SERIAL PRIMARY KEY,
    setting_key   VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    category      VARCHAR(50),
    description   VARCHAR(255),
    updated_by    INT REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_setting_key ON settings(setting_key);
CREATE INDEX idx_setting_category ON settings(category);

CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- SEED DATA: Default Roles
-- ============================================================

INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access and configuration'),
    ('Manager', 'Manage operations, employees, and reports'),
    ('Service Advisor', 'Handle customers, appointments, and repair orders'),
    ('Mechanic', 'View and update assigned repair jobs'),
    ('Cashier', 'Manage invoices and payments'),
    ('Storekeeper', 'Manage spare parts inventory and suppliers');


-- ============================================================
-- SEED DATA: Default Services
-- ============================================================

INSERT INTO services (name, description, estimated_cost) VALUES
    ('Oil Change', 'Engine oil and filter replacement', 50.00),
    ('Engine Repair', 'Engine diagnosis and repair', 500.00),
    ('Brake Service', 'Brake pad and disc inspection/replacement', 200.00),
    ('Tire Replacement', 'Tire removal and installation', 80.00),
    ('Battery Replacement', 'Battery testing and replacement', 150.00),
    ('Air Conditioning Repair', 'AC system diagnosis and repair', 300.00),
    ('Wheel Alignment', 'Four-wheel alignment adjustment', 75.00),
    ('Car Wash', 'Full exterior and interior cleaning', 30.00),
    ('General Inspection', 'Multi-point vehicle inspection', 60.00);


-- ============================================================
-- SEED DATA: Default Settings
-- ============================================================

INSERT INTO settings (setting_key, setting_value, category, description) VALUES
    ('workshop_name', 'Auto Repair Shop', 'Workshop', 'Name of the workshop'),
    ('workshop_address', '', 'Workshop', 'Workshop address'),
    ('workshop_phone', '', 'Workshop', 'Workshop contact phone'),
    ('workshop_email', '', 'Workshop', 'Workshop contact email'),
    ('workshop_logo', '', 'Workshop', 'Path to workshop logo'),
    ('tax_rate', '7', 'Tax', 'Default tax percentage'),
    ('tax_name', 'VAT', 'Tax', 'Tax display name'),
    ('currency', 'USD', 'Currency', 'Default currency code'),
    ('currency_symbol', '$', 'Currency', 'Currency symbol'),
    ('business_hours_open', '08:00', 'Business Hours', 'Opening time'),
    ('business_hours_close', '18:00', 'Business Hours', 'Closing time'),
    ('business_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Business Hours', 'Working days'),
    ('low_stock_threshold', '5', 'Inventory', 'Alert when stock falls below this number');


-- ============================================================
-- SEED DATA: Default Admin User (password: admin123)
-- ============================================================
-- Note: The password hash below is for "admin123" using PHP password_hash()
-- You MUST regenerate this hash in your PHP app before going to production.

INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
    ('admin', 'admin@carrepair.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 1);
