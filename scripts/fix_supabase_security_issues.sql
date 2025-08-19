-- Fix Supabase Security Issues
-- This script addresses the security errors and warnings from the database linter

-- =============================================================================
-- 1. FIX SECURITY DEFINER VIEWS (ERRORS)
-- =============================================================================

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.client_lead_history;
DROP VIEW IF EXISTS public.lead_conversion_summary;

-- Note: You'll need to recreate these views with the original logic but without SECURITY DEFINER
-- The views will need to be recreated manually based on your business logic
-- Example structure (replace with actual view definitions):

-- CREATE VIEW public.client_lead_history AS
-- SELECT ... FROM ... WHERE ...;

-- CREATE VIEW public.lead_conversion_summary AS  
-- SELECT ... FROM ... WHERE ...;

-- =============================================================================
-- 2. FIX FUNCTION SEARCH PATH ISSUES (WARNINGS)
-- =============================================================================

-- Set search_path for all functions to prevent security vulnerabilities
-- This ensures functions use a predictable schema search order
-- Using correct function signatures based on actual database

-- Functions that exist with correct signatures:
ALTER FUNCTION public.get_first_pipeline_status(pipeline_id_param integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_default_pipeline(lead_type_param text) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_has_role(user_id uuid, required_role text) SET search_path = public, pg_temp;
ALTER FUNCTION public.current_user_has_role(required_role text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_pipeline_with_stages(p_org_id uuid, p_name text, p_stage_names text[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_can_access_client(client_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_can_access_lead(lead_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_lead_score(lead_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_assign_lead(lead_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.subscribe_to_user_channels(user_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_lead_channels(lead_id_param uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_user_presence(status text, activity text) SET search_path = public, pg_temp;

-- Additional functions found in your database:
ALTER FUNCTION public.ensure_single_default_pipeline() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_current_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_accessible_client_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_accessible_lead_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_lead_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.track_lead_status_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_lead_audit_fields() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_lead_last_contact() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_client_lead_relationship() SET search_path = public, pg_temp;

-- =============================================================================
-- NOTES FOR MANUAL CONFIGURATION (Auth Settings)
-- =============================================================================

-- The following issues need to be fixed in the Supabase Dashboard:
-- 
-- 1. AUTH OTP EXPIRY:
--    - Go to Authentication > Settings in Supabase Dashboard
--    - Set OTP expiry to less than 1 hour (recommended: 15-30 minutes)
--
-- 2. LEAKED PASSWORD PROTECTION:
--    - Go to Authentication > Settings in Supabase Dashboard  
--    - Enable "Leaked Password Protection" feature
--    - This will check passwords against HaveIBeenPwned.org database

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if functions now have proper search_path set
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    proconfig as configuration
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'get_first_pipeline_status', 'get_default_pipeline', 'user_has_role',
        'current_user_has_role', 'create_pipeline_with_stages', 'user_can_access_client',
        'user_can_access_lead', 'calculate_lead_score', 'auto_assign_lead',
        'subscribe_to_user_channels', 'get_lead_channels', 'update_user_presence',
        'ensure_single_default_pipeline', 'get_current_user_role', 'get_user_accessible_client_ids',
        'get_user_accessible_lead_ids', 'handle_new_user', 'notify_lead_change',
        'track_lead_status_change', 'update_lead_audit_fields', 'update_lead_last_contact',
        'validate_client_lead_relationship'
    )
ORDER BY proname;

-- Check for any remaining SECURITY DEFINER views
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND definition ILIKE '%security definer%';
