-- =============================================================================
-- CAMPAIGN-CENTRIC MARKETING AUTOMATION MIGRATION
-- =============================================================================
-- This migration adds comprehensive marketing automation and A/B testing
-- capabilities while maintaining the unified B2B/B2C schema approach.
-- 
-- Key Principle: Every lead is always in a campaign (except when on hold)
-- =============================================================================

-- Add 'on_hold' to contact lifecycle stages
ALTER TYPE contact_lifecycle_stage ADD VALUE IF NOT EXISTS 'on_hold';

-- Add hold-specific fields to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS current_campaign_id UUID,
ADD COLUMN IF NOT EXISTS campaign_assigned_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hold_reason TEXT,
ADD COLUMN IF NOT EXISTS hold_requested_by TEXT CHECK (hold_requested_by IN ('customer', 'agent', 'compliance')),
ADD COLUMN IF NOT EXISTS hold_notes TEXT,
ADD COLUMN IF NOT EXISTS auto_reengagement_enabled BOOLEAN DEFAULT true;

-- =============================================================================
-- CAMPAIGNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   description TEXT,
   
   -- Campaign type and channel
   campaign_type TEXT NOT NULL CHECK (campaign_type IN (
       'email', 'sms', 'phone', 'social', 'direct_mail', 'multi_channel', 
       'ai_automated', 'ai_nurture', 'on_hold', 'reengagement'
   )),
   objective TEXT CHECK (objective IN (
       'lead_generation', 'nurture', 'conversion', 'retention', 'winback', 
       'ai_qualification', 'ai_nurture', 'hold_management', 'reengagement'
   )),
   
   -- Unified audience targeting (works for B2B and B2C)
   audience_criteria JSONB DEFAULT '{}',
   exclusion_criteria JSONB DEFAULT '{}',
   
   -- Timing and status
   status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
   start_date TIMESTAMPTZ,
   end_date TIMESTAMPTZ,
   
   -- Budget and goals
   budget DECIMAL(12,2),
   target_metrics JSONB DEFAULT '{}',
   
   -- AI optimization
   ai_optimization_enabled BOOLEAN DEFAULT false,
   automation_rules JSONB DEFAULT '{}',
   
   -- Performance tracking
   total_targeted INTEGER DEFAULT 0,
   total_sent INTEGER DEFAULT 0,
   total_delivered INTEGER DEFAULT 0,
   total_opened INTEGER DEFAULT 0,
   total_clicked INTEGER DEFAULT 0,
   total_converted INTEGER DEFAULT 0,
   
   -- Ownership and timestamps
   owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- A/B TESTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS ab_tests (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
   
   name TEXT NOT NULL,
   hypothesis TEXT,
   test_type TEXT CHECK (test_type IN (
       'subject_line', 'content', 'send_time', 'call_script', 'landing_page', 'offer'
   )),
   
   -- Test configuration
   variants JSONB NOT NULL,
   traffic_allocation JSONB DEFAULT '{"control": 50, "variant_a": 50}',
   
   -- Test duration and status
   status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
   start_date TIMESTAMPTZ,
   end_date TIMESTAMPTZ,
   
   -- Statistical analysis
   success_metric TEXT NOT NULL,
   minimum_sample_size INTEGER DEFAULT 100,
   confidence_level DECIMAL(5,2) DEFAULT 95.0,
   statistical_significance DECIMAL(5,2),
   winner_variant TEXT,
   
   -- Results and AI analysis
   results JSONB DEFAULT '{}',
   ai_analysis JSONB DEFAULT '{}',
   ai_recommendations JSONB DEFAULT '{}',
   
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CAMPAIGN PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_participants (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
   ab_test_id UUID REFERENCES ab_tests(id) ON DELETE SET NULL,
   
   -- Unified targeting (B2B and B2C)
   contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
   account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
   
   -- Variant assignment
   variant_assigned TEXT,
   assigned_at TIMESTAMPTZ DEFAULT now(),
   
   -- Status tracking
   is_current BOOLEAN DEFAULT true,
   ended_at TIMESTAMPTZ,
   end_reason TEXT,
   
   -- Exclusions and conflicts
   excluded BOOLEAN DEFAULT false,
   exclusion_reason TEXT,
   
   -- Metadata
   metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- CAMPAIGN TRANSITIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    from_campaign_id UUID REFERENCES campaigns(id),
    to_campaign_id UUID NOT NULL REFERENCES campaigns(id),
    transition_reason TEXT NOT NULL,
    transition_data JSONB DEFAULT '{}',
    transitioned_at TIMESTAMPTZ DEFAULT now(),
    transitioned_by UUID REFERENCES users(id)
);

-- =============================================================================
-- RE-ENGAGEMENT SCHEDULE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS reengagement_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    notification_type TEXT CHECK (notification_type IN (
        'email_reminder', 'task_creation', 'calendar_event', 'ai_notification'
    )),
    
    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'executed', 'cancelled', 'failed')),
    executed_at TIMESTAMPTZ,
    
    -- Content
    notification_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- CAMPAIGN METRICS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_metrics (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
   ab_test_id UUID REFERENCES ab_tests(id),
   contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
   account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
   
   -- Engagement tracking
   sent_at TIMESTAMPTZ,
   delivered_at TIMESTAMPTZ,
   opened_at TIMESTAMPTZ,
   clicked_at TIMESTAMPTZ,
   responded_at TIMESTAMPTZ,
   converted_at TIMESTAMPTZ,
   
   -- Performance data
   variant_shown TEXT,
   conversion_value DECIMAL(12,2),
   attribution_weight DECIMAL(5,4) DEFAULT 1.0,
   
   -- Metadata for flexible tracking
   metadata JSONB DEFAULT '{}',
   created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- EXTEND EXISTING OPPORTUNITIES TABLE
-- =============================================================================
-- Add campaign context to opportunities
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id),
ADD COLUMN IF NOT EXISTS ab_test_id UUID REFERENCES ab_tests(id),
ADD COLUMN IF NOT EXISTS variant_shown TEXT;
