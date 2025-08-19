-- =============================================================================
-- ADD MISSING OPPORTUNITY FIELDS
-- =============================================================================
-- This migration adds the missing fields to the opportunities table to match
-- the Drizzle schema definition.
-- =============================================================================

-- Add contact tracking fields
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_contact_attempts INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS last_contact_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_contact_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pause_duration_days INTEGER DEFAULT 49;

-- Add quote response tracking fields
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS maybe_followup_days INTEGER DEFAULT 7;

-- Add stage_changed_at if it doesn't exist (it should already exist from the original migration)
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now();

-- Update the stage enum to match the Drizzle schema
-- First, check if we need to update the enum values
DO $$
BEGIN
    -- Update the opportunity_stage enum to include all the stages from Drizzle schema
    -- Note: This is a simplified approach. In production, you'd want to handle this more carefully.
    
    -- Add new enum values if they don't exist
    -- Note: 'start' is not needed - using 'prospecting' as the initial stage
    -- BEGIN
    --     ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'start';
    -- EXCEPTION
    --     WHEN duplicate_object THEN NULL;
    -- END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'attempting_contact';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'contacted_no_interest';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'contacted_interested';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'quoted';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'quote_yes';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'quote_no_followup_ok';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'quote_no_dont_contact';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'quote_maybe';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'proposed';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'paused';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'future_follow_up_date';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Keep the default stage as 'prospecting' (which is already defined in the enum)
-- ALTER TABLE opportunities ALTER COLUMN stage SET DEFAULT 'prospecting'; -- Already set in unified schema

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_attempts ON opportunities(contact_attempts);
CREATE INDEX IF NOT EXISTS idx_opportunities_paused_until ON opportunities(paused_until) WHERE paused_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_next_contact_date ON opportunities(next_contact_date) WHERE next_contact_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_changed_at ON opportunities(stage_changed_at);
