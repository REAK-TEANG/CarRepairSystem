-- ==============================================================================
-- Migration: 005_repair_orders_inspection_fields.sql
-- Adds odometer, fuel level, inspections, labor tracking, and approval fields
-- ==============================================================================

ALTER TABLE repair_orders 
    ADD COLUMN IF NOT EXISTS odometer INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fuel_level VARCHAR(20) DEFAULT '1/2',
    ADD COLUMN IF NOT EXISTS intake_inspection JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS qa_checklist JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS labor_minutes INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS labor_rate NUMERIC(10,2) DEFAULT 45.00,
    ADD COLUMN IF NOT EXISTS customer_approval VARCHAR(50) DEFAULT 'Approved',
    ADD COLUMN IF NOT EXISTS approved_amount NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS next_service_due_date DATE,
    ADD COLUMN IF NOT EXISTS next_service_due_km INT;

