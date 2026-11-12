-- Tables, columns and indexes that were previously created lazily on live requests.
-- Idempotent: safe to run on databases that already have some or all of them.

-- Authentication / abuse protection ----------------------------------------
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash_exp ON token_blacklist (token_hash, expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    identifier VARCHAR(100) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON login_attempts (ip_address, identifier, attempted_at);

CREATE TABLE IF NOT EXISTS global_api_requests (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_global_requests_ip_time ON global_api_requests (ip_address, requested_at);

-- Sessions, audit trail, realtime events ------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_token_hash VARCHAR(64) NOT NULL UNIQUE,
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_status ON user_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON audit_logs(module, action);

CREATE TABLE IF NOT EXISTS system_events (
    id BIGSERIAL PRIMARY KEY,
    topic VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_events_lookup ON system_events (id DESC, topic);

-- Columns added after the initial schema ------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Workshop';

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

ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- One logged line per (job, part); collapse historical duplicates, then enforce it.
DELETE FROM repair_parts a
USING repair_parts b
WHERE a.id < b.id
  AND a.repair_order_id = b.repair_order_id
  AND a.spare_part_id = b.spare_part_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_parts_ro_sp_uniq ON repair_parts (repair_order_id, spare_part_id);

-- Speeds up the per-customer invoice aggregate on the customers list.
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
