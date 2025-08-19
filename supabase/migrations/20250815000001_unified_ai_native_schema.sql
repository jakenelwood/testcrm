-- 🚀 Unified AI-Native Insurance CRM Schema
-- Implements the optimized schema from the CRM_Data_Structure_Optimization.txt report
-- Clean implementation with no legacy data migration needed

BEGIN;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Contact lifecycle stages (replaces separate clients/leads tables)
CREATE TYPE contact_lifecycle_stage AS ENUM (
   'lead',
   'opportunity_contact', 
   'customer',
   'churned'
);

-- Opportunity stages for insurance quotes/policies
CREATE TYPE opportunity_stage AS ENUM (
   'prospecting',
   'qualification', 
   'proposal',
   'negotiation',
   'closed_won',
   'closed_lost'
);

-- Interaction types for activity stream
CREATE TYPE interaction_type AS ENUM (
   'email',
   'call', 
   'meeting',
   'note',
   'task_completed',
   'sms',
   'quote_generated',
   'policy_issued'
);

-- =============================================================================
-- MULTI-TENANCY FOUNDATION
-- =============================================================================

-- Workspaces table for multi-tenant isolation
CREATE TABLE workspaces (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   -- Insurance agency specific fields
   agency_license TEXT,
   agency_type TEXT CHECK (agency_type IN ('Independent', 'Captive', 'Direct')),
   primary_lines JSONB DEFAULT '[]', -- ["auto", "home", "commercial"]
   -- Settings
   timezone TEXT DEFAULT 'America/Chicago',
   date_format TEXT DEFAULT 'MM/DD/YYYY',
   currency TEXT DEFAULT 'USD',
   -- Subscription info
   subscription_tier TEXT DEFAULT 'basic',
   max_users INTEGER DEFAULT 5,
   max_contacts INTEGER DEFAULT 1000,
   -- Metadata
   settings JSONB DEFAULT '{}',
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced users table with workspace reference
CREATE TABLE users (
   id UUID PRIMARY KEY, -- References auth.users.id
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   email TEXT UNIQUE NOT NULL,
   full_name TEXT,
   avatar_url TEXT,
   -- Role-based access control
   role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'manager', 'agent', 'csr')),
   permissions JSONB DEFAULT '{}',
   -- Insurance agent specific
   license_number TEXT,
   license_state TEXT,
   license_expiration DATE,
   specializations TEXT[], -- ["auto", "home", "commercial", "life"]
   -- Preferences
   timezone TEXT DEFAULT 'America/Chicago',
   notification_preferences JSONB DEFAULT '{}',
   -- Status
   is_active BOOLEAN DEFAULT true,
   last_login_at TIMESTAMPTZ,
   -- Metadata
   metadata JSONB DEFAULT '{}',
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CORE ENTITIES: ACCOUNTS & CONTACTS (UNIFIED MODEL)
-- =============================================================================

-- Accounts table for B2B insurance relationships (commercial clients)
CREATE TABLE accounts (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   website TEXT,
   industry TEXT,
   employee_count INTEGER,
   annual_revenue DECIMAL(15,2),
   -- Address info
   address TEXT,
   city TEXT,
   state TEXT,
   zip_code TEXT,
   -- Business details
   business_type TEXT,
   tax_id TEXT,
   duns_number TEXT,
   -- Insurance specific
   current_carriers JSONB DEFAULT '{}', -- {"workers_comp": "Carrier A", "general_liability": "Carrier B"}
   policy_renewal_dates JSONB DEFAULT '{}',
   risk_profile JSONB DEFAULT '{}',
   -- AI fields
   summary_embedding VECTOR(1024), -- High-level relationship summary
   ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
   ai_lifetime_value DECIMAL(15,2),
   ai_insights JSONB DEFAULT '{}',
   -- Flexible data
   custom_fields JSONB DEFAULT '{}',
   tags TEXT[],
   -- Ownership
   owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unified contacts table (replaces separate clients/leads tables)
CREATE TABLE contacts (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   -- B2B relationship (NULL for B2C)
   account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
   -- Basic contact info
   first_name TEXT,
   last_name TEXT,
   email TEXT,
   phone TEXT,
   mobile_phone TEXT,
   -- Address
   address TEXT,
   city TEXT,
   state TEXT,
   zip_code TEXT,
   -- Personal details (for individual insurance)
   date_of_birth DATE,
   gender TEXT,
   marital_status TEXT,
   occupation TEXT,
   -- Business context (for B2B)
   job_title TEXT,
   department TEXT,
   -- Insurance specific
   drivers_license TEXT,
   license_state TEXT,
   ssn_last_four TEXT, -- For identity verification
   -- Lifecycle management
   lifecycle_stage contact_lifecycle_stage NOT NULL DEFAULT 'lead',
   lead_source TEXT,
   referred_by UUID REFERENCES contacts(id),
   -- AI fields
   summary_embedding VECTOR(1024), -- Individual relationship summary
   ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
   ai_lifetime_value DECIMAL(15,2),
   ai_churn_probability DECIMAL(5,2) CHECK (ai_churn_probability >= 0 AND ai_churn_probability <= 100),
   ai_insights JSONB DEFAULT '{}',
   -- Communication preferences
   preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'mail')),
   communication_preferences JSONB DEFAULT '{}',
   -- Flexible data
   custom_fields JSONB DEFAULT '{}',
   tags TEXT[],
   -- Contact tracking
   last_contact_at TIMESTAMPTZ,
   next_contact_at TIMESTAMPTZ,
   -- Ownership
   owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES FOR CORE ENTITIES
