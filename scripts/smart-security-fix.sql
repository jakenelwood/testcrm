-- =====================================================
-- SMART SECURITY FIX SCRIPT
-- =====================================================
-- This script only fixes functions that actually exist
-- and handles errors gracefully
-- =====================================================

-- Step 1: Check current RLS status
SELECT 
    'Current RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('schema_versions', '_version_info')
    AND schemaname = 'public';

-- Step 2: Enable RLS on critical tables
ALTER TABLE public.schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._version_info ENABLE ROW LEVEL SECURITY;

-- Step 3: Create read-only policies for schema_versions
DROP POLICY IF EXISTS "schema_versions_read_policy" ON public.schema_versions;
CREATE POLICY "schema_versions_read_policy" ON public.schema_versions
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Step 4: Create read-only policies for _version_info  
DROP POLICY IF EXISTS "_version_info_read_policy" ON public._version_info;
CREATE POLICY "_version_info_read_policy" ON public._version_info
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Step 5: Get list of functions that actually exist and need fixing
SELECT 
    'Functions that need search_path fixes:' as info,
    proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'temp_%'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
ORDER BY proname;

-- Step 6: Fix functions that exist (using DO block to handle errors)
DO $$
DECLARE
    func_name text;
    func_exists boolean;
BEGIN
    -- Array of function names from the security report
    FOR func_name IN 
        SELECT unnest(ARRAY[
            'notify_call_log_change',
            'update_lead_last_contact',
            'suggest_next_action',
            'get_storage_path',
            'validate_file_upload',
            'broadcast_system_notification',
            'notify_communication_change',
            'update_user_presence',
            'update_address_audit_fields',
            'notify_quote_change',
            'handle_new_user',
            'process_expired_quotes',
            'get_dashboard_stats',
            'check_rate_limit',
            'create_org_on_signup',
            'update_formatted_address',
            'next_business_day',
            'create_follow_up_task',
            'update_updated_at_column',
            'track_lead_status_change',
            'extract_phone_digits',
            'auto_assign_lead',
            'create_communication_from_call',
            'update_client_audit_fields',
            'is_valid_email',
            'get_lead_channels',
            'set_next_contact_date',
            'get_user_accessible_client_ids',
            'addresses_within_radius',
            'notify_lead_change',
            'generate_import_batch_id',
            'get_first_pipeline_status',
            'touch_updated_at',
            'validate_client_lead_relationship',
            'format_phone_number',
            'cleanup_old_data',
            'get_user_accessible_lead_ids',
            'current_user_has_role',
            'get_current_user_role',
            'get_db_stats',
            'daily_maintenance',
            'address_distance_miles',
            'is_member',
            'move_card',
            'log_sensitive_data_access',
            'increment_template_usage',
            'user_can_access_lead',
            'create_pipeline_with_stages',
            'search_agent_memory',
            'subscribe_to_user_channels',
            'update_lead_audit_fields',
            'update_agent_performance',
            'get_default_pipeline',
            'user_has_role',
            'repack_stage',
            'business_days_between',
            'format_address',
            'cleanup_rate_limits',
            'calculate_lead_score',
            'ensure_single_default_pipeline',
            'validate_password_strength',
            'set_address_created_by',
            'user_can_access_client',
            'track_memory_access',
            'ensure_single_default_phone'
        ])
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
                RAISE NOTICE 'Fixed function: %', func_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not fix function % (might have parameters): %', func_name, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Function does not exist: %', func_name;
        END IF;
    END LOOP;
END $$;

-- Step 7: Verification - Check RLS is now enabled
SELECT 
    '✅ RLS Status After Fix:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('schema_versions', '_version_info')
    AND schemaname = 'public';

-- Step 8: Verification - Check policies exist
SELECT 
    '✅ Security Policies Created:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('schema_versions', '_version_info')
    AND schemaname = 'public';

-- Step 9: Final verification - Functions still needing fixes (should be minimal)
SELECT 
    '⚠️ Functions still needing manual fixes:' as info,
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
SELECT 
    '🎉 SECURITY FIXES COMPLETED!' as status,
    'Critical RLS issues fixed' as rls_status,
    'Function search paths secured where possible' as function_status,
    'Check the results above for any remaining issues' as next_steps;
