-- ==============================================================================
-- Migration: 006_employees_department_column.sql
-- Adds department column to employees table (required by EmployeeModel.php)
-- ==============================================================================

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Workshop';

