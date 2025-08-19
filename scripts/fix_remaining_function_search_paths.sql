-- Fix Search Path for Remaining Functions
-- This script addresses the remaining function search_path security warnings

-- =============================================================================
-- SET SEARCH_PATH FOR REMAINING FUNCTIONS
-- =============================================================================

-- Fix functions with correct parameter signatures
ALTER FUNCTION public.address_distance_miles(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) SET search_path = public, pg_temp;

ALTER FUNCTION public.addresses_within_radius(center_lat numeric, center_lng numeric, radius_miles numeric) SET search_path = public, pg_temp;

ALTER FUNCTION public.broadcast_system_notification(message text, notification_type text, target_roles text[]) SET search_path = public, pg_temp;

ALTER FUNCTION public.business_days_between(start_date date, end_date date) SET search_path = public, pg_temp;

ALTER FUNCTION public.check_rate_limit(endpoint_param text, ip_address_param inet, max_requests integer, window_minutes integer) SET search_path = public, pg_temp;

ALTER FUNCTION public.create_follow_up_task(lead_id_param uuid, task_type text, due_date timestamp with time zone, description text) SET search_path = public, pg_temp;

ALTER FUNCTION public.create_org_on_signup(p_name text) SET search_path = public, pg_temp;

ALTER FUNCTION public.extract_phone_digits(phone text) SET search_path = public, pg_temp;

ALTER FUNCTION public.format_address(street text, street2 text, city text, state text, zip_code text, country text) SET search_path = public, pg_temp;

ALTER FUNCTION public.format_phone_number(phone text) SET search_path = public, pg_temp;

ALTER FUNCTION public.get_slow_queries(limit_count integer) SET search_path = public, pg_temp;

ALTER FUNCTION public.get_storage_path(bucket_name text, entity_type text, entity_id uuid, filename text) SET search_path = public, pg_temp;

ALTER FUNCTION public.is_member(p_org uuid) SET search_path = public, pg_temp;

ALTER FUNCTION public.is_valid_email(email text) SET search_path = public, pg_temp;

ALTER FUNCTION public.move_card(p_card_id uuid, p_to_stage_id uuid, p_after_card_id uuid, p_before_card_id uuid) SET search_path = public, pg_temp;

ALTER FUNCTION public.next_business_day(input_date date, days_to_add integer) SET search_path = public, pg_temp;

ALTER FUNCTION public.repack_stage(p_stage_id uuid) SET search_path = public, pg_temp;

ALTER FUNCTION public.search_agent_memory(agent_id_param uuid, query_embedding vector, entity_type_param text, entity_id_param uuid, limit_param integer, similarity_threshold numeric) SET search_path = public, pg_temp;

ALTER FUNCTION public.suggest_next_action(lead_id_param uuid) SET search_path = public, pg_temp;

ALTER FUNCTION public.validate_cors_origin(origin_url text) SET search_path = public, pg_temp;

ALTER FUNCTION public.validate_file_upload(bucket_name text, file_path text, file_size bigint, mime_type text) SET search_path = public, pg_temp;

ALTER FUNCTION public.validate_password_strength(password text) SET search_path = public, pg_temp;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Check if all remaining functions now have proper search_path set
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as configuration
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

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- This script fixes search_path for 22 additional functions
-- All functions will now use 'public, pg_temp' search path for security
-- The remaining AUTH OTP EXPIRY warning needs to be fixed in Supabase Dashboard
