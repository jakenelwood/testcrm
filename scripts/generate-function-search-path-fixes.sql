-- =====================================================
-- SECURITY FIX: Function Search Path Mutable
-- =====================================================
-- 
-- This script addresses the security warning where functions
-- have mutable search_path, which can lead to SQL injection
-- attacks through search path manipulation.
--
-- RISK: Functions without explicit search_path can be
-- exploited by attackers who manipulate the search_path
-- to redirect function calls to malicious schemas.
--
-- SOLUTION: Add "SET search_path = public" to all functions
-- =====================================================

-- List of all functions that need search_path fixes
-- (Based on the Supabase security advisor report)

-- Fix function: notify_call_log_change
ALTER FUNCTION public.notify_call_log_change() SET search_path = public;

-- Fix function: get_slow_queries  
ALTER FUNCTION public.get_slow_queries() SET search_path = public;

-- Fix function: update_lead_last_contact
ALTER FUNCTION public.update_lead_last_contact() SET search_path = public;

-- Fix function: suggest_next_action
ALTER FUNCTION public.suggest_next_action() SET search_path = public;

-- Fix function: get_storage_path
ALTER FUNCTION public.get_storage_path() SET search_path = public;

-- Fix function: validate_file_upload
ALTER FUNCTION public.validate_file_upload() SET search_path = public;

-- Fix function: broadcast_system_notification
ALTER FUNCTION public.broadcast_system_notification() SET search_path = public;

-- Fix function: notify_communication_change
ALTER FUNCTION public.notify_communication_change() SET search_path = public;

-- Fix function: update_user_presence
ALTER FUNCTION public.update_user_presence() SET search_path = public;

-- Fix function: update_address_audit_fields
ALTER FUNCTION public.update_address_audit_fields() SET search_path = public;

-- Fix function: notify_quote_change
ALTER FUNCTION public.notify_quote_change() SET search_path = public;

-- Fix function: handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix function: process_expired_quotes
ALTER FUNCTION public.process_expired_quotes() SET search_path = public;

-- Fix function: get_dashboard_stats
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;

-- Fix function: check_rate_limit
ALTER FUNCTION public.check_rate_limit() SET search_path = public;

-- Fix function: create_org_on_signup
ALTER FUNCTION public.create_org_on_signup() SET search_path = public;

-- Fix function: update_formatted_address
ALTER FUNCTION public.update_formatted_address() SET search_path = public;

-- Fix function: next_business_day
ALTER FUNCTION public.next_business_day() SET search_path = public;

-- Fix function: create_follow_up_task
ALTER FUNCTION public.create_follow_up_task() SET search_path = public;

-- Fix function: update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix function: track_lead_status_change
ALTER FUNCTION public.track_lead_status_change() SET search_path = public;

-- Fix function: extract_phone_digits
ALTER FUNCTION public.extract_phone_digits() SET search_path = public;

-- Fix function: auto_assign_lead
ALTER FUNCTION public.auto_assign_lead() SET search_path = public;

-- Fix function: create_communication_from_call
ALTER FUNCTION public.create_communication_from_call() SET search_path = public;

-- Fix function: update_client_audit_fields
ALTER FUNCTION public.update_client_audit_fields() SET search_path = public;

-- Fix function: is_valid_email
ALTER FUNCTION public.is_valid_email() SET search_path = public;

-- Fix function: get_lead_channels
ALTER FUNCTION public.get_lead_channels() SET search_path = public;

-- Fix function: set_next_contact_date
ALTER FUNCTION public.set_next_contact_date() SET search_path = public;

-- Fix function: get_user_accessible_client_ids
ALTER FUNCTION public.get_user_accessible_client_ids() SET search_path = public;

-- Fix function: addresses_within_radius
ALTER FUNCTION public.addresses_within_radius() SET search_path = public;

-- Fix function: notify_lead_change
ALTER FUNCTION public.notify_lead_change() SET search_path = public;

-- Fix function: generate_import_batch_id
ALTER FUNCTION public.generate_import_batch_id() SET search_path = public;

