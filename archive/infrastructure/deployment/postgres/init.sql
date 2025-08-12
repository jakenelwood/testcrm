-- 🐘 PostgreSQL Initialization Script for GardenOS Development
-- Sets up database with required extensions and basic schema for Supabase compatibility

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic roles for Supabase compatibility
DO $$
BEGIN
    -- Create anon role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    
    -- Create authenticated role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    
    -- Create service_role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Create a basic health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'database', current_database(),
        'version', version()
    );
$$;

-- Grant execute permission on health check function
GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated, service_role;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'GardenOS Development Database initialized successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_stat_statements, pgcrypto';
    RAISE NOTICE 'Roles created: anon, authenticated, service_role';
    RAISE NOTICE 'Health check function available at: SELECT public.health_check()';
END
$$;
