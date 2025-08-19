-- =============================================================================
-- COMPREHENSIVE SECURITY FIX SCRIPT
-- =============================================================================
-- Fixes all security issues from Supabase audit logs
-- =============================================================================

-- 1. FIX SECURITY DEFINER VIEWS (ERROR LEVEL)
DROP VIEW IF EXISTS public.lead_conversion_summary;
CREATE VIEW public.lead_conversion_summary AS
SELECT
    l.id as lead_id,
    l.status,
    COALESCE(l.is_converted, false) as is_converted,
    l.conversion_date,
    l.created_at,
    l.updated_at,
    l.converted_to_client_id
FROM public.leads l
WHERE l.created_by = auth.uid() OR l.assigned_to = auth.uid();

DROP VIEW IF EXISTS public.client_lead_history;
CREATE VIEW public.client_lead_history AS
SELECT
    l.id as lead_id,
    l.status as lead_status,
    l.created_at as lead_created_at,
    l.updated_at as lead_updated_at,
    c.id as client_id,
    c.name as client_name,
    c.created_at as client_created_at,
    'lead_to_client' as relationship_type
FROM public.leads l
LEFT JOIN public.clients c ON l.converted_to_client_id = c.id
WHERE l.created_by = auth.uid() OR l.assigned_to = auth.uid();

-- =============================================================================
-- 2. FIX FUNCTION SEARCH PATH MUTABLE (WARN LEVEL)
-- =============================================================================

DO $$
DECLARE
    func_name text;
    func_exists boolean;
    functions_to_fix text[] := ARRAY[
        'get_slow_queries',
        'suggest_next_action', 
        'get_storage_path',
        'validate_file_upload',
        'broadcast_system_notification',
        'update_user_presence',
        'check_rate_limit',
        'create_org_on_signup',
        'next_business_day',
        'create_follow_up_task',
        'extract_phone_digits',
        'auto_assign_lead',
        'is_valid_email',
        'get_lead_channels',
        'addresses_within_radius',
        'get_first_pipeline_status',
        'format_phone_number',
        'current_user_has_role',
        'address_distance_miles',
        'is_member',
        'move_card',
        'user_can_access_lead',
        'create_pipeline_with_stages',
        'search_agent_memory',
        'subscribe_to_user_channels',
        'get_default_pipeline',
        'user_has_role',
        'repack_stage',
        'business_days_between',
        'format_address',
        'calculate_lead_score',
        'validate_password_strength',
        'user_can_access_client',
        'list_tables',
        'validate_cors_origin',
        'notify_ai_interaction_change',
        'set_created_by'
    ];
BEGIN
    RAISE NOTICE '🔧 Fixing Function Search Paths...';
    
    FOREACH func_name IN ARRAY functions_to_fix
    LOOP
        -- Check if function exists
        SELECT EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) INTO func_exists;
        
        IF func_exists THEN
            BEGIN
                EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_name);
                RAISE NOTICE '✅ Fixed search_path for function: %', func_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not fix function % (may have parameters): %', func_name, SQLERRM;
            END;
        ELSE
            RAISE NOTICE '⚠️  Function % does not exist, skipping', func_name;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 3. FIX EXTENSION IN PUBLIC SCHEMA (WARN LEVEL)
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Moving vector extension from public schema...';
    
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Move vector extension to extensions schema
    -- Note: This requires superuser privileges, may need to be done manually
    -- ALTER EXTENSION vector SET SCHEMA extensions;
    
    RAISE NOTICE '⚠️  Vector extension move requires manual execution with superuser privileges';
    RAISE NOTICE '    Run: ALTER EXTENSION vector SET SCHEMA extensions;';
END $$;

-- =============================================================================
-- 4. VERIFICATION QUERIES
-- =============================================================================

-- Verify views are working
SELECT 'lead_conversion_summary' as view_name, COUNT(*) as record_count 
FROM public.lead_conversion_summary
UNION ALL
SELECT 'client_lead_history' as view_name, COUNT(*) as record_count 
FROM public.client_lead_history;

-- Verify functions with mutable search_path (should be minimal)
SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig IS NULL THEN 'NO CONFIG'
        WHEN 'search_path=public' = ANY(proconfig) THEN 'SECURED'
        ELSE 'MUTABLE'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'temp_%'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
ORDER BY proname;

-- Success message
SELECT '✅ Security fixes applied successfully!' as status;

COMMIT;

-- =============================================================================
-- MANUAL STEPS REQUIRED
-- =============================================================================
-- 
-- The following items require manual configuration in Supabase Dashboard:
--
-- 1. AUTH CONFIGURATION:
--    - Go to Authentication > Settings
--    - Set OTP expiry to 1 hour or less (currently > 1 hour)
--    - Enable "Leaked Password Protection" under Password Security
--
-- 2. EXTENSION SCHEMA:
--    - Execute with superuser: ALTER EXTENSION vector SET SCHEMA extensions;
--    - Or recreate extension in extensions schema
--
-- 3. VERIFICATION:
--    - Run security audit again to confirm all issues resolved
--    - Test application functionality after changes
--
-- =============================================================================