-- =============================================================================

-- Workspace indexes
CREATE INDEX idx_workspaces_name ON workspaces(name);

-- User indexes
CREATE INDEX idx_users_workspace_id ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Account indexes
CREATE INDEX idx_accounts_workspace_id ON accounts(workspace_id);
CREATE INDEX idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX idx_accounts_name ON accounts(workspace_id, name);
CREATE INDEX idx_accounts_industry ON accounts(industry);

-- Contact indexes (optimized for common queries)
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX idx_contacts_workspace_lifecycle ON contacts(workspace_id, lifecycle_stage, created_at DESC);
CREATE INDEX idx_contacts_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_name ON contacts(workspace_id, first_name, last_name);

-- Vector indexes (HNSW for optimal performance)
CREATE INDEX idx_accounts_summary_embedding_hnsw ON accounts 
USING hnsw (summary_embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

CREATE INDEX idx_contacts_summary_embedding_hnsw ON contacts 
USING hnsw (summary_embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Unique constraints
ALTER TABLE contacts ADD CONSTRAINT unique_contact_email_in_workspace 
UNIQUE (workspace_id, email) DEFERRABLE INITIALLY DEFERRED;

-- Check constraints
ALTER TABLE accounts ADD CONSTRAINT chk_accounts_valid_risk_score 
CHECK (ai_risk_score IS NULL OR (ai_risk_score >= 0 AND ai_risk_score <= 100));

ALTER TABLE contacts ADD CONSTRAINT chk_contacts_valid_risk_score 
CHECK (ai_risk_score IS NULL OR (ai_risk_score >= 0 AND ai_risk_score <= 100));

ALTER TABLE contacts ADD CONSTRAINT chk_contacts_valid_churn_probability
CHECK (ai_churn_probability IS NULL OR (ai_churn_probability >= 0 AND ai_churn_probability <= 100));

-- =============================================================================
-- SALES PIPELINE & OPPORTUNITIES
-- =============================================================================

-- Opportunities table for insurance quotes and policies
CREATE TABLE opportunities (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   -- Relationship (B2B uses account_id, B2C uses contact_id)
   account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
   contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
   -- Pipeline stage
   stage opportunity_stage NOT NULL DEFAULT 'prospecting',
   -- Financial details
   amount DECIMAL(12, 2), -- Total premium or policy value
   probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
   close_date DATE,
   -- Insurance specific
   insurance_types TEXT[], -- ["auto", "home", "umbrella"]
   policy_term INTEGER DEFAULT 12, -- months
   effective_date DATE,
   expiration_date DATE,
   -- Premium breakdown
   premium_breakdown JSONB DEFAULT '{}', -- {"auto": 1200, "home": 800}
   coverage_details JSONB DEFAULT '{}',
   -- Competition and market
   competing_carriers TEXT[],
   current_carrier TEXT,
   current_premium DECIMAL(10,2),
   -- AI insights
   ai_win_probability DECIMAL(5,2),
   ai_recommended_actions JSONB DEFAULT '[]',
   ai_risk_factors JSONB DEFAULT '[]',
   -- Flexible data
   custom_fields JSONB DEFAULT '{}',
   tags TEXT[],
   notes TEXT,
   -- Ownership and tracking
   owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
   source TEXT, -- "referral", "web", "cold_call", etc.
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   stage_changed_at TIMESTAMPTZ DEFAULT now(),
   -- Constraint: must have either account or contact
   CONSTRAINT chk_opportunity_has_target CHECK (account_id IS NOT NULL OR contact_id IS NOT NULL)
);

-- Junction table for B2B opportunities with multiple contacts
CREATE TABLE opportunity_participants (
   opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
   contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   role TEXT, -- 'Decision Maker', 'Influencer', 'Champion', 'Gatekeeper'
   influence_level INTEGER DEFAULT 50 CHECK (influence_level >= 0 AND influence_level <= 100),
   PRIMARY KEY (opportunity_id, contact_id)
);

-- =============================================================================
-- ACTIVITY STREAM (PARTITIONED FOR PERFORMANCE)
-- =============================================================================

-- Partitioned interactions table for scalable activity tracking
CREATE TABLE interactions (
   id UUID DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL,
   -- Relationships
   contact_id UUID,
   account_id UUID,
   opportunity_id UUID,
   user_id UUID, -- User who logged the interaction
   -- Interaction details
   type interaction_type NOT NULL,
   subject TEXT,
   content TEXT,
   direction TEXT CHECK (direction IN ('inbound', 'outbound')),
   -- Communication specific
   duration_minutes INTEGER, -- for calls/meetings
   outcome TEXT,
   sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
   -- AI analysis
   embedding VECTOR(1024), -- Content embedding for semantic search
   ai_summary TEXT,
   ai_sentiment_score DECIMAL(3,2) CHECK (ai_sentiment_score >= -1 AND ai_sentiment_score <= 1),
   ai_entities JSONB DEFAULT '[]', -- Extracted entities (people, companies, products)
   ai_action_items JSONB DEFAULT '[]',
   ai_follow_up_suggestions JSONB DEFAULT '[]',
   -- Metadata
   metadata JSONB DEFAULT '{}', -- Email headers, call details, etc.
   external_id TEXT, -- ID from external system (RingCentral, email provider)
   -- Timestamps
   interacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   -- Composite primary key including partition key
   PRIMARY KEY (id, interacted_at)
) PARTITION BY RANGE (interacted_at);

-- Create initial partitions (automated partition management should be implemented)
CREATE TABLE interactions_2025_08 PARTITION OF interactions
   FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE interactions_2025_09 PARTITION OF interactions
   FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- =============================================================================
-- SUPPORTING ACTIVITY TABLES
-- =============================================================================

-- Notes table for unstructured observations
CREATE TABLE notes (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   -- Relationships
   contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
   account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
   opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   -- Content
   title TEXT,
   content TEXT NOT NULL,
   note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'research', 'follow_up')),
   -- AI analysis
   embedding VECTOR(1024),
   ai_summary TEXT,
   ai_tags TEXT[],
   -- Metadata
   is_private BOOLEAN DEFAULT false,
   tags TEXT[],
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   -- Constraint: must be related to something
   CONSTRAINT chk_note_has_target CHECK (contact_id IS NOT NULL OR account_id IS NOT NULL OR opportunity_id IS NOT NULL)
);

