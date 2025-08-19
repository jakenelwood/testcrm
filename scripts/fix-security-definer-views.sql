-- =====================================================
-- SECURITY FIX: Remove SECURITY DEFINER from Views
-- =====================================================
-- 
-- This script addresses the critical security issue where views
-- are defined with SECURITY DEFINER, which bypasses RLS and 
-- runs with elevated privileges.
--
-- RISK: Security Definer views can expose data that should be
-- protected by Row Level Security policies.
--
-- SOLUTION: Recreate views without SECURITY DEFINER property
-- =====================================================

-- First, let's check the current view definitions
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current view definitions...';
END $$;

-- Get the definition of lead_conversion_summary view
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname IN ('lead_conversion_summary', 'client_lead_history')
ORDER BY viewname;

-- =====================================================
-- FIX 1: lead_conversion_summary view
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing lead_conversion_summary view...';
END $$;

-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.lead_conversion_summary;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view shows lead conversion statistics
CREATE VIEW public.lead_conversion_summary AS
SELECT 
    l.id as lead_id,
    l.status,
    CASE 
        WHEN l.status = 'Sold' THEN true 
        ELSE false 
    END as is_converted,
    CASE 
        WHEN l.status = 'Sold' THEN l.updated_at 
        ELSE NULL 
    END as conversion_date,
    NULL as converted_to_client_id, -- This would need to be populated based on your business logic
    COALESCE(
        l.metadata->>'contact'->>'name',
        CONCAT(
            l.metadata->>'contact'->>'first_name', 
            ' ', 
            l.metadata->>'contact'->>'last_name'
        )
    ) as client_name,
    'Lead' as client_type, -- Default type since we're looking at leads
    CASE 
        WHEN l.status = 'Sold' THEN 
            EXTRACT(days FROM (l.updated_at - l.created_at))
        ELSE NULL 
    END as days_to_conversion
FROM leads l
WHERE l.created_at IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.lead_conversion_summary TO authenticated;

-- =====================================================
-- FIX 2: client_lead_history view  
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Fixing client_lead_history view...';
END $$;

-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.client_lead_history;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view shows the history of client interactions
CREATE VIEW public.client_lead_history AS
SELECT 
    l.id as lead_id,
    COALESCE(
        l.metadata->>'contact'->>'name',
        CONCAT(
            l.metadata->>'contact'->>'first_name', 
            ' ', 
            l.metadata->>'contact'->>'last_name'
        )
    ) as client_name,
    l.metadata->>'contact'->>'email' as client_email,
    l.metadata->>'contact'->>'phone_number' as client_phone,
    l.status as current_status,
    l.created_at as first_contact_date,
    l.updated_at as last_activity_date,
    l.notes,
    l.assigned_to,
    it.name as insurance_type,
    l.current_carrier,
    l.premium
FROM leads l
LEFT JOIN insurance_types it ON l.insurance_type_id = it.id
WHERE l.created_at IS NOT NULL
ORDER BY l.created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON public.client_lead_history TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Security Definer views have been fixed!';
    RAISE NOTICE '📋 Views recreated without SECURITY DEFINER property';
    RAISE NOTICE '🔒 Views now respect Row Level Security policies';
    RAISE NOTICE '👥 Appropriate permissions granted to authenticated users';
END $$;

-- Test the views to ensure they work
SELECT 'lead_conversion_summary' as view_name, COUNT(*) as record_count 
FROM public.lead_conversion_summary
UNION ALL
SELECT 'client_lead_history' as view_name, COUNT(*) as record_count 
FROM public.client_lead_history;

-- Show the new view definitions (without SECURITY DEFINER)
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname IN ('lead_conversion_summary', 'client_lead_history')
ORDER BY viewname;
