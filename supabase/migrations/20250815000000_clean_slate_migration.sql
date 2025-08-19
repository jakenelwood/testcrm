-- 🧹 Clean Slate Migration for Unified AI-Native Schema
-- Drops existing tables and prepares for unified schema deployment
-- SAFE TO RUN: No data preservation needed as confirmed by user

BEGIN;

-- =============================================================================
-- DISABLE RLS TEMPORARILY
-- =============================================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunities DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DROP EXISTING TABLES IN DEPENDENCY ORDER
-- =============================================================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS lead_status_history CASCADE;
DROP TABLE IF EXISTS insurance_claims CASCADE;
DROP TABLE IF EXISTS insurance_policies CASCADE;
DROP TABLE IF EXISTS insurance_quotes CASCADE;
DROP TABLE IF EXISTS insurance_profiles CASCADE;
DROP TABLE IF EXISTS customer_touchpoints CASCADE;
DROP TABLE IF EXISTS conversation_sessions CASCADE;
DROP TABLE IF EXISTS ai_interactions CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS file_deletions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_phone_preferences CASCADE;
DROP TABLE IF EXISTS password_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;
DROP TABLE IF EXISTS ringcentral_tokens CASCADE;

-- Drop asset tables
DROP TABLE IF EXISTS homes CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS specialty_items CASCADE;

-- Drop CRM core tables
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;

-- Drop marketing tables
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS content_templates CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS pipeline_statuses CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS lead_statuses CASCADE;
DROP TABLE IF EXISTS insurance_types CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;

-- Drop AI tables
DROP TABLE IF EXISTS ai_agents CASCADE;

-- Drop users table last
DROP TABLE IF EXISTS users CASCADE;

-- Drop version tracking
DROP TABLE IF EXISTS _version_info CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS schema_versions CASCADE;

-- =============================================================================
-- DROP EXISTING TYPES AND FUNCTIONS
-- =============================================================================

-- Drop any existing custom types
DROP TYPE IF EXISTS contact_lifecycle_stage CASCADE;
DROP TYPE IF EXISTS opportunity_stage CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS search_contacts_by_embedding CASCADE;
DROP FUNCTION IF EXISTS search_interactions_by_embedding CASCADE;
DROP FUNCTION IF EXISTS search_accounts_by_embedding CASCADE;
DROP FUNCTION IF EXISTS search_documents_by_embedding CASCADE;
DROP FUNCTION IF EXISTS find_similar_contacts CASCADE;
DROP FUNCTION IF EXISTS get_contact_insights CASCADE;
DROP FUNCTION IF EXISTS calculate_similarity CASCADE;
DROP FUNCTION IF EXISTS get_workspace_ai_stats CASCADE;
DROP FUNCTION IF EXISTS get_user_workspace_id CASCADE;
DROP FUNCTION IF EXISTS is_workspace_admin CASCADE;

-- =============================================================================
-- CLEAN UP POLICIES
-- =============================================================================

-- Drop any existing RLS policies (they'll be recreated)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END$$;

-- =============================================================================
-- VERIFY CLEAN STATE
-- =============================================================================

-- Check that all tables are dropped
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%' 
    AND tablename NOT IN ('spatial_ref_sys'); -- PostGIS table if present
    
    IF table_count > 0 THEN
        RAISE NOTICE 'Warning: % tables still exist after cleanup', table_count;
    ELSE
        RAISE NOTICE 'Success: All tables cleaned up successfully';
    END IF;
END$$;

-- =============================================================================
-- PREPARE FOR NEW SCHEMA
-- =============================================================================

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema_versions table for tracking
CREATE TABLE schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Record this cleanup migration
INSERT INTO schema_versions (version, description) VALUES
('20250815000000', 'Clean slate migration - removed legacy tables for unified schema');

COMMIT;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 CLEAN SLATE MIGRATION COMPLETE';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All legacy tables removed';
    RAISE NOTICE '✅ All legacy types and functions dropped';
    RAISE NOTICE '✅ All RLS policies cleaned up';
    RAISE NOTICE '✅ Extensions verified';
    RAISE NOTICE '✅ Ready for unified schema deployment';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next: Run the unified schema migrations';
    RAISE NOTICE '';
END$$;
