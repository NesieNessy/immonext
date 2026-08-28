-- Minimal Supabase Storage compatibility layer for the docker-compose
-- Postgres-only setup, alongside 00000000_local_supabase_shim.sql.
--
-- Why this exists: 20260403_tenancy_document_storage.sql and
-- 20260802_document_storage.sql insert buckets and define policies on
-- storage.objects. The `supabase/postgres` image ships Postgres plus
-- extensions, but not the Storage service's schema — that comes from the full
-- Supabase stack. Without this file, a fresh `docker-compose up` aborted at
-- 20260403 with `relation "storage.buckets" does not exist`, and because
-- docker-entrypoint-initdb.d runs psql with ON_ERROR_STOP, every migration
-- after it was silently skipped. The result was a local database that looked
-- functional but was missing document, tenancy_document, tenancy_person,
-- property_unit and everything else defined later.
--
-- LOCAL ONLY, same rule as the auth shim: every object is created only if it
-- is absent, so this is a no-op against hosted Supabase. The stand-ins are
-- deliberately minimal — just enough for the bucket inserts and the policy
-- definitions to parse and run. They do not emulate the Storage API.

CREATE SCHEMA IF NOT EXISTS storage;

-- Under `supabase start`, storage.buckets/storage.objects already exist as
-- the real Storage-API-managed tables (owned by supabase_admin), and our
-- migration role has no CREATE privilege on that schema — plain
-- `CREATE TABLE IF NOT EXISTS` still attempts the DDL and fails with
-- "permission denied for schema storage" before reaching its own existence
-- check (same issue as the auth shim). Gating the whole stand-in section on
-- one existence check, and running every statement here (including the
-- GRANTs below, which would equally be denied against the real, differently-
-- owned tables) via EXECUTE inside the same DO block, keeps this a true
-- no-op against the real stack.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
        EXECUTE $sql$
            CREATE TABLE storage.buckets (
                id                 TEXT PRIMARY KEY,
                name               TEXT NOT NULL,
                public             BOOLEAN NOT NULL DEFAULT FALSE,
                file_size_limit    BIGINT,
                allowed_mime_types TEXT[],
                created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        $sql$;

        EXECUTE $sql$
            CREATE TABLE storage.objects (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bucket_id  TEXT REFERENCES storage.buckets(id),
                name       TEXT NOT NULL,
                owner      UUID,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        $sql$;

        -- The migrations that follow define per-user policies on
        -- storage.objects; without RLS enabled those policies would exist
        -- but never be enforced.
        EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';

        EXECUTE 'GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated';
        EXECUTE 'GRANT SELECT ON storage.buckets TO anon, authenticated';
    END IF;
END
$$;

-- Splits an object path into its segments. Every storage policy in this
-- project scopes access via (storage.foldername(name))[1] = auth.uid()::text.
-- Created only if absent — never replace the real implementation.
DO $shim$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'storage' AND p.proname = 'foldername'
    ) THEN
        EXECUTE $fn$
            CREATE FUNCTION storage.foldername(name TEXT)
            RETURNS TEXT[]
            LANGUAGE sql
            IMMUTABLE
            AS $body$
                SELECT string_to_array(name, '/');
            $body$;
        $fn$;
    END IF;
END
$shim$;