-- Tasks table for follow-up and workflow management
CREATE TABLE tasks (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   title TEXT NOT NULL,
   description TEXT,
   -- Relationships
   contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
   account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
   opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
   -- Task details
   task_type TEXT DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'quote', 'meeting', 'call', 'email', 'research')),
   priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
   -- Scheduling
   due_date DATE,
   due_time TIME,
   estimated_duration_minutes INTEGER,
   -- Assignment
   assigned_to_id UUID REFERENCES users(id) ON DELETE CASCADE,
   created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
   -- AI suggestions
   ai_generated BOOLEAN DEFAULT false,
   ai_priority_score INTEGER CHECK (ai_priority_score >= 0 AND ai_priority_score <= 100),
   ai_suggested_actions JSONB DEFAULT '[]',
   -- Metadata
   tags TEXT[],
   metadata JSONB DEFAULT '{}',
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   completed_at TIMESTAMPTZ
);

-- Documents table for file attachments
CREATE TABLE documents (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
   -- File details
   file_name TEXT NOT NULL,
   file_path TEXT NOT NULL, -- Path in Supabase Storage
   file_size_bytes BIGINT,
   mime_type TEXT,
   file_hash TEXT, -- For deduplication
   -- Relationships
   contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
   account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
   opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
   uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
   -- Document classification
   document_type TEXT CHECK (document_type IN ('quote', 'policy', 'application', 'claim', 'correspondence', 'other')),
   -- AI analysis
   embedding VECTOR(1024), -- For document content search
   ai_extracted_text TEXT,
   ai_summary TEXT,
   ai_document_classification JSONB DEFAULT '{}',
   ai_key_entities JSONB DEFAULT '[]',
   -- Metadata
   tags TEXT[],
   is_confidential BOOLEAN DEFAULT false,
   retention_date DATE, -- For compliance
   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
