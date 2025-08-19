-- 🏠🚗 Insurance-Specific Tables and Indexes
-- Extends the unified schema with insurance domain expertise

BEGIN;

-- =============================================================================
-- INSURANCE LOOKUP TABLES
-- =============================================================================

-- Insurance types with AI-enhanced form schemas
CREATE TABLE insurance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('personal', 'commercial', 'specialty')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  icon_name TEXT,
  -- Form configuration
  form_schema JSONB DEFAULT '{}', -- Dynamic form fields
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  -- AI configuration
  ai_prompt_template TEXT,
  ai_risk_factors JSONB DEFAULT '{}',
  ai_pricing_factors JSONB DEFAULT '{}',
  -- Display
  display_order INTEGER,
  color_hex TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipelines for different insurance sales processes
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pipeline_type TEXT DEFAULT 'sales' CHECK (pipeline_type IN ('sales', 'service', 'claims', 'renewal')),
  insurance_category TEXT CHECK (insurance_category IN ('personal', 'commercial', 'specialty')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  -- Configuration
  stages JSONB DEFAULT '[]', -- Array of stage definitions
  automation_rules JSONB DEFAULT '{}',
  ai_optimization_enabled BOOLEAN DEFAULT false,
  -- Metrics
  target_conversion_rate DECIMAL(5,2),
  average_cycle_days INTEGER,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ASSET TABLES (LINKED TO UNIFIED CONTACTS)
-- =============================================================================

-- Vehicles table for auto insurance
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  -- Vehicle identification
  vin TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  body_style TEXT,
  -- Registration
  license_plate TEXT,
  registration_state TEXT,
  registration_expiration DATE,
  -- Ownership
  ownership_type TEXT CHECK (ownership_type IN ('owned', 'financed', 'leased')),
  lienholder_name TEXT,
  lienholder_address TEXT,
  -- Usage
  annual_mileage INTEGER,
  primary_use TEXT CHECK (primary_use IN ('pleasure', 'commute', 'business', 'farm')),
  garage_type TEXT CHECK (garage_type IN ('garage', 'carport', 'driveway', 'street')),
  -- Safety and features
  safety_features JSONB DEFAULT '[]',
  anti_theft_devices JSONB DEFAULT '[]',
  modifications JSONB DEFAULT '[]',
  -- Insurance history
  current_coverage JSONB DEFAULT '{}',
  claims_history JSONB DEFAULT '[]',
  -- AI risk assessment
  ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_risk_factors JSONB DEFAULT '[]',
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Properties table for home/property insurance
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  -- Property identification
  property_type TEXT CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'mobile_home', 'rental', 'commercial')),
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  county TEXT,
  -- Property details
  year_built INTEGER,
  square_feet INTEGER,
  lot_size_acres DECIMAL(8,2),
  stories INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  -- Construction
  construction_type TEXT,
  roof_type TEXT,
  roof_age INTEGER,
  foundation_type TEXT,
  exterior_walls TEXT,
  -- Systems
  heating_type TEXT,
  cooling_type TEXT,
  electrical_type TEXT,
  plumbing_type TEXT,
  -- Safety features
  smoke_detectors BOOLEAN DEFAULT false,
  fire_extinguishers BOOLEAN DEFAULT false,
  security_system BOOLEAN DEFAULT false,
  sprinkler_system BOOLEAN DEFAULT false,
  -- Ownership and occupancy
  ownership_type TEXT CHECK (ownership_type IN ('owner_occupied', 'rental', 'vacant', 'seasonal')),
  occupancy_type TEXT,
  mortgage_company TEXT,
  -- Hazards and risks
  distance_to_fire_station_miles DECIMAL(5,2),
  distance_to_coast_miles DECIMAL(5,2),
  flood_zone TEXT,
  wildfire_risk TEXT CHECK (wildfire_risk IN ('low', 'moderate', 'high')),
  earthquake_risk TEXT CHECK (earthquake_risk IN ('low', 'moderate', 'high')),
  -- Insurance details
  current_coverage JSONB DEFAULT '{}',
  claims_history JSONB DEFAULT '[]',
  replacement_cost DECIMAL(12,2),
  market_value DECIMAL(12,2),
  -- AI risk assessment
  ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_risk_factors JSONB DEFAULT '[]',
  ai_replacement_cost_estimate DECIMAL(12,2),
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Specialty items for valuable items insurance
CREATE TABLE specialty_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  -- Item details
  item_type TEXT CHECK (item_type IN ('jewelry', 'art', 'collectibles', 'electronics', 'musical_instruments', 'firearms', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  -- Valuation
  appraised_value DECIMAL(12,2),
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  appraisal_date DATE,
  appraiser_name TEXT,
  -- Documentation
  has_receipt BOOLEAN DEFAULT false,
  has_appraisal BOOLEAN DEFAULT false,
  has_photos BOOLEAN DEFAULT false,
  certificate_number TEXT,
  -- Storage and security
  storage_location TEXT,
  security_measures JSONB DEFAULT '[]',
  -- Insurance
  current_coverage JSONB DEFAULT '{}',
  claims_history JSONB DEFAULT '[]',
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Opportunity indexes
CREATE INDEX idx_opportunities_workspace_id ON opportunities(workspace_id);
CREATE INDEX idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_opportunities_stage ON opportunities(workspace_id, stage, close_date);
CREATE INDEX idx_opportunities_amount ON opportunities(workspace_id, amount DESC);

-- Opportunity participants
CREATE INDEX idx_opp_participants_workspace_id ON opportunity_participants(workspace_id);
CREATE INDEX idx_opp_participants_contact_id ON opportunity_participants(contact_id);

-- Interactions indexes (on partitions)
CREATE INDEX idx_interactions_2025_08_workspace_contact ON interactions_2025_08(workspace_id, contact_id, interacted_at DESC);
CREATE INDEX idx_interactions_2025_08_account ON interactions_2025_08(account_id, interacted_at DESC);
CREATE INDEX idx_interactions_2025_08_type ON interactions_2025_08(workspace_id, type, interacted_at DESC);
CREATE INDEX idx_interactions_2025_08_embedding_hnsw ON interactions_2025_08 
USING hnsw (embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

CREATE INDEX idx_interactions_2025_09_workspace_contact ON interactions_2025_09(workspace_id, contact_id, interacted_at DESC);
CREATE INDEX idx_interactions_2025_09_account ON interactions_2025_09(account_id, interacted_at DESC);
CREATE INDEX idx_interactions_2025_09_type ON interactions_2025_09(workspace_id, type, interacted_at DESC);
CREATE INDEX idx_interactions_2025_09_embedding_hnsw ON interactions_2025_09 
USING hnsw (embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

-- Notes indexes
CREATE INDEX idx_notes_workspace_id ON notes(workspace_id);
CREATE INDEX idx_notes_contact_id ON notes(contact_id, created_at DESC);
CREATE INDEX idx_notes_account_id ON notes(account_id, created_at DESC);
CREATE INDEX idx_notes_embedding_hnsw ON notes 
USING hnsw (embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

-- Tasks indexes
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to_pending ON tasks(assigned_to_id, due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_contact_id ON tasks(contact_id, created_at DESC);
CREATE INDEX idx_tasks_due_date ON tasks(workspace_id, due_date) WHERE status IN ('pending', 'in_progress');

-- Documents indexes
CREATE INDEX idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX idx_documents_contact_id ON documents(contact_id, created_at DESC);
CREATE INDEX idx_documents_account_id ON documents(account_id, created_at DESC);
CREATE INDEX idx_documents_type ON documents(workspace_id, document_type, created_at DESC);
CREATE INDEX idx_documents_embedding_hnsw ON documents 
USING hnsw (embedding vector_ip_ops) WITH (m = 32, ef_construction = 128);

-- Asset table indexes
CREATE INDEX idx_vehicles_workspace_id ON vehicles(workspace_id);
CREATE INDEX idx_vehicles_contact_id ON vehicles(contact_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin) WHERE vin IS NOT NULL;

CREATE INDEX idx_properties_workspace_id ON properties(workspace_id);
CREATE INDEX idx_properties_contact_id ON properties(contact_id);
CREATE INDEX idx_properties_address ON properties(workspace_id, address);

CREATE INDEX idx_specialty_items_workspace_id ON specialty_items(workspace_id);
CREATE INDEX idx_specialty_items_contact_id ON specialty_items(contact_id);
CREATE INDEX idx_specialty_items_type ON specialty_items(workspace_id, item_type);

COMMIT;