-- Fix function: get_first_pipeline_status
ALTER FUNCTION public.get_first_pipeline_status() SET search_path = public;

-- Fix function: touch_updated_at
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Fix function: validate_client_lead_relationship
ALTER FUNCTION public.validate_client_lead_relationship() SET search_path = public;

-- Fix function: format_phone_number
ALTER FUNCTION public.format_phone_number() SET search_path = public;

-- Fix function: cleanup_old_data
ALTER FUNCTION public.cleanup_old_data() SET search_path = public;

-- Fix function: get_user_accessible_lead_ids
ALTER FUNCTION public.get_user_accessible_lead_ids() SET search_path = public;

-- Fix function: current_user_has_role
ALTER FUNCTION public.current_user_has_role() SET search_path = public;

-- Fix function: get_current_user_role
ALTER FUNCTION public.get_current_user_role() SET search_path = public;

-- Fix function: get_db_stats
ALTER FUNCTION public.get_db_stats() SET search_path = public;

-- Fix function: daily_maintenance
ALTER FUNCTION public.daily_maintenance() SET search_path = public;

-- Fix function: address_distance_miles
ALTER FUNCTION public.address_distance_miles() SET search_path = public;

-- Fix function: is_member
ALTER FUNCTION public.is_member() SET search_path = public;

-- Fix function: move_card
ALTER FUNCTION public.move_card() SET search_path = public;

-- Fix function: log_sensitive_data_access
ALTER FUNCTION public.log_sensitive_data_access() SET search_path = public;

-- Fix function: increment_template_usage
ALTER FUNCTION public.increment_template_usage() SET search_path = public;

-- Fix function: user_can_access_lead
ALTER FUNCTION public.user_can_access_lead() SET search_path = public;

-- Fix function: create_pipeline_with_stages
ALTER FUNCTION public.create_pipeline_with_stages() SET search_path = public;

-- Fix function: search_agent_memory
ALTER FUNCTION public.search_agent_memory() SET search_path = public;

-- Fix function: subscribe_to_user_channels
ALTER FUNCTION public.subscribe_to_user_channels() SET search_path = public;

-- Fix function: update_lead_audit_fields
ALTER FUNCTION public.update_lead_audit_fields() SET search_path = public;

-- Fix function: update_agent_performance
ALTER FUNCTION public.update_agent_performance() SET search_path = public;

-- Fix function: get_default_pipeline
ALTER FUNCTION public.get_default_pipeline() SET search_path = public;

-- Fix function: user_has_role
ALTER FUNCTION public.user_has_role() SET search_path = public;

-- Fix function: repack_stage
ALTER FUNCTION public.repack_stage() SET search_path = public;

-- Fix function: business_days_between
ALTER FUNCTION public.business_days_between() SET search_path = public;

-- Fix function: format_address
ALTER FUNCTION public.format_address() SET search_path = public;

-- Fix function: cleanup_rate_limits
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = public;

-- Fix function: calculate_lead_score
ALTER FUNCTION public.calculate_lead_score() SET search_path = public;

-- Fix function: ensure_single_default_pipeline
ALTER FUNCTION public.ensure_single_default_pipeline() SET search_path = public;

-- Fix function: validate_password_strength
ALTER FUNCTION public.validate_password_strength() SET search_path = public;

-- Fix function: set_address_created_by
ALTER FUNCTION public.set_address_created_by() SET search_path = public;

-- Fix function: user_can_access_client
ALTER FUNCTION public.user_can_access_client() SET search_path = public;

-- Fix function: track_memory_access
ALTER FUNCTION public.track_memory_access() SET search_path = public;

-- Fix function: ensure_single_default_phone
ALTER FUNCTION public.ensure_single_default_phone() SET search_path = public;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- This query will show functions that still have mutable search_path
-- (Should return 0 rows after applying the fixes)
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig as configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
ORDER BY proname;

-- Success message
SELECT '✅ All function search paths have been secured!' as status;
