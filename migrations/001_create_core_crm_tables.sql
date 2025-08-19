-- Migration 001: Create Core CRM Tables
-- Creates the industry-agnostic core CRM structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create core CRM tables
BEGIN;

-- =====================================================
-- CONTACTS TABLE - Universal contact management
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic contact information
    name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('individual', 'business')),
    status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'client', 'inactive')),
    
    -- Address relationships
    address_id UUID REFERENCES addresses(id),
    mailing_address_id UUID REFERENCES addresses(id),
    
    -- Personal fields (for individuals)
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
    drivers_license TEXT,
    license_state TEXT,
    occupation TEXT,
    education_level TEXT,
    
    -- Business fields (for businesses)
    industry TEXT,
    tax_id TEXT,
    year_established INTEGER,
    annual_revenue NUMERIC(15,2),
    number_of_employees INTEGER,
    business_type TEXT,
    
    -- AI and CRM fields
    ai_summary TEXT,
    ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
    ai_lifetime_value NUMERIC(15,2),
    ai_churn_probability NUMERIC(5,2) CHECK (ai_churn_probability >= 0 AND ai_churn_probability <= 100),
    ai_insights JSONB DEFAULT '{}',
    
    -- CRM metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    source TEXT,
    referred_by UUID REFERENCES contacts(id),
    
    -- Contact tracking
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_contact_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- OPPORTUNITIES TABLE - Sales deals/opportunities
-- =====================================================
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    pipeline_id INTEGER REFERENCES pipelines(id),
    stage_id INTEGER REFERENCES pipeline_statuses(id),
    
    -- Opportunity details
    name TEXT NOT NULL,
    description TEXT,
    value NUMERIC(15,2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    
    -- Dates
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed-won', 'closed-lost')),
    
    -- AI fields
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_insights JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACTIVITIES TABLE - All interactions and communications
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    
    -- Activity details
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'sms', 'meeting', 'note', 'voicemail', 'social', 'letter')),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    subject TEXT,
    content TEXT,
    
    -- Call-specific fields
    duration INTEGER, -- in seconds
    call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
    
    -- Status and timing
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- AI fields
    ai_summary TEXT,
    ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
    ai_insights JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_address ON contacts(address_id);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline ON opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON opportunities(expected_close_date);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_completed_at ON activities(completed_at);

-- =====================================================
-- TRIGGERS for audit fields
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to core tables
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Ensure email uniqueness where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email_unique 
    ON contacts(email) WHERE email IS NOT NULL;

-- Ensure phone uniqueness where not null  
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_phone_unique 
    ON contacts(phone_number) WHERE phone_number IS NOT NULL;

COMMIT;

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Universal contact management - industry agnostic';
COMMENT ON TABLE opportunities IS 'Sales deals and opportunities linked to contacts';
COMMENT ON TABLE activities IS 'All interactions and communications with contacts';

COMMENT ON COLUMN contacts.status IS 'Contact progression: lead -> prospect -> client -> inactive';
COMMENT ON COLUMN contacts.contact_type IS 'Individual person or business entity';
COMMENT ON COLUMN opportunities.probability IS 'Likelihood of closing (0-100%)';
COMMENT ON COLUMN activities.type IS 'Type of interaction or communication';
COMMENT ON COLUMN activities.direction IS 'Inbound (from contact) or outbound (to contact)';
