-- ==============================================================================
-- Migration: 007_user_sessions_and_audit_logs.sql
-- Description: Creates tables for active user sessions telemetry and system audit logs
-- ==============================================================================

-- 1. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_token_hash VARCHAR(64),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50) DEFAULT 'Desktop',
    current_route VARCHAR(255) DEFAULT '/',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'closed', 'timed_out', 'revoked')),
    close_reason VARCHAR(50) CHECK (close_reason IN ('manual_logout', 'window_close', 'session_timeout', 'admin_revoked', 'expired')),
    login_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in case table was created previously with legacy schema
ALTER TABLE user_sessions 
    ADD COLUMN IF NOT EXISTS session_token_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'Desktop',
    ADD COLUMN IF NOT EXISTS current_route VARCHAR(255) DEFAULT '/',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS close_reason VARCHAR(50),
    ADD COLUMN IF NOT EXISTS login_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS logout_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_status ON user_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);

-- 2. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, SESSION_CLOSE, CREATE, UPDATE, DELETE, STATUS_CHANGE, EXPORT
    module VARCHAR(50) NOT NULL, -- auth, repair_jobs, customers, vehicles, inventory, invoices, appointments, settings, employees
    entity_id VARCHAR(100),      -- e.g. 'JOB-104', 'INV-55', Customer ID '12'
    description TEXT NOT NULL,   -- Human readable action summary
    changes JSONB,               -- Before / after changes diff or input payload
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON audit_logs(module, action);
