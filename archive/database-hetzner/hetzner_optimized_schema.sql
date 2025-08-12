-- 🌱 GardenOS CRM Database Schema - Optimized for Hetzner
-- Clean, efficient schema with proper naming and indexing
-- Supports both B2C and B2B clients with AI-ready architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- CORE LOOKUP TABLES
-- =============================================================================

-- Lead statuses with AI action templates
CREATE TABLE lead_statuses (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  color_hex TEXT,
  icon_name TEXT,
  ai_action_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance types with form schemas
CREATE TABLE insurance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_personal BOOLEAN DEFAULT TRUE,
  is_commercial BOOLEAN DEFAULT FALSE,
  description TEXT,
  icon_name TEXT,
  form_schema JSONB,
  ai_prompt_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipelines for lead progression
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  lead_type TEXT DEFAULT 'Personal' CHECK (lead_type IN ('Personal', 'Business')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline statuses
CREATE TABLE pipeline_statuses (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL,
  color_hex TEXT,
  icon_name TEXT,
  ai_action_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ADDRESS MANAGEMENT
-- =============================================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  type TEXT CHECK (type IN ('Physical', 'Mailing', 'Business', 'Location')),
  is_verified BOOLEAN DEFAULT FALSE,
  geocode_lat DECIMAL(10,8),
  geocode_lng DECIMAL(11,8),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- USER MANAGEMENT
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CLIENT MANAGEMENT (Renamed from leads_contact_info)
-- =============================================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address_id UUID REFERENCES addresses(id),
  mailing_address_id UUID REFERENCES addresses(id),

  -- Individual-specific fields
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  referred_by TEXT,

  -- Business-specific fields
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15,2),
  number_of_employees INTEGER,

  -- AI fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_risk_score INTEGER,
  ai_lifetime_value DECIMAL(15,2),

  -- Flexible data
  metadata JSONB,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE,
  converted_from_lead_id UUID
);

-- =============================================================================
-- LEAD MANAGEMENT (Renamed from leads_ins_info)
-- =============================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status_id INTEGER REFERENCES lead_statuses(id),
  insurance_type_id INTEGER REFERENCES insurance_types(id),
  pipeline_id INTEGER NOT NULL REFERENCES pipelines(id),
  assigned_to UUID REFERENCES users(id),

  -- Core insurance fields
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
-- GARDENOS AI AGENT TABLES
-- =============================================================================

-- AI agents for LangGraph instances
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'follow_up', 'insight', 'design', 'support'
  description TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory for persistent context
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'client', 'lead', 'global'
  entity_id UUID,
  memory_type TEXT NOT NULL, -- 'conversation', 'insight', 'preference'
  content TEXT,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Agent subscriptions for proactive monitoring
CREATE TABLE agent_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL, -- 'lead_status_change', 'client_activity', 'time_based'
  entity_filter JSONB, -- Conditions for triggering
  action_config JSONB, -- What to do when triggered
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI interactions log
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  type TEXT CHECK (type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse')),
  source TEXT CHECK (source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware')),
  content TEXT,
  ai_response TEXT,
  summary TEXT,
  model_used TEXT,
  temperature DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SCHEMA VERSIONING
-- =============================================================================

CREATE TABLE schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SUPPORTING TABLES
-- =============================================================================

-- Communication tracking
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  type TEXT NOT NULL, -- 'call', 'email', 'sms', 'meeting'
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  subject TEXT,
  content TEXT,
  status TEXT,
  duration INTEGER, -- in minutes
  outcome TEXT,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_entities JSONB,
  ai_action_items JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  content TEXT NOT NULL,
  note_type TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_entities JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets (homes, vehicles, specialty items)
CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  construction_type TEXT,
  roof_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  primary_use TEXT,
  annual_mileage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  name TEXT NOT NULL,
  value DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Renters', 'Specialty')),
  carrier TEXT,
  paid_in_full_amount DECIMAL(10,2),
  monthly_payment_amount DECIMAL(10,2),
  contract_term TEXT CHECK (contract_term IN ('6mo', '12mo')),
  quote_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RingCentral integration
CREATE TABLE ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE
);

-- User phone preferences
CREATE TABLE user_phone_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  selected_phone_number TEXT NOT NULL,
  phone_number_label TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Core business query indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone_number);
CREATE INDEX idx_clients_type ON clients(client_type);
CREATE INDEX idx_clients_created_at ON clients(created_at);

CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_status_id ON leads(status_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_source ON leads(source);

-- JSONB indexes for flexible data
CREATE INDEX idx_leads_auto_data ON leads USING GIN (auto_data);
CREATE INDEX idx_leads_home_data ON leads USING GIN (home_data);
CREATE INDEX idx_leads_metadata ON leads USING GIN (metadata);
CREATE INDEX idx_clients_metadata ON clients USING GIN (metadata);

-- AI and vector indexes
CREATE INDEX idx_agent_memory_embedding ON agent_memory USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_agent_memory_entity ON agent_memory(entity_type, entity_id);
CREATE INDEX idx_ai_interactions_client_id ON ai_interactions(client_id);
CREATE INDEX idx_ai_interactions_lead_id ON ai_interactions(lead_id);

-- Communication indexes
CREATE INDEX idx_communications_client_id ON communications(client_id);
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_created_at ON communications(created_at);

-- Asset indexes
CREATE INDEX idx_homes_client_id ON homes(client_id);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_specialty_items_client_id ON specialty_items(client_id);

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert default lead statuses
INSERT INTO lead_statuses (value, description, display_order, color_hex) VALUES
('New', 'Newly created lead', 1, '#3B82F6'),
('Contacted', 'Initial contact made', 2, '#F59E0B'),
('Qualified', 'Lead has been qualified', 3, '#8B5CF6'),
('Quoted', 'Quote has been provided', 4, '#06B6D4'),
('Sold', 'Lead converted to sale', 5, '#10B981'),
('Lost', 'Lead was not converted', 6, '#EF4444');

-- Insert insurance types
INSERT INTO insurance_types (name, is_personal, is_commercial, description) VALUES
('Auto', true, false, 'Personal auto insurance'),
('Home', true, false, 'Homeowners insurance'),
('Renters', true, false, 'Renters insurance'),
('Specialty', true, false, 'Specialty items insurance'),
('Commercial Auto', false, true, 'Commercial vehicle insurance'),
('General Liability', false, true, 'Business general liability');

-- Insert default pipeline
INSERT INTO pipelines (name, description, is_default, display_order, lead_type) VALUES
('Alpha Personal', 'Personal insurance pipeline', true, 1, 'Personal'),
('Bravo Business', 'Business insurance pipeline', false, 2, 'Business');

-- Insert pipeline statuses for Alpha pipeline
INSERT INTO pipeline_statuses (pipeline_id, name, description, display_order, color_hex) VALUES
(1, 'New Lead', 'Fresh lead in system', 1, '#3B82F6'),
(1, 'Contacted', 'Initial contact made', 2, '#F59E0B'),
(1, 'Qualified', 'Lead qualified for quote', 3, '#8B5CF6'),
(1, 'Quoted', 'Quote provided', 4, '#06B6D4'),
(1, 'Sold', 'Policy sold', 5, '#10B981'),
(1, 'Lost', 'Lead lost', 6, '#EF4444');

-- Insert default AI agents for GardenOS
INSERT INTO ai_agents (name, role, description, config) VALUES
('Follow-up Agent', 'follow_up', 'Manages automated follow-ups with leads and clients', '{"model": "gpt-4", "temperature": 0.7}'),
('Insight Agent', 'insight', 'Analyzes client data and provides insights', '{"model": "gpt-4", "temperature": 0.3}'),
('Support Agent', 'support', 'Handles customer support inquiries', '{"model": "gpt-3.5-turbo", "temperature": 0.5}');

-- Record initial schema version
INSERT INTO schema_versions (version, description)
VALUES ('1.0.0', 'Initial GardenOS optimized schema for Hetzner');
