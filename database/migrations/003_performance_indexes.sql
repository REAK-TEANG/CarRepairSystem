-- ==============================================================================
-- Migration: 003_performance_indexes.sql
-- High-Performance Composite & Foreign Key Indexes for Car Repair System
-- Resolves N+1 and full-table scan bottlenecks across all core entities
-- ==============================================================================

-- 1. Real-Time System Events Table & Indexes
CREATE TABLE IF NOT EXISTS system_events (
    id BIGSERIAL PRIMARY KEY,
    topic VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_events_id_topic 
    ON system_events (id ASC, topic);

CREATE INDEX IF NOT EXISTS idx_system_events_created 
    ON system_events (created_at DESC);

-- 2. Repair Orders Indexes
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer_id 
    ON repair_orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle_id 
    ON repair_orders (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_repair_orders_mechanic_id 
    ON repair_orders (mechanic_id);

CREATE INDEX IF NOT EXISTS idx_repair_orders_status_mechanic 
    ON repair_orders (status, mechanic_id);

CREATE INDEX IF NOT EXISTS idx_repair_orders_created_at_desc 
    ON repair_orders (created_at DESC);

-- 3. Appointments Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id 
    ON appointments (customer_id);

CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_id 
    ON appointments (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_appointments_mechanic_id 
    ON appointments (mechanic_id);

CREATE INDEX IF NOT EXISTS idx_appointments_sched_date_status 
    ON appointments (scheduled_date, status);

-- 4. Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id 
    ON vehicles (customer_id);

-- 5. Invoices & Payments Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
    ON invoices (customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_repair_order_id 
    ON invoices (repair_order_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status_issued 
    ON invoices (status, issued_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id 
    ON payments (invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date 
    ON payments (payment_date DESC);

-- 6. Inventory & Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_spare_parts_supplier_id 
    ON spare_parts (supplier_id);

CREATE INDEX IF NOT EXISTS idx_spare_parts_stock_threshold 
    ON spare_parts (stock_quantity, min_stock);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_spare_part_created 
    ON inventory_transactions (spare_part_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_order_id 
    ON repair_parts (repair_order_id);

CREATE INDEX IF NOT EXISTS idx_repair_parts_spare_part_id 
    ON repair_parts (spare_part_id);

CREATE INDEX IF NOT EXISTS idx_repair_services_repair_order_id 
    ON repair_services (repair_order_id);

CREATE INDEX IF NOT EXISTS idx_repair_services_service_id 
    ON repair_services (service_id);

CREATE INDEX IF NOT EXISTS idx_service_parts_service_id 
    ON service_parts (service_id);

CREATE INDEX IF NOT EXISTS idx_service_parts_spare_part_id 
    ON service_parts (spare_part_id);

-- 7. Service Reminders Indexes
CREATE INDEX IF NOT EXISTS idx_service_reminders_customer_id 
    ON service_reminders (customer_id);

CREATE INDEX IF NOT EXISTS idx_service_reminders_vehicle_id 
    ON service_reminders (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_service_reminders_due_status 
    ON service_reminders (due_date, status);
