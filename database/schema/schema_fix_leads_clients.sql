-- 🔧 Schema Fix: Correct Lead → Client Relationship
-- Based on business requirements clarification

-- =============================================================================
-- CORRECTED LEADS TABLE (Primary entity for prospects)
-- =============================================================================

DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lead status and pipeline
  status_id INTEGER REFERENCES lead_statuses(id),
  pipeline_id INTEGER NOT NULL REFERENCES pipelines(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Contact information (will migrate to client)
  lead_type TEXT NOT NULL CHECK (lead_type IN ('Personal', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address_id UUID REFERENCES addresses(id),
  mailing_address_id UUID REFERENCES addresses(id),
  
  -- Personal lead fields
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  referred_by TEXT,
  
  -- Business lead fields
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15,2),
  number_of_employees INTEGER,
  
  -- Insurance information
  insurance_type_id INTEGER REFERENCES insurance_types(id),
  current_carrier TEXT,
  premium DECIMAL(10,2),
  auto_premium DECIMAL(10,2),
  home_premium DECIMAL(10,2),
  specialty_premium DECIMAL(10,2),
  commercial_premium DECIMAL(10,2),
  
  -- Insurance-specific JSONB data
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  commercial_data JSONB,
  liability_data JSONB,
  additional_insureds JSONB,
  additional_locations JSONB,
  
  -- AI fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_quote_recommendation TEXT,
  ai_follow_up_priority INTEGER,
  
  -- Conversion tracking
  converted_to_client_id UUID REFERENCES clients(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  is_converted BOOLEAN DEFAULT FALSE,
  
  -- Flexible data
  metadata JSONB,
  tags TEXT[],
  notes TEXT,
  
  -- Import tracking
  source TEXT DEFAULT 'Manual Entry',
  import_file_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_changed_at TIMESTAMP WITH TIME ZONE,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE,
  quote_generated_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  lost_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- CORRECTED CLIENTS TABLE (Converted leads who purchased policies)
-- =============================================================================

DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to original lead (required)
  original_lead_id UUID NOT NULL REFERENCES leads(id),
  
  -- Client type (inherited from lead)
  client_type TEXT NOT NULL CHECK (client_type IN ('Personal', 'Business')),
  
  -- Contact information (migrated from lead)
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address_id UUID REFERENCES addresses(id),
  mailing_address_id UUID REFERENCES addresses(id),
  
  -- Personal client fields (migrated from lead)
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  referred_by TEXT,
  
  -- Business client fields (migrated from lead)
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15,2),
  number_of_employees INTEGER,
  
  -- Client-specific fields (post-conversion)
  primary_policy_number TEXT,
  primary_policy_type TEXT,
  primary_carrier TEXT,
  primary_premium DECIMAL(10,2),
  renewal_date DATE,
  
  -- Multiple policies support
  policies JSONB, -- Array of policy objects
  total_premium DECIMAL(10,2),
  
  -- Client management
  account_manager_id UUID REFERENCES users(id),
  client_since DATE DEFAULT CURRENT_DATE,
  last_policy_review DATE,
  next_policy_review DATE,
  
  -- AI fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_risk_score INTEGER,
  ai_lifetime_value DECIMAL(15,2),
  ai_retention_score INTEGER,
  
  -- Flexible data
  metadata JSONB,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- POLICIES TABLE (For multiple policies per client)
-- =============================================================================

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Policy details
  policy_number TEXT NOT NULL UNIQUE,
  policy_type TEXT NOT NULL, -- 'Auto', 'Home', 'Commercial', etc.
  carrier TEXT NOT NULL,
  premium DECIMAL(10,2) NOT NULL,
  
  -- Policy dates
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  renewal_date DATE,
  
  -- Policy data
  coverage_details JSONB,
  deductibles JSONB,
  limits JSONB,
  
  -- Status
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Cancelled', 'Expired', 'Pending')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- UPDATE SUPPORTING TABLES
-- =============================================================================

-- Update homes, vehicles, specialty_items to reference leads OR clients
ALTER TABLE homes DROP COLUMN IF EXISTS client_id;
ALTER TABLE homes ADD COLUMN entity_type TEXT CHECK (entity_type IN ('lead', 'client'));
ALTER TABLE homes ADD COLUMN entity_id UUID;

ALTER TABLE vehicles DROP COLUMN IF EXISTS client_id;
ALTER TABLE vehicles ADD COLUMN entity_type TEXT CHECK (entity_type IN ('lead', 'client'));
ALTER TABLE vehicles ADD COLUMN entity_id UUID;

ALTER TABLE specialty_items DROP COLUMN IF EXISTS client_id;
ALTER TABLE specialty_items ADD COLUMN entity_type TEXT CHECK (entity_type IN ('lead', 'client'));
ALTER TABLE specialty_items ADD COLUMN entity_id UUID;

-- Update communications and notes
ALTER TABLE communications DROP COLUMN IF EXISTS client_id;
ALTER TABLE communications ADD COLUMN entity_type TEXT CHECK (entity_type IN ('lead', 'client'));
ALTER TABLE communications ADD COLUMN entity_id UUID;

ALTER TABLE notes DROP COLUMN IF EXISTS client_id;
ALTER TABLE notes ADD COLUMN entity_type TEXT CHECK (entity_type IN ('lead', 'client'));
ALTER TABLE notes ADD COLUMN entity_id UUID;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Lead indexes
CREATE INDEX idx_leads_status_id ON leads(status_id);
CREATE INDEX idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_is_converted ON leads(is_converted);
CREATE INDEX idx_leads_converted_at ON leads(converted_at);
CREATE INDEX idx_leads_lead_type ON leads(lead_type);

-- Client indexes
CREATE INDEX idx_clients_original_lead_id ON clients(original_lead_id);
CREATE INDEX idx_clients_client_type ON clients(client_type);
CREATE INDEX idx_clients_account_manager_id ON clients(account_manager_id);
CREATE INDEX idx_clients_renewal_date ON clients(renewal_date);

-- Policy indexes
CREATE INDEX idx_policies_client_id ON policies(client_id);
CREATE INDEX idx_policies_policy_type ON policies(policy_type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_renewal_date ON policies(renewal_date);

-- Entity relationship indexes
CREATE INDEX idx_homes_entity ON homes(entity_type, entity_id);
CREATE INDEX idx_vehicles_entity ON vehicles(entity_type, entity_id);
CREATE INDEX idx_specialty_items_entity ON specialty_items(entity_type, entity_id);
CREATE INDEX idx_communications_entity ON communications(entity_type, entity_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
