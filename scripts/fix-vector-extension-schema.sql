-- =============================================================================
-- FIX VECTOR EXTENSION SCHEMA PLACEMENT
-- =============================================================================
-- Issue: Vector extension is installed in public schema (security warning)
-- Solution: Move to dedicated extensions schema
-- Risk Level: WARN (best practice, not critical)
-- =============================================================================

-- Check current extension placement
SELECT 
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';

-- =============================================================================
-- OPTION 1: MOVE EXISTING EXTENSION (Requires Superuser)
-- =============================================================================
-- This approach moves the existing extension to extensions schema
-- Note: Requires superuser privileges, may need to be executed by Supabase support

DO $$
BEGIN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Grant usage on extensions schema
    GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    
    RAISE NOTICE 'Extensions schema created and permissions granted';
    
    -- The following command requires superuser privileges:
    -- ALTER EXTENSION vector SET SCHEMA extensions;
    
    RAISE NOTICE 'To complete the fix, run as superuser:';
    RAISE NOTICE 'ALTER EXTENSION vector SET SCHEMA extensions;';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating extensions schema: %', SQLERRM;
END $$;

-- =============================================================================
-- OPTION 2: RECREATE EXTENSION (If Option 1 fails)
-- =============================================================================
-- This approach drops and recreates the extension in the correct schema
-- WARNING: This will temporarily remove vector functionality

/*
-- UNCOMMENT ONLY IF OPTION 1 FAILS AND YOU HAVE SUPERUSER ACCESS

DO $$
BEGIN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    GRANT CREATE ON SCHEMA extensions TO postgres;
    
    -- Drop existing extension (WARNING: This removes vector functionality temporarily)
    DROP EXTENSION IF EXISTS vector CASCADE;
    
    -- Recreate extension in extensions schema
    CREATE EXTENSION vector SCHEMA extensions;
    
    -- Grant usage on vector types to necessary roles
    GRANT USAGE ON TYPE extensions.vector TO anon, authenticated, service_role;
    
    RAISE NOTICE 'Vector extension recreated in extensions schema';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error recreating vector extension: %', SQLERRM;
    RAISE NOTICE 'You may need superuser privileges to complete this operation';
END $$;
*/

-- =============================================================================
-- UPDATE APPLICATION CODE (If extension is moved)
-- =============================================================================
-- After moving the extension, update any references in your application

-- Example: Update function that uses vector types
/*
CREATE OR REPLACE FUNCTION public.search_agent_memory(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.8,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        am.id,
        am.content,
        am.metadata,
        1 - (am.embedding <=> query_embedding) as similarity
    FROM public.agent_memory am
    WHERE 1 - (am.embedding <=> query_embedding) > match_threshold
    ORDER BY am.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check extension location after fix
SELECT 
    'Extension location check:' as info,
    e.extname as extension_name,
    n.nspname as schema_name,
    CASE 
        WHEN n.nspname = 'public' THEN '❌ Still in public schema'
        WHEN n.nspname = 'extensions' THEN '✅ Moved to extensions schema'
        ELSE '⚠️  In unexpected schema'
    END as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';

-- Check if extensions schema exists and has proper permissions
SELECT 
    'Extensions schema check:' as info,
    n.nspname as schema_name,
    array_agg(DISTINCT p.privilege_type) as permissions
FROM information_schema.schema_privileges p
RIGHT JOIN pg_namespace n ON n.nspname = p.schema_name
WHERE n.nspname = 'extensions'
GROUP BY n.nspname;

-- Check vector functions still work (if you have vector data)
/*
SELECT 
    'Vector functionality test:' as info,
    COUNT(*) as vector_columns_found
FROM information_schema.columns 
WHERE data_type = 'USER-DEFINED' 
  AND udt_name = 'vector';
*/

-- =============================================================================
-- MANUAL STEPS FOR SUPABASE CLOUD
-- =============================================================================

/*
For Supabase Cloud users, you may need to:

1. Contact Supabase support to move the extension with superuser privileges
2. Or use the SQL Editor with the following command:
   ALTER EXTENSION vector SET SCHEMA extensions;

3. Update your application code to reference the new schema:
   - Add 'extensions' to search_path in functions that use vector
   - Update any direct references to vector types
   - Test all vector-related functionality

4. Update your local development environment:
   - Run the same migration in your local Supabase instance
   - Update any seed data or test scripts
   - Verify all tests pass with the new schema

5. Monitor for any issues:
   - Check application logs for vector-related errors
   - Verify AI/ML features still work correctly
   - Test vector similarity searches
*/

-- =============================================================================
-- ROLLBACK PLAN (If issues occur)
-- =============================================================================

/*
If moving the extension causes issues, you can rollback:

1. Move extension back to public schema:
   ALTER EXTENSION vector SET SCHEMA public;

2. Or recreate in public schema:
   DROP EXTENSION vector CASCADE;
   CREATE EXTENSION vector SCHEMA public;

3. Restore any affected functions or data
*/

SELECT '✅ Vector extension schema fix script completed' as status;
SELECT 'Review the manual steps above to complete the fix' as next_steps;
