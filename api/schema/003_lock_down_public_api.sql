-- Lock down the database's public (Supabase Data API / PostgREST) surface.
--
-- The application connects as the table-owner role, which bypasses row level security, and
-- does its own authorization in PHP. So RLS is not used to restrict the API; it is used to make
-- sure the public roles (anon / authenticated) can reach NOTHING directly: RLS enabled on every
-- table with no policies, and no grants for those roles. Idempotent.
--
-- Replaces the conflicting database/migrations 003_disable_rls_or_policies.sql and
-- 004_enable_row_level_security.sql (the latter created allow-all policies such as
-- "SELECT ... USING (true)" on users, user_sessions and settings).

DO $$
DECLARE
    r record;
    public_role text;
BEGIN
    -- Safety guard: with RLS on and no policies, a role that cannot bypass RLS sees no rows.
    -- Refuse to continue rather than lock the API out of its own database.
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles
        WHERE rolname = current_user AND (rolbypassrls OR rolsuper)
    ) THEN
        RAISE EXCEPTION 'refusing to enable row level security: role % cannot bypass it, the API would lose access', current_user;
    END IF;

    -- 1. RLS on for every table, including ones created later by the application.
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;

    -- 2. No policies: drop the allow-all and session-variable policies.
    FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    END LOOP;

    -- 3. Supabase only: the public roles get no privileges on today's or tomorrow's objects.
    FOREACH public_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = public_role) THEN
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', public_role);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', public_role);
            EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', public_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM %I', current_user, public_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', current_user, public_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', current_user, public_role);
        END IF;
    END LOOP;
END $$;
