-- Add missing insurance fields to support comprehensive opportunity management
-- This migration adds fields that were present in the leads system but missing from the unified schema

-- =============================================================================
-- CONTACTS TABLE ENHANCEMENTS (Personal Insurance Fields)
-- =============================================================================

-- Add mailing address fields
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS mailing_address TEXT,
ADD COLUMN IF NOT EXISTS mailing_city TEXT,
ADD COLUMN IF NOT EXISTS mailing_state TEXT,
ADD COLUMN IF NOT EXISTS mailing_zip_code TEXT;

-- Add education/occupation field (rename existing occupation to be more specific)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS education_occupation TEXT;

-- Add premium fields for personal insurance
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS auto_premium DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS home_premium DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS specialty_premium DECIMAL(10, 2);

-- Add insurance data JSONB fields for detailed coverage information
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS auto_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS home_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialty_data JSONB DEFAULT '{}';

-- Add insurance data version tracking for schema evolution
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS auto_data_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS home_data_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS specialty_data_version INTEGER DEFAULT 1;

-- =============================================================================
-- ACCOUNTS TABLE ENHANCEMENTS (Business Insurance Fields)
-- =============================================================================

-- Add year established field
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS year_established TEXT;

-- Add commercial insurance premium field
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS commercial_premium DECIMAL(10, 2);

-- Add business insurance data JSONB fields
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS commercial_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS liability_data JSONB DEFAULT '{}';

-- Add business relationship fields
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS additional_insureds JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS additional_locations JSONB DEFAULT '[]';

-- Add insurance data version tracking
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS commercial_data_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS liability_data_version INTEGER DEFAULT 1;

-- =============================================================================
-- OPPORTUNITIES TABLE ENHANCEMENTS (AI & Deal-Specific Fields)
-- =============================================================================

-- Add AI fields for enhanced opportunity management
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_next_action TEXT,
ADD COLUMN IF NOT EXISTS ai_quote_recommendation TEXT,
ADD COLUMN IF NOT EXISTS ai_follow_up_priority INTEGER;

-- Add premium field for opportunity-specific premium tracking
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS premium DECIMAL(10, 2);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on premium fields for reporting and filtering
CREATE INDEX IF NOT EXISTS idx_contacts_auto_premium ON contacts(auto_premium) WHERE auto_premium IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_home_premium ON contacts(home_premium) WHERE home_premium IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_specialty_premium ON contacts(specialty_premium) WHERE specialty_premium IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_commercial_premium ON accounts(commercial_premium) WHERE commercial_premium IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_premium ON opportunities(premium) WHERE premium IS NOT NULL;

-- Index on AI priority for task management
CREATE INDEX IF NOT EXISTS idx_opportunities_ai_follow_up_priority ON opportunities(ai_follow_up_priority) WHERE ai_follow_up_priority IS NOT NULL;

-- Index on year established for business analysis
CREATE INDEX IF NOT EXISTS idx_accounts_year_established ON accounts(year_established) WHERE year_established IS NOT NULL;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN contacts.mailing_address IS 'Mailing address if different from physical address';
COMMENT ON COLUMN contacts.education_occupation IS 'Education level and occupation information';
COMMENT ON COLUMN contacts.auto_data IS 'Detailed auto insurance information (drivers, vehicles, coverages)';
COMMENT ON COLUMN contacts.home_data IS 'Detailed home insurance information (property details, coverages)';
COMMENT ON COLUMN contacts.specialty_data IS 'Detailed specialty insurance information (motorcycles, boats, etc.)';

COMMENT ON COLUMN accounts.commercial_data IS 'Detailed commercial insurance information (property, liability, etc.)';
COMMENT ON COLUMN accounts.liability_data IS 'Detailed liability insurance information';
COMMENT ON COLUMN accounts.additional_insureds IS 'Array of additional insured parties';
COMMENT ON COLUMN accounts.additional_locations IS 'Array of additional business locations';

COMMENT ON COLUMN opportunities.ai_summary IS 'AI-generated summary of opportunity status';
COMMENT ON COLUMN opportunities.ai_next_action IS 'AI-recommended next action';
COMMENT ON COLUMN opportunities.ai_quote_recommendation IS 'AI-generated quote recommendations';
COMMENT ON COLUMN opportunities.ai_follow_up_priority IS 'AI-calculated follow-up priority (1-10)';
