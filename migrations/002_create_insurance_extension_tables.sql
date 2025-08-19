-- Migration 002: Create Insurance Extension Tables
-- Creates insurance-specific tables that extend the core CRM

BEGIN;

-- =====================================================
-- INSURANCE_PROFILES TABLE - Insurance-specific contact data
-- =====================================================
CREATE TABLE IF NOT EXISTS insurance_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to core contact
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Current insurance information
    current_carrier TEXT,
    current_policy_expiry DATE,
    premium_budget NUMERIC(10,2),
    payment_preference TEXT CHECK (payment_preference IN ('monthly', 'quarterly', 'semi-annual', 'annual')),
    
    -- Insurance data (flexible JSONB structure)
    auto_data JSONB DEFAULT '{}', -- vehicles, drivers, coverage preferences
    home_data JSONB DEFAULT '{}', -- properties, coverage details
    commercial_data JSONB DEFAULT '{}', -- business insurance needs
    specialty_data JSONB DEFAULT '{}', -- boats, RVs, motorcycles, etc.
    
    -- Risk assessment and preferences
    risk_factors JSONB DEFAULT '{}', -- driving record, claims history, credit score factors
    coverage_preferences JSONB DEFAULT '{}', -- preferred deductibles, coverage limits
    claims_history JSONB DEFAULT '{}', -- past claims across all policy types
    
    -- AI insurance insights
    ai_risk_assessment JSONB DEFAULT '{}',
    ai_coverage_recommendations JSONB DEFAULT '{}',
    ai_pricing_factors JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one profile per contact
    UNIQUE(contact_id)
);

-- =====================================================
-- INSURANCE_QUOTES TABLE - Detailed quote information
-- =====================================================
CREATE TABLE IF NOT EXISTS insurance_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to opportunity (not contact directly)
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    insurance_type_id INTEGER REFERENCES insurance_types(id),
    
    -- Quote identification
    quote_number TEXT NOT NULL UNIQUE,
    
    -- Financial details
    premium_amount NUMERIC(10,2) NOT NULL,
    deductible NUMERIC(10,2),
    fees NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) GENERATED ALWAYS AS (premium_amount + COALESCE(fees, 0)) STORED,
    
    -- Terms
    contract_term TEXT CHECK (contract_term IN ('6mo', '12mo', '24mo')),
    effective_date DATE,
    expiration_date DATE,
    
    -- Coverage details (flexible structure for different insurance types)
    coverage_details JSONB DEFAULT '{}',
    policy_limits JSONB DEFAULT '{}',
    exclusions JSONB DEFAULT '{}',
    
    -- Quote status and workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'declined', 'expired', 'bound')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- AI analysis
    ai_risk_assessment JSONB DEFAULT '{}',
    ai_pricing_factors JSONB DEFAULT '{}',
    ai_recommendations JSONB DEFAULT '{}',
    
    -- Comparison data
    competitor_quotes JSONB DEFAULT '{}', -- for comparison tracking
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSURANCE_POLICIES TABLE - Active policies
-- =====================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to contact (policies belong to contacts)
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    insurance_type_id INTEGER REFERENCES insurance_types(id),
    
    -- Policy identification
    policy_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    
    -- Policy details
    policy_type TEXT NOT NULL,
    premium_amount NUMERIC(10,2) NOT NULL,
    deductible NUMERIC(10,2),
    
    -- Coverage period
    effective_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_date DATE,
    
    -- Coverage details
    coverage_details JSONB DEFAULT '{}',
    policy_limits JSONB DEFAULT '{}',
    beneficiaries JSONB DEFAULT '{}',
    
    -- Policy status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended', 'pending')),
    cancellation_reason TEXT,
    cancellation_date DATE,
    
    -- Payment information
    payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual')),
    next_payment_due DATE,
    auto_pay_enabled BOOLEAN DEFAULT FALSE,
    
    -- Claims and history
    claims_count INTEGER DEFAULT 0,
    last_claim_date DATE,
    claims_history JSONB DEFAULT '{}',
    
    -- Renewal tracking
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    renewal_quote_id UUID REFERENCES insurance_quotes(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSURANCE_CLAIMS TABLE - Claims tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Claim identification
    claim_number TEXT NOT NULL UNIQUE,
    carrier_claim_number TEXT,
    
    -- Claim details
    claim_type TEXT NOT NULL,
    incident_date DATE NOT NULL,
    reported_date DATE NOT NULL,
    description TEXT,
    
    -- Financial details
    claimed_amount NUMERIC(12,2),
    deductible_amount NUMERIC(10,2),
    settlement_amount NUMERIC(12,2),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'approved', 'denied', 'settled', 'closed')),
    
    -- Important dates
    adjuster_assigned_date DATE,
    settlement_date DATE,
    closed_date DATE,
    
    -- Claim details
    fault_determination TEXT,
    police_report_number TEXT,
    adjuster_name TEXT,
    adjuster_contact TEXT,
    
    -- Documentation
    documents JSONB DEFAULT '{}', -- file references, photos, etc.
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Insurance profiles indexes
CREATE INDEX IF NOT EXISTS idx_insurance_profiles_contact ON insurance_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_profiles_carrier ON insurance_profiles(current_carrier);
CREATE INDEX IF NOT EXISTS idx_insurance_profiles_expiry ON insurance_profiles(current_policy_expiry);

