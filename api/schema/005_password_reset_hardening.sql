-- Password reset hardening: reset codes are stored as SHA-256 hashes and limited to a few
-- wrong guesses, and sessions can be closed because the password changed. Idempotent.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reset_token TEXT,
    ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reset_attempts INT NOT NULL DEFAULT 0;

-- Codes issued before this change were stored in plain text; they can no longer be matched.
UPDATE users SET reset_token = NULL, reset_expires_at = NULL, reset_attempts = 0
WHERE reset_token IS NOT NULL AND reset_token !~ '^[0-9a-f]{64}$';

-- Allow 'password_changed' as a reason a session was closed (replaces any earlier check).
DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.user_sessions'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%close_reason%'
    LOOP
        EXECUTE format('ALTER TABLE public.user_sessions DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_close_reason_check CHECK (
    close_reason IS NULL OR close_reason IN
    ('manual_logout', 'window_close', 'session_timeout', 'admin_revoked', 'expired', 'password_changed')
);
