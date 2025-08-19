-- =============================================================================
-- INSURANCE DATA SEPARATION MIGRATION
-- =============================================================================
-- This migration creates proper separation of concerns for insurance data:
-- - Contacts: Basic contact information only
-- - Opportunities: Deal-specific information with insurance details in JSONB
-- - Insurance Policies: Separate table for actual policies (post-sale)
-- - Insurance Quotes: Separate table for quotes and applications

-- =============================================================================
-- REMOVE INSURANCE FIELDS FROM CONTACTS TABLE
-- =============================================================================
-- Insurance-specific data should not be in the contacts table
-- It belongs in opportunities (for quotes) or policies (for active coverage)

-- Remove any insurance premium fields that might have been added to contacts
ALTER TABLE contacts 
DROP COLUMN IF EXISTS auto_premium,
DROP COLUMN IF EXISTS home_premium,
DROP COLUMN IF EXISTS specialty_premium,
DROP COLUMN IF EXISTS commercial_premium;

-- Remove insurance data JSONB fields from contacts
ALTER TABLE contacts 
DROP COLUMN IF EXISTS auto_data,
DROP COLUMN IF EXISTS home_data,
DROP COLUMN IF EXISTS specialty_data,
DROP COLUMN IF EXISTS auto_data_version,
DROP COLUMN IF EXISTS home_data_version,
DROP COLUMN IF EXISTS specialty_data_version;

-- Remove mailing address from contacts (this should be in opportunities if needed for quotes)
ALTER TABLE contacts 
DROP COLUMN IF EXISTS mailing_address,
DROP COLUMN IF EXISTS mailing_city,
DROP COLUMN IF EXISTS mailing_state,
DROP COLUMN IF EXISTS mailing_zip_code,
DROP COLUMN IF EXISTS education_occupation;

-- =============================================================================
-- REMOVE INSURANCE FIELDS FROM ACCOUNTS TABLE  
-- =============================================================================
-- Business insurance data should be in opportunities or policies, not accounts

ALTER TABLE accounts 
DROP COLUMN IF EXISTS year_established,
DROP COLUMN IF EXISTS commercial_premium,
DROP COLUMN IF EXISTS commercial_data,
DROP COLUMN IF EXISTS liability_data,
DROP COLUMN IF EXISTS commercial_data_version,
DROP COLUMN IF EXISTS liability_data_version,
DROP COLUMN IF EXISTS additional_insureds,
DROP COLUMN IF EXISTS additional_locations;

-- =============================================================================
-- ENHANCE OPPORTUNITIES TABLE FOR INSURANCE QUOTES
-- =============================================================================
-- Opportunities should contain all quote-specific insurance data

-- Ensure opportunities table has the coverage_details JSONB field
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS coverage_details JSONB DEFAULT '{}';

-- Add insurance-specific fields to opportunities
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS insurance_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_carrier TEXT,
ADD COLUMN IF NOT EXISTS current_premium DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quote_premium DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMPTZ;

-- Add AI fields for insurance recommendations
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_next_action TEXT,
ADD COLUMN IF NOT EXISTS ai_quote_recommendation TEXT,
ADD COLUMN IF NOT EXISTS ai_follow_up_priority TEXT;

-- =============================================================================
-- CREATE INSURANCE POLICIES TABLE
-- =============================================================================
-- Separate table for actual insurance policies (post-sale)

CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Relationships
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Policy basics
    policy_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('auto', 'home', 'life', 'business', 'health', 'umbrella', 'specialty')),
    
    -- Financial details
    premium_amount DECIMAL(10, 2) NOT NULL,
    deductible DECIMAL(10, 2),
    coverage_limit DECIMAL(12, 2),
    
    -- Policy period
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- Policy details (flexible JSONB for different policy types)
    policy_details JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    
    -- Ownership and tracking
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CREATE INSURANCE QUOTES TABLE
-- =============================================================================
-- Separate table for detailed quote information

CREATE TABLE IF NOT EXISTS insurance_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Relationships
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Quote basics
    quote_number TEXT,
    carrier TEXT NOT NULL,
    insurance_type TEXT NOT NULL CHECK (insurance_type IN ('auto', 'home', 'life', 'business', 'health', 'umbrella', 'specialty')),
    
    -- Financial details
    quoted_premium DECIMAL(10, 2) NOT NULL,
    deductible DECIMAL(10, 2),
    coverage_limits JSONB DEFAULT '{}',
    
    -- Quote validity
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at TIMESTAMPTZ,
    
    -- Quote details (flexible JSONB for different insurance types)
    quote_details JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'presented', 'accepted', 'declined', 'expired')),
    
    -- Ownership and tracking
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Insurance policies indexes
CREATE INDEX IF NOT EXISTS idx_insurance_policies_workspace_id ON insurance_policies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact_id ON insurance_policies(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_account_id ON insurance_policies(account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_opportunity_id ON insurance_policies(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_policy_number ON insurance_policies(workspace_id, policy_number);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_carrier ON insurance_policies(carrier);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiration ON insurance_policies(expiration_date);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status);

-- Insurance quotes indexes
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_workspace_id ON insurance_quotes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_opportunity_id ON insurance_quotes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_contact_id ON insurance_quotes(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_account_id ON insurance_quotes(account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_carrier ON insurance_quotes(carrier);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_expires_at ON insurance_quotes(expires_at);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_status ON insurance_quotes(status);

-- Opportunities insurance fields indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_insurance_types ON opportunities USING GIN(insurance_types);
CREATE INDEX IF NOT EXISTS idx_opportunities_current_carrier ON opportunities(current_carrier);
CREATE INDEX IF NOT EXISTS idx_opportunities_quote_expires_at ON opportunities(quote_expires_at);

-- =============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE insurance_policies IS 'Active insurance policies for contacts and accounts (post-sale)';
COMMENT ON TABLE insurance_quotes IS 'Insurance quotes and applications (pre-sale)';
COMMENT ON COLUMN opportunities.coverage_details IS 'JSONB field containing all insurance-specific details for quotes';
COMMENT ON COLUMN opportunities.insurance_types IS 'Array of insurance types for this opportunity (auto, home, life, etc.)';

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insurance_policies_updated_at 
    BEFORE UPDATE ON insurance_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_quotes_updated_at 
    BEFORE UPDATE ON insurance_quotes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LOG MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Insurance data separation migration completed successfully';
    RAISE NOTICE 'Insurance-specific fields removed from contacts and accounts tables';
    RAISE NOTICE 'Insurance data now properly separated into opportunities, policies, and quotes tables';
END $$;