-- Insurance quotes indexes
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_opportunity ON insurance_quotes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_type ON insurance_quotes(insurance_type_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_status ON insurance_quotes(status);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_number ON insurance_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_expires ON insurance_quotes(expires_at);

-- Insurance policies indexes
CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact ON insurance_policies(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_type ON insurance_policies(insurance_type_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_number ON insurance_policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiry ON insurance_policies(expiry_date);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_renewal ON insurance_policies(renewal_date);

-- Insurance claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_contact ON insurance_claims(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_number ON insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_incident_date ON insurance_claims(incident_date);

-- =====================================================
-- TRIGGERS for audit fields
-- =====================================================

-- Apply update triggers to insurance tables
CREATE TRIGGER update_insurance_profiles_updated_at 
    BEFORE UPDATE ON insurance_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_quotes_updated_at 
    BEFORE UPDATE ON insurance_quotes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at 
    BEFORE UPDATE ON insurance_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at 
    BEFORE UPDATE ON insurance_claims 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUSINESS LOGIC TRIGGERS
-- =====================================================

-- Function to update policy claims count
CREATE OR REPLACE FUNCTION update_policy_claims_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE insurance_policies 
        SET claims_count = claims_count + 1,
            last_claim_date = NEW.incident_date
        WHERE id = NEW.policy_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE insurance_policies 
        SET claims_count = claims_count - 1
        WHERE id = OLD.policy_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain claims count
CREATE TRIGGER update_policy_claims_count_trigger
    AFTER INSERT OR DELETE ON insurance_claims
    FOR EACH ROW EXECUTE FUNCTION update_policy_claims_count();

COMMIT;

-- Add comments for documentation
COMMENT ON TABLE insurance_profiles IS 'Insurance-specific data for contacts - extends core CRM';
COMMENT ON TABLE insurance_quotes IS 'Detailed quote information linked to opportunities';
COMMENT ON TABLE insurance_policies IS 'Active insurance policies for contacts';
COMMENT ON TABLE insurance_claims IS 'Claims tracking for insurance policies';

COMMENT ON COLUMN insurance_profiles.auto_data IS 'Vehicle and driver information (JSONB)';
COMMENT ON COLUMN insurance_profiles.home_data IS 'Property and home insurance details (JSONB)';
COMMENT ON COLUMN insurance_profiles.commercial_data IS 'Business insurance information (JSONB)';
COMMENT ON COLUMN insurance_quotes.coverage_details IS 'Flexible coverage structure for different insurance types';
COMMENT ON COLUMN insurance_policies.claims_count IS 'Automatically maintained count of claims for this policy';
