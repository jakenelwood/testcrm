-- Check signatures for remaining functions that need search_path fixes
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as current_config
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'repack_stage', 'is_member', 'create_org_on_signup', 'move_card',
        'format_address', 'address_distance_miles', 'addresses_within_radius',
        'search_agent_memory', 'extract_phone_digits', 'is_valid_email',
        'suggest_next_action', 'create_follow_up_task', 'format_phone_number',
        'business_days_between', 'next_business_day', 'broadcast_system_notification',
        'check_rate_limit', 'validate_cors_origin', 'get_slow_queries',
        'validate_password_strength', 'validate_file_upload', 'get_storage_path'
    )
ORDER BY proname;
