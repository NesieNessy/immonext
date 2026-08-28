-- Minimal Supabase compatibility layer for the docker-compose Postgres-only setup.
-- The full Supabase CLI stack normally provides these roles, schema objects and
-- auth helpers before project migrations are applied.
--
-- LOCAL ONLY. Every statement here must be a no-op where the real Supabase
-- objects already exist. In particular auth.uid() and auth.role() are CREATED
-- ONLY IF ABSENT, never CREATE OR REPLACE: the real auth.uid() also reads the
-- `request.jwt.claims` JSON that current GoTrue sets, which the stand-in below
-- does not. Overwriting it would make auth.uid() return NULL for every real
-- request — and with it, every RLS policy in this project would deny access to
-- everything. See 20260804_detail_check_rls.sql for how much now depends on it.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin LOGIN SUPERUSER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';
    END IF;
END
$$;

GRANT anon, authenticated, service_role TO authenticator;

-- Plain `CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_admin` still
-- fails with "must be member of role supabase_admin" even when the schema
-- already exists — Postgres checks permission to set the AUTHORIZATION
-- owner before the IF NOT EXISTS existence check short-circuits, so the
-- migration-runner role (not itself a member of supabase_admin) is rejected
-- outright under `supabase start`'s own stack, which pre-creates `auth`
-- (owned by supabase_admin) before project migrations run. Guarding on
-- pg_namespace instead avoids evaluating AUTHORIZATION at all in that case.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth AUTHORIZATION supabase_admin;
    END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hosted Supabase grants this; without it a direct `SELECT auth.uid()` fails
-- locally with "permission denied for schema auth" even though RLS policies
-- referencing it evaluate fine. Keeps local behaviour honest.
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Same reasoning as the schema guard above: under `supabase start`, auth.users
-- already exists (the real GoTrue-managed table, owned by supabase_admin) and
-- our migration role has no CREATE privilege on the auth schema — a plain
-- `CREATE TABLE IF NOT EXISTS` still attempts the DDL and fails with
-- "permission denied for schema auth" before reaching its own existence check.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        CREATE TABLE auth.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE,
            raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    END IF;
END
$$;

DO $shim$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) THEN
        EXECUTE $fn$
            CREATE FUNCTION auth.uid()
            RETURNS UUID
            LANGUAGE sql
            STABLE
            AS $body$
                SELECT COALESCE(
                    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
                    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
                )::uuid;
            $body$;
        $fn$;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'auth' AND p.proname = 'role'
    ) THEN
        EXECUTE $fn$
            CREATE FUNCTION auth.role()
            RETURNS TEXT
            LANGUAGE sql
            STABLE
            AS $body$
                SELECT COALESCE(
                    NULLIF(current_setting('request.jwt.claim.role', true), ''),
                    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
                    current_user
                );
            $body$;
        $fn$;
    END IF;
END
$shim$;
