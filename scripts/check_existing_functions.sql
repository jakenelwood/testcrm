-- Check what functions actually exist in the database
-- This will help us identify the correct function signatures

SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_config
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'get_first_pipeline_status', 'get_default_pipeline', 'repack_stage',
        'user_has_role', 'current_user_has_role', 'is_member', 'create_org_on_signup',
        'move_card', 'create_pipeline_with_stages', 'format_address', 'address_distance_miles',
        'addresses_within_radius', 'search_agent_memory', 'user_can_access_client',
        'user_can_access_lead', 'extract_phone_digits', 'is_valid_email',
        'calculate_lead_score', 'suggest_next_action', 'auto_assign_lead',
        'create_follow_up_task', 'format_phone_number', 'business_days_between',
        'next_business_day', 'subscribe_to_user_channels', 'get_lead_channels',
        'broadcast_system_notification', 'update_user_presence', 'check_rate_limit',
        'validate_cors_origin', 'get_slow_queries', 'validate_password_strength',
        'validate_file_upload', 'get_storage_path'
    )
ORDER BY proname;

-- Also check for any functions that might have similar names
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (proname ILIKE '%pipeline%' OR proname ILIKE '%user%' OR proname ILIKE '%lead%')
ORDER BY proname;
